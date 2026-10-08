package postgres

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	appguest "github.com/mula/mula/internal/application/guest"
	"github.com/mula/mula/internal/domain/guest"
)

type GuestRepo struct{ pool *pgxpool.Pool }

// newGuestToken: 128-bit crypto-random, URL-safe. Unguessable → the token is the capability.
func newGuestToken() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return base64.RawURLEncoding.EncodeToString(b)
}

func NewGuestRepo(pool *pgxpool.Pool) *GuestRepo { return &GuestRepo{pool: pool} }

// g.* + group name + rsvp status/party (defaults when no rsvp row)
const guestSelect = `
  g.id, g.event_id, g.group_id, gg.name, g.name, g.email, g.phone, g.plus_ones, g.vip,
  g.opened_at, g.token, COALESCE(r.status,'pending'), COALESCE(r.party_size,0), g.table_label, g.notes, g.invited_at, g.created_at, g.updated_at
  FROM guests g
  LEFT JOIN guest_groups gg ON gg.id = g.group_id
  LEFT JOIN rsvps r ON r.guest_id = g.id`

func scanGuest(row pgx.Row) (*guest.Guest, error) {
	var x guest.Guest
	if err := row.Scan(&x.ID, &x.EventID, &x.GroupID, &x.GroupName, &x.Name, &x.Email, &x.Phone,
		&x.PlusOnes, &x.VIP, &x.OpenedAt, &x.Token, &x.RSVPStatus, &x.PartySize, &x.TableLabel, &x.Notes, &x.InvitedAt, &x.CreatedAt, &x.UpdatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, guest.ErrNotFound
		}
		return nil, err
	}
	return &x, nil
}

func (r *GuestRepo) List(ctx context.Context, eventID string) ([]guest.Guest, error) {
	if err := r.backfillTokens(ctx, eventID); err != nil {
		return nil, err
	}
	rows, err := r.pool.Query(ctx, `SELECT `+guestSelect+` WHERE g.event_id=$1 AND g.deleted_at IS NULL ORDER BY g.created_at`, eventID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []guest.Guest{}
	for rows.Next() {
		var x guest.Guest
		if err := rows.Scan(&x.ID, &x.EventID, &x.GroupID, &x.GroupName, &x.Name, &x.Email, &x.Phone,
			&x.PlusOnes, &x.VIP, &x.OpenedAt, &x.Token, &x.RSVPStatus, &x.PartySize, &x.TableLabel, &x.Notes, &x.InvitedAt, &x.CreatedAt, &x.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, x)
	}
	return out, rows.Err()
}

func (r *GuestRepo) Get(ctx context.Context, id string) (*guest.Guest, error) {
	return scanGuest(r.pool.QueryRow(ctx, `SELECT `+guestSelect+` WHERE g.id=$1 AND g.deleted_at IS NULL`, id))
}

func (r *GuestRepo) Create(ctx context.Context, eventID string, in appguest.GuestInput) (*guest.Guest, error) {
	var id string
	err := r.pool.QueryRow(ctx,
		`INSERT INTO guests (event_id, group_id, name, email, phone, plus_ones, vip, token, table_label, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NULLIF($9,''),$10) RETURNING id`,
		eventID, in.GroupID, in.Name, in.Email, in.Phone, in.PlusOnes, in.VIP, newGuestToken(), derefStr(in.TableLabel), in.Notes).Scan(&id)
	if err != nil {
		return nil, err
	}
	return r.Get(ctx, id)
}

func (r *GuestRepo) Update(ctx context.Context, id string, p appguest.GuestPatch) (*guest.Guest, error) {
	ct, err := r.pool.Exec(ctx,
		`UPDATE guests SET
		   name = COALESCE($2, name),
		   email = COALESCE($3, email),
		   phone = COALESCE($4, phone),
		   group_id = COALESCE($5, group_id),
		   plus_ones = COALESCE($6, plus_ones),
		   vip = COALESCE($7, vip),
		   table_label = CASE WHEN $8::text IS NULL THEN table_label ELSE NULLIF($8,'') END,
		   notes = COALESCE($9, notes),
		   updated_at = now()
		 WHERE id=$1 AND deleted_at IS NULL`,
		id, p.Name, p.Email, p.Phone, p.GroupID, p.PlusOnes, p.VIP, p.TableLabel, p.Notes)
	if err != nil {
		return nil, err
	}
	if ct.RowsAffected() == 0 {
		return nil, guest.ErrNotFound
	}
	if p.RSVPStatus != nil || p.PartySize != nil {
		status := "pending"
		if p.RSVPStatus != nil {
			status = *p.RSVPStatus
		}
		party := 0
		if p.PartySize != nil {
			party = *p.PartySize
		}
		respondedExpr := "NULL"
		if status != "pending" {
			respondedExpr = "now()"
		}
		_, err := r.pool.Exec(ctx,
			`INSERT INTO rsvps (guest_id, status, party_size, responded_at) VALUES ($1,$2,$3,`+respondedExpr+`)
			 ON CONFLICT (guest_id) DO UPDATE SET status=EXCLUDED.status, party_size=EXCLUDED.party_size,
			   responded_at=`+respondedExpr+`, updated_at=now()`,
			id, status, party)
		if err != nil {
			return nil, err
		}
	}
	return r.Get(ctx, id)
}

func (r *GuestRepo) Delete(ctx context.Context, id string) error {
	ct, err := r.pool.Exec(ctx, `UPDATE guests SET deleted_at=now(), updated_at=now() WHERE id=$1 AND deleted_at IS NULL`, id)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return guest.ErrNotFound
	}
	return nil
}

