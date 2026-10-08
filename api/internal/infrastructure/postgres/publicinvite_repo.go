package postgres

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/mula/mula/internal/application/publicinvite"
	"github.com/mula/mula/internal/domain/invitation"
)

type PublicInviteRepo struct{ pool *pgxpool.Pool }

func NewPublicInviteRepo(pool *pgxpool.Pool) *PublicInviteRepo { return &PublicInviteRepo{pool: pool} }

// publishedEvent is the single predicate that makes an event publicly readable.
const publishedEvent = `e.status = 'published' AND e.deleted_at IS NULL
   AND EXISTS (SELECT 1 FROM invitations i WHERE i.event_id = e.id AND i.published_at IS NOT NULL)`

// Resolve tries the event link first, then a personal guest link. Both require the event to
// be published; an unpublished event therefore kills every one of its personal links too.
func (r *PublicInviteRepo) Resolve(ctx context.Context, token string) (*publicinvite.Resolved, error) {
	var res publicinvite.Resolved
	err := r.pool.QueryRow(ctx,
		`SELECT e.id, e.event_date, (SELECT i.rsvp_deadline FROM invitations i WHERE i.event_id = e.id) FROM events e WHERE e.public_token = $1 AND `+publishedEvent, token).
		Scan(&res.EventID, &res.EventDate, &res.RSVPDeadline)
	if err == nil {
		return &res, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}
	err = r.pool.QueryRow(ctx,
		`SELECT e.id, e.event_date, (SELECT i.rsvp_deadline FROM invitations i WHERE i.event_id = e.id), g.id, g.name
		 FROM guests g JOIN events e ON e.id = g.event_id
		 WHERE g.token = $1 AND g.deleted_at IS NULL AND `+publishedEvent, token).
		Scan(&res.EventID, &res.EventDate, &res.RSVPDeadline, &res.GuestID, &res.GuestName)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, invitation.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &res, nil
}

func (r *PublicInviteRepo) Page(ctx context.Context, _ string, res *publicinvite.Resolved) (*invitation.PublicPage, error) {
	var v invitation.PublicView
	var invID string
	err := r.pool.QueryRow(ctx,
		`SELECT e.type, e.couple_a, e.couple_b, e.event_date, e.venue, i.palette, i.content_language, i.id
		 FROM events e JOIN invitations i ON i.event_id = e.id WHERE e.id = $1`, res.EventID).
		Scan(&v.EventType, &v.CoupleA, &v.CoupleB, &v.EventDate, &v.Venue, &v.Palette, &v.Language, &invID)
	if err != nil {
		return nil, err
	}
	rows, err := r.pool.Query(ctx,
		`SELECT type, content FROM invitation_sections WHERE invitation_id=$1 AND visible ORDER BY position`, invID)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var sec invitation.PublicSection
		var raw []byte
		if err := rows.Scan(&sec.Type, &raw); err != nil {
			rows.Close()
			return nil, err
		}
		sec.Content = map[string]any{}
		_ = json.Unmarshal(raw, &sec.Content)
		v.Sections = append(v.Sections, sec)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return nil, err
	}
	page := &invitation.PublicPage{View: &v, RSVPDeadline: res.RSVPDeadline}

	// gifts are shown only when the host left the gift section visible
	for _, s := range v.Sections {
		if s.Type == "gift" {
			grows, err := r.pool.Query(ctx, `SELECT title, description, url, target_amount::float8 FROM gifts WHERE event_id=$1 ORDER BY position`, res.EventID)
			if err != nil {
				return nil, err
			}
			for grows.Next() {
				var g invitation.PublicGift
				if err := grows.Scan(&g.Title, &g.Description, &g.URL, &g.TargetAmount); err != nil {
					grows.Close()
					return nil, err
				}
				page.Gifts = append(page.Gifts, g)
			}
			grows.Close()
			mrows, err := r.pool.Query(ctx, `SELECT type, title, detail, copy_value FROM gift_methods WHERE event_id=$1 ORDER BY position`, res.EventID)
			if err != nil {
				return nil, err
			}
			for mrows.Next() {
				var m invitation.PublicMethod
				if err := mrows.Scan(&m.Type, &m.Title, &m.Detail, &m.CopyValue); err != nil {
					mrows.Close()
					return nil, err
				}
				page.Methods = append(page.Methods, m)
			}
			mrows.Close()
			break
		}
	}

	// the live stream is shown only when the host allowed it and it is not offline
	var live invitation.PublicLive
	err = r.pool.QueryRow(ctx,
		`SELECT provider, stream_url, status, starts_at FROM live_config
		 WHERE event_id=$1 AND show_on_invitation AND status <> 'offline' AND stream_url <> ''`, res.EventID).
		Scan(&live.Provider, &live.StreamURL, &live.Status, &live.StartsAt)
	if err == nil {
		page.Live = &live
	} else if !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}

	if res.GuestID != "" {
		gi := invitation.GuestInfo{Name: res.GuestName, RSVPStatus: "pending"}
		var plus int
		if err := r.pool.QueryRow(ctx,
			`SELECT g.plus_ones, COALESCE(rv.status,'pending'), COALESCE(rv.party_size,0)
			 FROM guests g LEFT JOIN rsvps rv ON rv.guest_id = g.id WHERE g.id=$1`, res.GuestID).
			Scan(&plus, &gi.RSVPStatus, &gi.PartySize); err != nil {
			return nil, err
		}
		gi.MaxParty = 1 + plus
		page.Guest = &gi
	}
	return page, nil
}

// MarkOpened only sets the timestamp the first time (opened_at IS NULL guard).
func (r *PublicInviteRepo) MarkOpened(ctx context.Context, guestID string) error {
	_, err := r.pool.Exec(ctx, `UPDATE guests SET opened_at = now() WHERE id=$1 AND opened_at IS NULL`, guestID)
	return err
}

// SubmitRSVP caps party size at 1+plus_ones inside the statement (server-authoritative —
// a client can't claim a bigger party than the host allowed).
func (r *PublicInviteRepo) SubmitRSVP(ctx context.Context, guestID string, in invitation.RSVPInput) error {
	ct, err := r.pool.Exec(ctx,
		`INSERT INTO rsvps (guest_id, status, party_size, meal, note, responded_at)
		 SELECT g.id, $2, LEAST($3, 1 + g.plus_ones), $4, $5, now() FROM guests g WHERE g.id = $1
		 ON CONFLICT (guest_id) DO UPDATE SET status=EXCLUDED.status, party_size=EXCLUDED.party_size,
		   meal=EXCLUDED.meal, note=EXCLUDED.note, responded_at=now(), updated_at=now()`,
		guestID, in.Status, in.PartySize, in.Meal, in.Note)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return invitation.ErrNotFound
	}
	return nil
}

func (r *PublicInviteRepo) AddWish(ctx context.Context, eventID string, guestID *string, author, message string) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO wishes (event_id, guest_id, author_name, message, phase) VALUES ($1,$2,$3,$4,'pre')`,
		eventID, guestID, author, message)
	return err
}
