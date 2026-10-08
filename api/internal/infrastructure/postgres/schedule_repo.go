package postgres

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	appsch "github.com/mula/mula/internal/application/schedule"
	"github.com/mula/mula/internal/domain/schedule"
)

type ScheduleRepo struct{ pool *pgxpool.Pool }

func NewScheduleRepo(pool *pgxpool.Pool) *ScheduleRepo { return &ScheduleRepo{pool: pool} }

const schCols = `id, event_id, starts_at, ends_at, title, venue, address, dress_code, description, visibility, position`

func scanItem(row pgx.Row) (*schedule.Item, error) {
	var it schedule.Item
	if err := row.Scan(&it.ID, &it.EventID, &it.StartsAt, &it.EndsAt, &it.Title, &it.Venue, &it.Address, &it.DressCode, &it.Description, &it.Visibility, &it.Position); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, schedule.ErrNotFound
		}
		return nil, mapScheduleErr(err)
	}
	return &it, nil
}

// mapScheduleErr turns the ends_at >= starts_at CHECK into a domain error (→ 400).
func mapScheduleErr(err error) error {
	var pg *pgconn.PgError
	if errors.As(err, &pg) && pg.ConstraintName == "chk_schedule_range" {
		return schedule.ErrBadRange
	}
	return err
}

func parseTime(s *string) (*time.Time, error) {
	if s == nil || *s == "" {
		return nil, nil
	}
	t, err := time.Parse(time.RFC3339, *s)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *ScheduleRepo) List(ctx context.Context, eventID string) ([]schedule.Item, error) {
	rows, err := r.pool.Query(ctx, `SELECT `+schCols+` FROM schedule_items WHERE event_id=$1 ORDER BY position`, eventID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []schedule.Item{}
	for rows.Next() {
		var it schedule.Item
		if err := rows.Scan(&it.ID, &it.EventID, &it.StartsAt, &it.EndsAt, &it.Title, &it.Venue, &it.Address, &it.DressCode, &it.Description, &it.Visibility, &it.Position); err != nil {
			return nil, err
		}
		out = append(out, it)
	}
	return out, rows.Err()
}

func (r *ScheduleRepo) Get(ctx context.Context, id string) (*schedule.Item, error) {
	return scanItem(r.pool.QueryRow(ctx, `SELECT `+schCols+` FROM schedule_items WHERE id=$1`, id))
}

func (r *ScheduleRepo) Create(ctx context.Context, eventID string, in appsch.Input) (*schedule.Item, error) {
	at, err := parseTime(in.StartsAt)
	if err != nil {
		return nil, err
	}
	end, err := parseTime(in.EndsAt)
	if err != nil {
		return nil, err
	}
	vis := in.Visibility
	if vis == "" {
		vis = "everyone"
	}
	return scanItem(r.pool.QueryRow(ctx,
		`INSERT INTO schedule_items (event_id, title, starts_at, ends_at, venue, address, dress_code, description, visibility, position)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,(SELECT COALESCE(MAX(position),-1)+1 FROM schedule_items WHERE event_id=$1))
		 RETURNING `+schCols, eventID, in.Title, at, end, in.Venue, in.Address, in.DressCode, in.Description, vis))
}

func (r *ScheduleRepo) Update(ctx context.Context, id string, p appsch.Patch) (*schedule.Item, error) {
	at, err := parseTime(p.StartsAt)
	if err != nil {
		return nil, err
	}
	end, err := parseTime(p.EndsAt)
	if err != nil {
		return nil, err
	}
	return scanItem(r.pool.QueryRow(ctx,
		`UPDATE schedule_items SET title=COALESCE($2,title), starts_at=COALESCE($3,starts_at), ends_at=COALESCE($4,ends_at),
		   venue=COALESCE($5,venue), address=COALESCE($6,address), dress_code=COALESCE($7,dress_code),
		   description=COALESCE($8,description), visibility=COALESCE($9,visibility), updated_at=now()
		 WHERE id=$1 RETURNING `+schCols,
		id, p.Title, at, end, p.Venue, p.Address, p.DressCode, p.Description, p.Visibility))
}

func (r *ScheduleRepo) Delete(ctx context.Context, id string) error {
	ct, err := r.pool.Exec(ctx, `DELETE FROM schedule_items WHERE id=$1`, id)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return schedule.ErrNotFound
	}
	return nil
}

func (r *ScheduleRepo) Reorder(ctx context.Context, eventID string, ids []string) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx) //nolint:errcheck
	for i, id := range ids {
		if _, err := tx.Exec(ctx, `UPDATE schedule_items SET position=$3, updated_at=now() WHERE id=$1 AND event_id=$2`, id, eventID, i); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}
