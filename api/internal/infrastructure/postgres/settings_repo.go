package postgres

import (
	"context"
	"encoding/json"

	"github.com/jackc/pgx/v5/pgxpool"

	appset "github.com/mula/mula/internal/application/settings"
	"github.com/mula/mula/internal/domain/settings"
)

type SettingsRepo struct{ pool *pgxpool.Pool }

func NewSettingsRepo(pool *pgxpool.Pool) *SettingsRepo { return &SettingsRepo{pool: pool} }

func decodePrefs(locale, theme string, raw []byte) settings.Preferences {
	p := settings.Preferences{Locale: locale, Theme: theme, Notifications: map[string]bool{}}
	_ = json.Unmarshal(raw, &p.Notifications)
	return p
}

func (r *SettingsRepo) GetPrefs(ctx context.Context, userID string) (settings.Preferences, error) {
	var locale, theme string
	var raw []byte
	err := r.pool.QueryRow(ctx, `SELECT locale, theme, notifications FROM user_preferences WHERE user_id=$1`, userID).Scan(&locale, &theme, &raw)
	if err != nil { // no row → defaults (table defaults: en / system / {})
		return settings.Preferences{Locale: "en", Theme: "system", Notifications: map[string]bool{}}, nil
	}
	return decodePrefs(locale, theme, raw), nil
}

// UpsertPrefs merges the notification keys over existing ones (jsonb ||) so a client
// toggling one switch doesn't wipe the others.
func (r *SettingsRepo) UpsertPrefs(ctx context.Context, userID string, p appset.PrefPatch) (settings.Preferences, error) {
	merge := []byte("{}")
	if p.Notifications != nil {
		merge, _ = json.Marshal(p.Notifications)
	}
	var locale, theme string
	var raw []byte
	err := r.pool.QueryRow(ctx,
		`INSERT INTO user_preferences (user_id, locale, theme, notifications)
		 VALUES ($1, COALESCE($2,'en'), COALESCE($3,'system'), $4::jsonb)
		 ON CONFLICT (user_id) DO UPDATE SET
		   locale = COALESCE($2, user_preferences.locale),
		   theme = COALESCE($3, user_preferences.theme),
		   notifications = user_preferences.notifications || $4::jsonb
		 RETURNING locale, theme, notifications`,
		userID, p.Locale, p.Theme, string(merge)).Scan(&locale, &theme, &raw)
	if err != nil {
		return settings.Preferences{}, err
	}
	return decodePrefs(locale, theme, raw), nil
}

// ReferralCode is race-safe: the conditional UPDATE only sets a code when none exists,
// then we read back whatever won.
func (r *SettingsRepo) ReferralCode(ctx context.Context, userID, candidate string) (string, error) {
	if _, err := r.pool.Exec(ctx, `UPDATE users SET referral_code=$2 WHERE id=$1 AND referral_code IS NULL`, userID, candidate); err != nil {
		return "", err
	}
	var code string
	err := r.pool.QueryRow(ctx, `SELECT referral_code FROM users WHERE id=$1`, userID).Scan(&code)
	return code, err
}
