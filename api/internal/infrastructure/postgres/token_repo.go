package postgres

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/mula/mula/internal/application/auth"
)

type TokenRepo struct{ pool *pgxpool.Pool }

func NewTokenRepo(pool *pgxpool.Pool) *TokenRepo { return &TokenRepo{pool: pool} }

func tableFor(kind auth.TokenKind) (string, error) {
	switch kind {
	case auth.KindVerify:
		return "verification_tokens", nil
	case auth.KindReset:
		return "password_reset_tokens", nil
	default:
		return "", fmt.Errorf("unknown token kind %q", kind)
	}
}

func (r *TokenRepo) Create(ctx context.Context, kind auth.TokenKind, userID, token string, expires time.Time) error {
	table, err := tableFor(kind)
	if err != nil {
		return err
	}
	_, err = r.pool.Exec(ctx,
		fmt.Sprintf(`INSERT INTO %s (user_id, token, expires_at) VALUES ($1,$2,$3)`, table),
		userID, token, expires)
	return err
}

// Consume atomically marks the token used (single-use) only if unused and unexpired,
// returning its user id. A second attempt, an expired token, or an unknown token all
// yield auth.ErrTokenInvalid.
func (r *TokenRepo) Consume(ctx context.Context, kind auth.TokenKind, token string) (string, error) {
	table, err := tableFor(kind)
	if err != nil {
		return "", err
	}
	var userID string
	err = r.pool.QueryRow(ctx,
		fmt.Sprintf(`UPDATE %s SET used_at=now()
		             WHERE token=$1 AND used_at IS NULL AND expires_at > now()
		             RETURNING user_id`, table),
		token).Scan(&userID)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", auth.ErrTokenInvalid
	}
	if err != nil {
		return "", err
	}
	return userID, nil
}
