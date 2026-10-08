// Package auth orchestrates registration, login, sessions, email verification and
// password reset. It is the source of truth for auth business rules.
package auth

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"strings"
	"time"

	"github.com/mula/mula/internal/domain/user"
)

var (
	ErrTokenInvalid   = errors.New("token invalid or expired")
	ErrSessionInvalid = errors.New("session invalid or expired")
	ErrWeakPassword   = errors.New("password too short")
)

const (
	minPasswordLen = 8
	verifyTTL      = 24 * time.Hour
	resetTTL       = time.Hour
	sessionTTL     = 7 * 24 * time.Hour
)

type Service struct {
	users    UserRepo
	tokens   TokenRepo
	sessions SessionRepo
	mail     Mailer
}

func NewService(u UserRepo, t TokenRepo, s SessionRepo, m Mailer) *Service {
	return &Service{users: u, tokens: t, sessions: s, mail: m}
}

func normalizeEmail(e string) string { return strings.TrimSpace(strings.ToLower(e)) }

// Register creates an account, mints a verification token, and emails it.
// Returns ErrEmailTaken (→409) on duplicate, ErrWeakPassword (→400) on short pw.
func (s *Service) Register(ctx context.Context, email, password, name string) (*user.User, error) {
	if len(password) < minPasswordLen {
		return nil, ErrWeakPassword
	}
	hash, err := HashPassword(password)
	if err != nil {
		return nil, err
	}
	u, err := s.users.Create(ctx, normalizeEmail(email), hash, strings.TrimSpace(name))
	if err != nil {
		return nil, err
	}
	if err := s.issueVerification(ctx, u); err != nil {
		return nil, err
	}
	return u, nil
}

func (s *Service) issueVerification(ctx context.Context, u *user.User) error {
	tok := newToken()
	if err := s.tokens.Create(ctx, KindVerify, u.ID, tok, time.Now().Add(verifyTTL)); err != nil {
		return err
	}
	return s.mail.SendVerification(ctx, u.Email, tok)
}

// Login verifies credentials and opens a session. Wrong email OR password both
// yield ErrInvalidCredentials (→401) — no account enumeration.
func (s *Service) Login(ctx context.Context, email, password, userAgent, ip string) (*user.User, *Session, error) {
	u, err := s.users.ByEmail(ctx, normalizeEmail(email))
	if err != nil {
		if errors.Is(err, user.ErrNotFound) {
			return nil, nil, user.ErrInvalidCredentials
		}
		return nil, nil, err
	}
	ok, err := VerifyPassword(password, u.PasswordHash)
	if err != nil || !ok {
		return nil, nil, user.ErrInvalidCredentials
	}
	sess, err := s.sessions.Create(ctx, u.ID, userAgent, ip, sessionTTL)
	if err != nil {
		return nil, nil, err
	}
	return u, sess, nil
}

func (s *Service) Logout(ctx context.Context, sessionID string) error {
	return s.sessions.Delete(ctx, sessionID)
}

// Authenticate resolves a session id to its user (for the auth middleware).
func (s *Service) Authenticate(ctx context.Context, sessionID string) (*user.User, error) {
	sess, err := s.sessions.Get(ctx, sessionID)
	if err != nil {
		return nil, err
	}
	return s.users.ByID(ctx, sess.UserID)
}

func (s *Service) VerifyEmail(ctx context.Context, token string) error {
	uid, err := s.tokens.Consume(ctx, KindVerify, token)
	if err != nil {
		return err
	}
	return s.users.MarkVerified(ctx, uid)
}

func (s *Service) ResendVerification(ctx context.Context, email string) error {
	u, err := s.users.ByEmail(ctx, normalizeEmail(email))
	if err != nil {
		if errors.Is(err, user.ErrNotFound) {
			return nil // don't reveal whether the email exists
		}
		return err
	}
	if u.Verified() {
		return nil
	}
	return s.issueVerification(ctx, u)
}

// ForgotPassword emails a reset token. Always returns nil to callers so the
// response can't be used to enumerate accounts.
func (s *Service) ForgotPassword(ctx context.Context, email string) error {
	u, err := s.users.ByEmail(ctx, normalizeEmail(email))
	if err != nil {
		if errors.Is(err, user.ErrNotFound) {
			return nil
		}
		return err
	}
	tok := newToken()
	if err := s.tokens.Create(ctx, KindReset, u.ID, tok, time.Now().Add(resetTTL)); err != nil {
		return err
	}
	return s.mail.SendPasswordReset(ctx, u.Email, tok)
}

// ResetPassword consumes a single-use reset token and sets the new password.
func (s *Service) ResetPassword(ctx context.Context, token, newPassword string) error {
	if len(newPassword) < minPasswordLen {
		return ErrWeakPassword
	}
	uid, err := s.tokens.Consume(ctx, KindReset, token)
	if err != nil {
		return err
	}
	hash, err := HashPassword(newPassword)
	if err != nil {
		return err
	}
	if err := s.users.UpdatePassword(ctx, uid, hash); err != nil {
		return err
	}
	// A reset usually means "someone else may have my session": sign out everywhere.
	return s.sessions.DeleteForUser(ctx, uid, "")
}

func (s *Service) Me(ctx context.Context, id string) (*user.User, error) {
	return s.users.ByID(ctx, id)
}

func (s *Service) UpdateProfile(ctx context.Context, id, name string, avatarURL, phone *string) (*user.User, error) {
	return s.users.UpdateProfile(ctx, id, strings.TrimSpace(name), avatarURL, phone)
}

func (s *Service) Sessions(ctx context.Context, userID string) ([]SessionInfo, error) {
	return s.sessions.ListForUser(ctx, userID)
}

// RevokeSession signs one of the caller's own devices out; a foreign or unknown id is ErrSessionInvalid-free 404 upstream.
func (s *Service) RevokeSession(ctx context.Context, userID, id string) (bool, error) {
	return s.sessions.DeleteOwned(ctx, userID, id)
}

// ChangePassword verifies the current password before setting a new one.
func (s *Service) ChangePassword(ctx context.Context, id, current, next, keepSessionID string) error {
	if len(next) < minPasswordLen {
		return ErrWeakPassword
	}
	u, err := s.users.ByID(ctx, id)
	if err != nil {
		return err
	}
	ok, err := VerifyPassword(current, u.PasswordHash)
	if err != nil || !ok {
		return user.ErrInvalidCredentials
	}
	hash, err := HashPassword(next)
	if err != nil {
		return err
	}
	if err := s.users.UpdatePassword(ctx, id, hash); err != nil {
		return err
	}
	return s.sessions.DeleteForUser(ctx, id, keepSessionID) // other devices are signed out; this one stays
}

func newToken() string {
	b := make([]byte, 32)
	_, _ = rand.Read(b)
	return base64.RawURLEncoding.EncodeToString(b)
}
