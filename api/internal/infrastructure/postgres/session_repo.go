package postgres

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/mula/mula/internal/application/auth"
)

type SessionRepo struct{ pool *pgxpool.Pool }

func NewSessionRepo(pool *pgxpool.Pool) *SessionRepo { return &SessionRepo{pool: pool} }

func (r *SessionRepo) Create(ctx context.Context, userID, userAgent, ip string, ttl time.Duration) (*auth.Session, error) {
	var s auth.Session
	err := r.pool.QueryRow(ctx,
		`INSERT INTO sessions (user_id, expires_at, user_agent, ip)
		 VALUES ($1, now()+$2::interval, $3, $4)
		 RETURNING id, user_id, expires_at`,
		userID, ttl.String(), userAgent, ip).Scan(&s.ID, &s.UserID, &s.ExpiresAt)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *SessionRepo) Get(ctx context.Context, id string) (*auth.Session, error) {
	var s auth.Session
	err := r.pool.QueryRow(ctx,
		`SELECT id, user_id, expires_at FROM sessions WHERE id=$1 AND expires_at > now()`,
		id).Scan(&s.ID, &s.UserID, &s.ExpiresAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, auth.ErrSessionInvalid
	}
	if err != nil {
		// An invalid UUID string also lands here; treat as invalid session, not 500.
		return nil, auth.ErrSessionInvalid
	}
	return &s, nil
}

func (r *SessionRepo) DeleteForUser(ctx context.Context, userID, keepID string) error {
	// id is uuid: compare as text so an empty keepID never needs a cast.
	_, err := r.pool.Exec(ctx, `DELETE FROM sessions WHERE user_id=$1 AND id::text <> $2`, userID, keepID)
	return err
}

func (r *SessionRepo) Delete(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM sessions WHERE id=$1`, id)
	return err
}

func (r *SessionRepo) ListForUser(ctx context.Context, userID string) ([]auth.SessionInfo, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, COALESCE(user_agent,''), COALESCE(ip,''), created_at FROM sessions
		  WHERE user_id=$1 AND expires_at > now() ORDER BY created_at DESC LIMIT 50`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []auth.SessionInfo{}
	for rows.Next() {
		var s auth.SessionInfo
		if err := rows.Scan(&s.ID, &s.UserAgent, &s.IP, &s.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, s)
	}
	return out, rows.Err()
}

func (r *SessionRepo) DeleteOwned(ctx context.Context, userID, id string) (bool, error) {
	// id::text so a malformed id is simply "not found", not a cast error.
	ct, err := r.pool.Exec(ctx, `DELETE FROM sessions WHERE user_id=$1 AND id::text=$2`, userID, id)
	if err != nil {
		return false, err
	}
	return ct.RowsAffected() > 0, nil
}
