package postgres

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/mula/mula/internal/domain/user"
)

type UserRepo struct{ pool *pgxpool.Pool }

func NewUserRepo(pool *pgxpool.Pool) *UserRepo { return &UserRepo{pool: pool} }

const userCols = `id, email, password_hash, name, avatar_url, phone, email_verified_at, created_at, updated_at`

func scanUser(row pgx.Row) (*user.User, error) {
	var u user.User
	if err := row.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.Name, &u.AvatarURL, &u.Phone, &u.EmailVerifiedAt, &u.CreatedAt, &u.UpdatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, user.ErrNotFound
		}
		return nil, err
	}
	return &u, nil
}

func isUniqueViolation(err error) bool {
	var pg *pgconn.PgError
	return errors.As(err, &pg) && pg.Code == "23505"
}

func (r *UserRepo) Create(ctx context.Context, email, passwordHash, name string) (*user.User, error) {
	row := r.pool.QueryRow(ctx,
		`INSERT INTO users (email, password_hash, name) VALUES ($1,$2,$3) RETURNING `+userCols,
		email, passwordHash, name)
	u, err := scanUser(row)
	if err != nil {
		if isUniqueViolation(err) {
			return nil, user.ErrEmailTaken
		}
		return nil, err
	}
	return u, nil
}

func (r *UserRepo) ByEmail(ctx context.Context, email string) (*user.User, error) {
	return scanUser(r.pool.QueryRow(ctx, `SELECT `+userCols+` FROM users WHERE email=$1 AND deleted_at IS NULL`, email))
}

func (r *UserRepo) ByID(ctx context.Context, id string) (*user.User, error) {
	return scanUser(r.pool.QueryRow(ctx, `SELECT `+userCols+` FROM users WHERE id=$1 AND deleted_at IS NULL`, id))
}

func (r *UserRepo) UpdateProfile(ctx context.Context, id, name string, avatarURL, phone *string) (*user.User, error) {
	return scanUser(r.pool.QueryRow(ctx,
		`UPDATE users SET name=$2,
		   avatar_url = CASE WHEN $3::text IS NULL THEN avatar_url ELSE NULLIF($3,'') END,
		   phone      = CASE WHEN $4::text IS NULL THEN phone ELSE NULLIF($4,'') END,
		   updated_at=now() WHERE id=$1 AND deleted_at IS NULL RETURNING `+userCols,
		id, name, avatarURL, phone))
}

func (r *UserRepo) UpdatePassword(ctx context.Context, id, passwordHash string) error {
	ct, err := r.pool.Exec(ctx, `UPDATE users SET password_hash=$2, updated_at=now() WHERE id=$1`, id, passwordHash)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return user.ErrNotFound
	}
	return nil
}

func (r *UserRepo) MarkVerified(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `UPDATE users SET email_verified_at=now(), updated_at=now() WHERE id=$1 AND email_verified_at IS NULL`, id)
	return err
}
