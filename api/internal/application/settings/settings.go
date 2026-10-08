// Package settings orchestrates user preferences and the referral code.
package settings

import (
	"context"
	"crypto/rand"
	"encoding/base32"
	"strings"

	"github.com/mula/mula/internal/domain/settings"
)

type PrefPatch struct {
	Locale        *string
	Theme         *string
	Notifications map[string]bool // merged over existing keys
}

type Repo interface {
	GetPrefs(ctx context.Context, userID string) (settings.Preferences, error) // defaults if no row
	UpsertPrefs(ctx context.Context, userID string, p PrefPatch) (settings.Preferences, error)
	// ReferralCode returns the user's code, generating+storing one on first call.
	ReferralCode(ctx context.Context, userID, candidate string) (string, error)
}

type Service struct{ repo Repo }

func NewService(r Repo) *Service { return &Service{repo: r} }

func (s *Service) Prefs(ctx context.Context, userID string) (settings.Preferences, error) {
	return s.repo.GetPrefs(ctx, userID)
}

func (s *Service) UpdatePrefs(ctx context.Context, userID string, p PrefPatch) (settings.Preferences, error) {
	if p.Locale != nil && !settings.ValidLocale(*p.Locale) {
		return settings.Preferences{}, settings.ErrInvalid
	}
	if p.Theme != nil && !settings.ValidTheme(*p.Theme) {
		return settings.Preferences{}, settings.ErrInvalid
	}
	return s.repo.UpsertPrefs(ctx, userID, p)
}

func (s *Service) Referral(ctx context.Context, userID string) (settings.Referral, error) {
	code, err := s.repo.ReferralCode(ctx, userID, newCode())
	if err != nil {
		return settings.Referral{}, err
	}
	return settings.Referral{Code: code}, nil
}

// newCode: 8 chars of unambiguous base32, non-guessable (crypto/rand), shareable.
func newCode() string {
	b := make([]byte, 5)
	_, _ = rand.Read(b)
	return strings.ToLower(base32.StdEncoding.WithPadding(base32.NoPadding).EncodeToString(b))
}
