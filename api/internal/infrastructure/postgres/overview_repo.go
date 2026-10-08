package postgres

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/mula/mula/internal/application/overview"
)

type OverviewRepo struct{ pool *pgxpool.Pool }

func NewOverviewRepo(pool *pgxpool.Pool) *OverviewRepo { return &OverviewRepo{pool: pool} }

func (r *OverviewRepo) MemberCount(ctx context.Context, eventID string) (int, error) {
	var n int
	err := r.pool.QueryRow(ctx, `SELECT count(*) FROM event_members WHERE event_id=$1`, eventID).Scan(&n)
	return n, err
}

func (r *OverviewRepo) TaskStats(ctx context.Context, eventID string) (overview.TaskStats, error) {
	var s overview.TaskStats
	err := r.pool.QueryRow(ctx,
		`SELECT count(*), count(*) FILTER (WHERE done) FROM tasks WHERE event_id=$1`, eventID).Scan(&s.Total, &s.Done)
	return s, err
}

func (r *OverviewRepo) GuestStats(ctx context.Context, eventID string) (overview.GuestStats, error) {
	var s overview.GuestStats
	err := r.pool.QueryRow(ctx,
		`SELECT
		   count(*),
		   count(*) FILTER (WHERE g.opened_at IS NOT NULL),
		   count(*) FILTER (WHERE COALESCE(rv.status,'pending') <> 'pending'),
		   count(*) FILTER (WHERE g.opened_at IS NULL),
		   count(*) FILTER (WHERE g.opened_at IS NOT NULL AND COALESCE(rv.status,'pending')='pending'),
		   count(*) FILTER (WHERE g.vip),
		   count(*) FILTER (WHERE g.plus_ones > 0),
		   count(*) FILTER (WHERE COALESCE(rv.status,'pending')='pending')
		 FROM guests g LEFT JOIN rsvps rv ON rv.guest_id=g.id
		 WHERE g.event_id=$1 AND g.deleted_at IS NULL`,
		eventID).Scan(&s.Total, &s.Opened, &s.Responded, &s.NotOpened, &s.NoReply, &s.VIP, &s.PlusOnes, &s.FollowUp)
	return s, err
}

func (r *OverviewRepo) DismissedKeys(ctx context.Context, eventID, userID string) (map[string]bool, error) {
	rows, err := r.pool.Query(ctx, `SELECT note_key FROM note_dismissals WHERE event_id=$1 AND user_id=$2`, eventID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := map[string]bool{}
	for rows.Next() {
		var k string
		if err := rows.Scan(&k); err != nil {
			return nil, err
		}
		out[k] = true
	}
	return out, rows.Err()
}

func (r *OverviewRepo) Dismiss(ctx context.Context, eventID, userID, key string) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO note_dismissals (event_id, user_id, note_key) VALUES ($1,$2,$3)
		 ON CONFLICT (event_id, user_id, note_key) DO NOTHING`,
		eventID, userID, key)
	return err
}

// Activity is a read-only UNION over rows that already carry a timestamp — no event log table.
// Every branch is scoped by event_id; soft-deleted guests are excluded.
func (r *OverviewRepo) Activity(ctx context.Context, eventID string, limit int) ([]overview.ActivityItem, error) {
	rows, err := r.pool.Query(ctx, `
	  SELECT kind, actor, text, at FROM (
	    SELECT 'rsvp' AS kind, g.name AS actor,
	           CASE WHEN rv.status = 'yes' THEN 'confirmed attendance for ' || GREATEST(rv.party_size,1)
	                ELSE 'can’t make it' END AS text,
	           rv.responded_at AS at
	      FROM rsvps rv JOIN guests g ON g.id = rv.guest_id
	     WHERE g.event_id = $1 AND g.deleted_at IS NULL AND rv.status IN ('yes','no') AND rv.responded_at IS NOT NULL
	    UNION ALL
	    SELECT 'open', g.name, 'opened the invitation', g.opened_at
	      FROM guests g WHERE g.event_id = $1 AND g.deleted_at IS NULL AND g.opened_at IS NOT NULL
	    UNION ALL
	    SELECT 'wish', w.author_name, 'sent a wish', w.created_at FROM wishes w WHERE w.event_id = $1
	    UNION ALL
	    SELECT 'checkin', g.name, 'checked in', c.checked_in_at
	      FROM checkins c JOIN guests g ON g.id = c.guest_id WHERE c.event_id = $1 AND g.deleted_at IS NULL
	    UNION ALL
	    SELECT 'task', 'Checklist', 'completed “' || t.title || '”', t.updated_at FROM tasks t WHERE t.event_id = $1 AND t.done
	    UNION ALL
	    SELECT 'guest', g.name, 'was added to the guest list', g.created_at
	      FROM guests g WHERE g.event_id = $1 AND g.deleted_at IS NULL
	    UNION ALL
	    SELECT 'team', COALESCE(u.name, m.email::text), 'joined the team as ' || m.role, m.accepted_at
	      FROM event_members m LEFT JOIN users u ON u.id = m.user_id
	     WHERE m.event_id = $1 AND m.role <> 'owner' AND m.accepted_at IS NOT NULL
	  ) a WHERE at IS NOT NULL ORDER BY at DESC LIMIT $2`, eventID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []overview.ActivityItem{}
	for rows.Next() {
		var it overview.ActivityItem
		var at time.Time
		if err := rows.Scan(&it.Kind, &it.Actor, &it.Text, &at); err != nil {
			return nil, err
		}
		it.At = at.UTC().Format(time.RFC3339)
		out = append(out, it)
	}
	return out, rows.Err()
}
