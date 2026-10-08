package postgres

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/mula/mula/internal/domain/event"
)

type MemberRepo struct{ pool *pgxpool.Pool }

func NewMemberRepo(pool *pgxpool.Pool) *MemberRepo { return &MemberRepo{pool: pool} }

// RoleFor is the authorization backbone: one query answers "does this user see
// this event, and as what role". Unknown event, deleted event, non-member, or a
// malformed id all collapse to event.ErrNotFound → the handler returns 404 and
// never leaks existence.
func (r *MemberRepo) RoleFor(ctx context.Context, eventID, userID string) (event.Role, error) {
	var role string
	err := r.pool.QueryRow(ctx,
		`SELECT m.role FROM event_members m
		 JOIN events e ON e.id = m.event_id
		 WHERE m.event_id = $1 AND m.user_id = $2 AND e.deleted_at IS NULL`,
		eventID, userID).Scan(&role)
	if err != nil {
		return "", event.ErrNotFound
	}
	return event.Role(role), nil
}

const memberCols = `m.id, m.event_id, m.user_id, COALESCE(u.name,''), m.email::text, m.role, m.invited_at, m.accepted_at`

func scanMember(row pgx.Row) (*event.Member, error) {
	var m event.Member
	var role string
	if err := row.Scan(&m.ID, &m.EventID, &m.UserID, &m.Name, &m.Email, &role, &m.InvitedAt, &m.AcceptedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, event.ErrMemberNotFound
		}
		return nil, err
	}
	m.Role = event.Role(role)
	return &m, nil
}

const memberFrom = ` FROM event_members m LEFT JOIN users u ON u.id = m.user_id`

func (r *MemberRepo) List(ctx context.Context, eventID string) ([]event.Member, error) {
	rows, err := r.pool.Query(ctx, `SELECT `+memberCols+memberFrom+` WHERE m.event_id=$1 ORDER BY (m.role='owner') DESC, m.invited_at`, eventID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []event.Member{}
	for rows.Next() {
		m, err := scanMember(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *m)
	}
	return out, rows.Err()
}

func (r *MemberRepo) Get(ctx context.Context, id string) (*event.Member, error) {
	m, err := scanMember(r.pool.QueryRow(ctx, `SELECT `+memberCols+memberFrom+` WHERE m.id=$1`, id))
	if err != nil && isInvalidUUID(err) {
		return nil, event.ErrMemberNotFound
	}
	return m, err
}

func (r *MemberRepo) Add(ctx context.Context, eventID, email string, role event.Role) (*event.Member, error) {
	// An already-registered, verified user is attached right away; anyone else stays pending.
	var id string
	err := r.pool.QueryRow(ctx,
		`INSERT INTO event_members (event_id, user_id, email, role, accepted_at)
		 SELECT $1::uuid, u.id, $2::citext, $3::text, CASE WHEN u.id IS NULL THEN NULL ELSE now() END
		   FROM (SELECT 1) one
		   LEFT JOIN users u ON u.email = $2::citext AND u.deleted_at IS NULL AND u.email_verified_at IS NOT NULL
		 RETURNING id`, eventID, email, string(role)).Scan(&id)
	var pg *pgconn.PgError
	if errors.As(err, &pg) && pg.Code == "23505" {
		return nil, event.ErrMemberExists
	}
	if err != nil {
		return nil, err
	}
	return r.Get(ctx, id)
}

func (r *MemberRepo) SetRole(ctx context.Context, id string, role event.Role) (*event.Member, error) {
	if _, err := r.pool.Exec(ctx, `UPDATE event_members SET role=$2 WHERE id=$1 AND role <> 'owner'`, id, string(role)); err != nil {
		return nil, err
	}
	return r.Get(ctx, id)
}

func (r *MemberRepo) Remove(ctx context.Context, id string) error {
	ct, err := r.pool.Exec(ctx, `DELETE FROM event_members WHERE id=$1 AND role <> 'owner'`, id)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return event.ErrMemberNotFound
	}
	return nil
}

// AcceptInvites links invites addressed to a VERIFIED email. Skips events where the account is
// already a member (the unique (event_id, user_id) index would otherwise fail the whole update).
func (r *MemberRepo) AcceptInvites(ctx context.Context, userID, email string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE event_members m SET user_id=$1, accepted_at=now()
		  WHERE m.user_id IS NULL AND m.email=$2
		    AND NOT EXISTS (SELECT 1 FROM event_members x WHERE x.event_id=m.event_id AND x.user_id=$1)`, userID, email)
	return err
}

func isInvalidUUID(err error) bool {
	var pg *pgconn.PgError
	return errors.As(err, &pg) && pg.Code == "22P02"
}
