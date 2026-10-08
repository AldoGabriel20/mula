package postgres

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	appevent "github.com/mula/mula/internal/application/event"
	"github.com/mula/mula/internal/domain/event"
)

type EventRepo struct{ pool *pgxpool.Pool }

func NewEventRepo(pool *pgxpool.Pool) *EventRepo { return &EventRepo{pool: pool} }

const eventCols = `id, owner_id, type, couple_a, couple_b, event_date, venue, status, created_at, updated_at`

func scanEvent(row pgx.Row) (*event.Event, error) {
	var e event.Event
	if err := row.Scan(&e.ID, &e.OwnerID, &e.Type, &e.CoupleA, &e.CoupleB, &e.EventDate, &e.Venue, &e.Status, &e.CreatedAt, &e.UpdatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, event.ErrNotFound
		}
		return nil, err
	}
	return &e, nil
}

func parseDate(s *string) (*time.Time, error) {
	if s == nil || *s == "" {
		return nil, nil
	}
	t, err := time.Parse(time.RFC3339, *s)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *EventRepo) CreateWithOwner(ctx context.Context, ownerID, ownerEmail string, in appevent.CreateInput) (*event.Event, error) {
	date, err := parseDate(in.EventDate)
	if err != nil {
		return nil, err
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx) //nolint:errcheck — no-op after commit

	e, err := scanEvent(tx.QueryRow(ctx,
		`INSERT INTO events (owner_id, type, couple_a, couple_b, event_date, venue)
		 VALUES ($1,$2,$3,$4,$5,$6) RETURNING `+eventCols,
		ownerID, in.Type, in.CoupleA, in.CoupleB, date, in.Venue))
	if err != nil {
		return nil, err
	}
	if _, err := tx.Exec(ctx,
		`INSERT INTO event_members (event_id, user_id, email, role, accepted_at)
		 VALUES ($1,$2,$3,'owner',now())`,
		e.ID, ownerID, ownerEmail); err != nil {
		return nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return e, nil
}

func (r *EventRepo) ListForUser(ctx context.Context, userID string) ([]event.Event, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT `+prefixed("e")+`
		 FROM events e JOIN event_members m ON m.event_id = e.id
		 WHERE m.user_id = $1 AND e.deleted_at IS NULL
		 ORDER BY e.created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []event.Event{}
	for rows.Next() {
		var e event.Event
		if err := rows.Scan(&e.ID, &e.OwnerID, &e.Type, &e.CoupleA, &e.CoupleB, &e.EventDate, &e.Venue, &e.Status, &e.CreatedAt, &e.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, e)
	}
	return out, rows.Err()
}

func (r *EventRepo) Get(ctx context.Context, id string) (*event.Event, error) {
	return scanEvent(r.pool.QueryRow(ctx, `SELECT `+eventCols+` FROM events WHERE id=$1 AND deleted_at IS NULL`, id))
}

func (r *EventRepo) Update(ctx context.Context, id string, p appevent.Patch) (*event.Event, error) {
	date, err := parseDate(p.EventDate)
	if err != nil {
		return nil, err
	}
	// COALESCE keeps the existing value when a field is absent from the patch.
	return scanEvent(r.pool.QueryRow(ctx,
		`UPDATE events SET
		   type       = COALESCE($2, type),
		   couple_a   = COALESCE($3, couple_a),
		   couple_b   = COALESCE($4, couple_b),
		   event_date = COALESCE($5, event_date),
		   venue      = COALESCE($6, venue),
		   updated_at = now()
		 WHERE id=$1 AND deleted_at IS NULL RETURNING `+eventCols,
		id, p.Type, p.CoupleA, p.CoupleB, date, p.Venue))
}

func (r *EventRepo) SoftDelete(ctx context.Context, id string) error {
	ct, err := r.pool.Exec(ctx, `UPDATE events SET deleted_at=now(), updated_at=now() WHERE id=$1 AND deleted_at IS NULL`, id)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return event.ErrNotFound
	}
	return nil
}

// prefixed returns eventCols with a table alias (for joined selects).
func prefixed(alias string) string {
	return alias + ".id, " + alias + ".owner_id, " + alias + ".type, " + alias + ".couple_a, " +
		alias + ".couple_b, " + alias + ".event_date, " + alias + ".venue, " + alias + ".status, " +
		alias + ".created_at, " + alias + ".updated_at"
}
