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

const schCols = `id, event_id, starts_at, ends_at, title, venue, address, dress_code, description, visibility, label, map_url, venue_note, media_id, position`

func scanItem(row pgx.Row) (*schedule.Item, error) {
	var it schedule.Item
	if err := row.Scan(&it.ID, &it.EventID, &it.StartsAt, &it.EndsAt, &it.Title, &it.Venue, &it.Address, &it.DressCode, &it.Description, &it.Visibility, &it.Label, &it.MapURL, &it.VenueNote, &it.MediaID, &it.Position); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, schedule.ErrNotFound
		}
		return nil, mapScheduleErr(err)
	}
	return &it, nil
}

// mapScheduleErr turns the ends_at >= starts_at CHECK and the media FK into domain errors (→ 400).
// The FK case is the race where a photo is deleted between the ownership check and the write.
func mapScheduleErr(err error) error {
	var pg *pgconn.PgError
	if errors.As(err, &pg) {
		switch pg.ConstraintName {
		case "chk_schedule_range":
			return schedule.ErrBadRange
		case "schedule_items_media_id_fkey":
			return schedule.ErrBadMedia
		}
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
		if err := rows.Scan(&it.ID, &it.EventID, &it.StartsAt, &it.EndsAt, &it.Title, &it.Venue, &it.Address, &it.DressCode, &it.Description, &it.Visibility, &it.Label, &it.MapURL, &it.VenueNote, &it.MediaID, &it.Position); err != nil {
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
		`INSERT INTO schedule_items (event_id, title, starts_at, ends_at, venue, address, dress_code, description, visibility, label, map_url, venue_note, media_id, position)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NULLIF($13::text,'')::uuid,(SELECT COALESCE(MAX(position),-1)+1 FROM schedule_items WHERE event_id=$1))
		 RETURNING `+schCols, eventID, in.Title, at, end, in.Venue, in.Address, in.DressCode, in.Description, vis, in.Label, in.MapURL, in.VenueNote, in.MediaID))
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
		   description=COALESCE($8,description), visibility=COALESCE($9,visibility),
		   label=COALESCE($10,label), map_url=COALESCE($11,map_url), venue_note=COALESCE($12,venue_note),
		   media_id=CASE WHEN $13::text IS NULL THEN media_id ELSE NULLIF($13::text,'')::uuid END, updated_at=now()
		 WHERE id=$1 RETURNING `+schCols,
		id, p.Title, at, end, p.Venue, p.Address, p.DressCode, p.Description, p.Visibility, p.Label, p.MapURL, p.VenueNote, p.MediaID))
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

func (r *ScheduleRepo) MediaBelongs(ctx context.Context, eventID, mediaID string) (bool, error) {
	var ok bool
	err := r.pool.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM media WHERE id=$1 AND event_id=$2)`, mediaID, eventID).Scan(&ok)
	return ok, err
}