// Import inserts all valid guests in ONE statement (unnest of parallel arrays) inside a
// transaction — N guests cost one round-trip, not N. Blank names are skipped. Tokens are
// generated in Go (same CSPRNG helper as single create) and passed as an array.
func (r *GuestRepo) Import(ctx context.Context, eventID string, in []appguest.GuestInput) (int, error) {
	var names, emails, phones, groups, tokens, tables, notes []*string
	var plus []int
	var vips []bool
	for _, g := range in {
		if strings.TrimSpace(g.Name) == "" {
			continue
		}
		n, t := g.Name, newGuestToken()
		names, tokens = append(names, &n), append(tokens, &t)
		emails, phones, groups = append(emails, g.Email), append(phones, g.Phone), append(groups, g.GroupID)
		tl, nt := derefStr(g.TableLabel), g.Notes
		tables, notes = append(tables, &tl), append(notes, &nt)
		plus, vips = append(plus, g.PlusOnes), append(vips, g.VIP)
	}
	if len(names) == 0 {
		return 0, nil
	}
	ct, err := r.pool.Exec(ctx,
		`INSERT INTO guests (event_id, name, email, phone, group_id, plus_ones, vip, token, table_label, notes)
		 SELECT $1, n, e, p, g::uuid, po, v, t, NULLIF(tl,''), COALESCE(nt,'')
		   FROM unnest($2::text[], $3::text[], $4::text[], $5::text[], $6::int[], $7::bool[], $8::text[], $9::text[], $10::text[])
		        AS x(n, e, p, g, po, v, t, tl, nt)`,
		eventID, names, emails, phones, groups, plus, vips, tokens, tables, notes)
	if err != nil {
		return 0, err
	}
	return int(ct.RowsAffected()), nil
}

func (r *GuestRepo) Segments(ctx context.Context, eventID string) (guest.Segments, error) {
	var s guest.Segments
	err := r.pool.QueryRow(ctx,
		`SELECT
		   count(*) FILTER (WHERE g.opened_at IS NULL),
		   count(*) FILTER (WHERE g.opened_at IS NOT NULL AND COALESCE(r.status,'pending')='pending'),
		   count(*) FILTER (WHERE g.vip),
		   count(*) FILTER (WHERE g.plus_ones > 0),
		   count(*) FILTER (WHERE COALESCE(r.status,'pending')='pending')
		 FROM guests g LEFT JOIN rsvps r ON r.guest_id=g.id
		 WHERE g.event_id=$1 AND g.deleted_at IS NULL`,
		eventID).Scan(&s.NotOpened, &s.NoReply, &s.VIP, &s.PlusOnes, &s.FollowUp)
	return s, err
}

func (r *GuestRepo) ListGroups(ctx context.Context, eventID string) ([]guest.Group, error) {
	rows, err := r.pool.Query(ctx, `SELECT id, name FROM guest_groups WHERE event_id=$1 ORDER BY name`, eventID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []guest.Group{}
	for rows.Next() {
		var g guest.Group
		if err := rows.Scan(&g.ID, &g.Name); err != nil {
			return nil, err
		}
		out = append(out, g)
	}
	return out, rows.Err()
}

func (r *GuestRepo) CreateGroup(ctx context.Context, eventID, name string) (*guest.Group, error) {
	var g guest.Group
	err := r.pool.QueryRow(ctx,
		`INSERT INTO guest_groups (event_id, name) VALUES ($1,$2)
		 ON CONFLICT (event_id, name) DO UPDATE SET name=EXCLUDED.name
		 RETURNING id, name`, eventID, name).Scan(&g.ID, &g.Name)
	if err != nil {
		return nil, err
	}
	return &g, nil
}

// backfillTokens gives every token-less guest of the event a personal link token, in ONE
// statement (it runs on the hot host list read, so it must not loop per row). Tokens are minted
// by Postgres' CSPRNG (pgcrypto, enabled in migration 0001): 16 random bytes, URL-safe base64 —
// the same shape as newGuestToken. gen_random_bytes is volatile, so it is evaluated per row.
// A no-op (0 rows) on the common path where every guest already has a token.
func (r *GuestRepo) backfillTokens(ctx context.Context, eventID string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE guests
		   SET token = translate(rtrim(encode(gen_random_bytes(16), 'base64'), '='), '+/', '-_')
		 WHERE event_id = $1 AND token IS NULL AND deleted_at IS NULL`, eventID)
	return err
}

func derefStr(p *string) string {
	if p == nil {
		return ""
	}
	return *p
}

// MarkInvited stamps invited_at (the "Invitation sent" step of the guest journey).
func (r *GuestRepo) MarkInvited(ctx context.Context, id string) error {
	ct, err := r.pool.Exec(ctx, `UPDATE guests SET invited_at=now(), updated_at=now() WHERE id=$1 AND deleted_at IS NULL`, id)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return guest.ErrNotFound
	}
	return nil
}
