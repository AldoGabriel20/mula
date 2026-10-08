package postgres

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	appops "github.com/mula/mula/internal/application/ops"
	"github.com/mula/mula/internal/domain/ops"
)

type OpsRepo struct{ pool *pgxpool.Pool }

func NewOpsRepo(pool *pgxpool.Pool) *OpsRepo { return &OpsRepo{pool: pool} }

// CheckIn is idempotent: the guest must belong to the event (else ErrGuestNotFound),
// and a repeat check-in keeps the original arrival time.
func (r *OpsRepo) CheckIn(ctx context.Context, eventID, guestID, byUserID string) error {
	var exists bool
	if err := r.pool.QueryRow(ctx,
		`SELECT EXISTS (SELECT 1 FROM guests WHERE id=$1 AND event_id=$2 AND deleted_at IS NULL)`,
		guestID, eventID).Scan(&exists); err != nil || !exists {
		return ops.ErrGuestNotFound
	}
	_, err := r.pool.Exec(ctx,
		`INSERT INTO checkins (event_id, guest_id, by_user_id) VALUES ($1,$2,$3)
		 ON CONFLICT (event_id, guest_id) DO NOTHING`, eventID, guestID, byUserID)
	return err
}

func (r *OpsRepo) Arrivals(ctx context.Context, eventID string) ([]ops.Arrival, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT g.id, g.name, gg.name, COALESCE(rv.party_size,0), c.checked_in_at
		 FROM checkins c
		 JOIN guests g ON g.id=c.guest_id
		 LEFT JOIN guest_groups gg ON gg.id=g.group_id
		 LEFT JOIN rsvps rv ON rv.guest_id=g.id
		 WHERE c.event_id=$1 ORDER BY c.checked_in_at DESC`, eventID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []ops.Arrival{}
	for rows.Next() {
		var a ops.Arrival
		if err := rows.Scan(&a.GuestID, &a.GuestName, &a.GroupName, &a.PartySize, &a.CheckedInAt); err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, rows.Err()
}

func (r *OpsRepo) Stats(ctx context.Context, eventID string) (expected, checkedIn, attending int, err error) {
	err = r.pool.QueryRow(ctx,
		`SELECT
		   (SELECT count(*) FROM guests WHERE event_id=$1 AND deleted_at IS NULL),
		   (SELECT count(*) FROM checkins WHERE event_id=$1),
		   (SELECT count(*) FROM guests g JOIN rsvps rv ON rv.guest_id=g.id
		      WHERE g.event_id=$1 AND g.deleted_at IS NULL AND rv.status='yes')`,
		eventID).Scan(&expected, &checkedIn, &attending)
	return
}

func (r *OpsRepo) GetLive(ctx context.Context, eventID string) (ops.LiveConfig, error) {
	var c ops.LiveConfig
	err := r.pool.QueryRow(ctx,
		`SELECT provider, stream_url, status, starts_at, show_on_invitation FROM live_config WHERE event_id=$1`, eventID).
		Scan(&c.Provider, &c.StreamURL, &c.Status, &c.StartsAt, &c.ShowOnInvitation)
	if errors.Is(err, pgx.ErrNoRows) { // no row yet → defaults
		return ops.LiveConfig{Status: "offline", ShowOnInvitation: true}, nil
	}
	if err != nil {
		return ops.LiveConfig{}, err
	}
	return utcLive(c), nil
}

func (r *OpsRepo) UpdateLive(ctx context.Context, eventID string, p appops.LivePatch) (ops.LiveConfig, error) {
	var c ops.LiveConfig
	err := r.pool.QueryRow(ctx,
		`INSERT INTO live_config (event_id, provider, stream_url, status, starts_at, show_on_invitation)
		 VALUES ($1, COALESCE($2,''), COALESCE($3,''), COALESCE($4,'offline'), NULLIF($5,'')::timestamptz, COALESCE($6,true))
		 ON CONFLICT (event_id) DO UPDATE SET
		   provider = COALESCE($2, live_config.provider),
		   stream_url = COALESCE($3, live_config.stream_url),
		   status = COALESCE($4, live_config.status),
		   starts_at = CASE WHEN $5::text IS NULL THEN live_config.starts_at WHEN $5 = '' THEN NULL ELSE $5::timestamptz END,
		   show_on_invitation = COALESCE($6, live_config.show_on_invitation),
		   updated_at = now()
		 RETURNING provider, stream_url, status, starts_at, show_on_invitation`,
		eventID, p.Provider, p.StreamURL, p.Status, p.StartsAt, p.ShowOnInvitation).Scan(&c.Provider, &c.StreamURL, &c.Status, &c.StartsAt, &c.ShowOnInvitation)
	return utcLive(c), err
}

// utcLive keeps the API's timestamps in UTC like every other resource (pgx returns the session zone).
func utcLive(c ops.LiveConfig) ops.LiveConfig {
	if c.StartsAt != nil {
		t := c.StartsAt.UTC()
		c.StartsAt = &t
	}
	return c
}
