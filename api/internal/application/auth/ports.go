package auth

import (
	"context"
	"time"

	"github.com/mula/mula/internal/domain/user"
)

// Ports the auth service depends on. Implemented in infrastructure/postgres and
// infrastructure/mail. Keeping them here lets the service be unit-tested with fakes.

type UserRepo interface {
	Create(ctx context.Context, email, passwordHash, name string) (*user.User, error) // ErrEmailTaken on dup
	ByEmail(ctx context.Context, email string) (*user.User, error)                    // ErrNotFound
	ByID(ctx context.Context, id string) (*user.User, error)                          // ErrNotFound
	// UpdateProfile: avatarURL / phone nil = unchanged, "" = clear.
	UpdateProfile(ctx context.Context, id, name string, avatarURL, phone *string) (*user.User, error)
	UpdatePassword(ctx context.Context, id, passwordHash string) error
	MarkVerified(ctx context.Context, id string) error
}

type TokenKind string

const (
	KindVerify TokenKind = "verify"
	KindReset  TokenKind = "reset"
)

type TokenRepo interface {
	Create(ctx context.Context, kind TokenKind, userID, token string, expires time.Time) error
	// Consume atomically marks a token used and returns its user id. Second call → ErrTokenInvalid.
	Consume(ctx context.Context, kind TokenKind, token string) (userID string, err error)
}

type Session struct {
	ID        string
	UserID    string
	ExpiresAt time.Time
}

type SessionRepo interface {
	Create(ctx context.Context, userID, userAgent, ip string, ttl time.Duration) (*Session, error)
	Get(ctx context.Context, id string) (*Session, error) // ErrSessionInvalid if missing/expired
	Delete(ctx context.Context, id string) error
	// DeleteForUser revokes every session of a user except keepID ("" = revoke all).
	DeleteForUser(ctx context.Context, userID, keepID string) error
	// ListForUser returns the user's live sessions, newest first.
	ListForUser(ctx context.Context, userID string) ([]SessionInfo, error)
	// DeleteOwned revokes one session only if it belongs to userID (false = not theirs / unknown).
	DeleteOwned(ctx context.Context, userID, id string) (bool, error)
}

// SessionInfo is what the "Signed in on" list shows.
type SessionInfo struct {
	ID        string
	UserAgent string
	IP        string
	CreatedAt time.Time
}

// Mailer sends transactional email. Dev uses a slog-logging implementation.
type Mailer interface {
	SendVerification(ctx context.Context, to, token string) error
	SendPasswordReset(ctx context.Context, to, token string) error
}
