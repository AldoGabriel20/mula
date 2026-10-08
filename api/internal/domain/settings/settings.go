// Package settings holds user preferences and referral info.
package settings

import "errors"

type Preferences struct {
	Locale        string          // id | my | en
	Theme         string          // light | dark | system
	Notifications map[string]bool // per-channel/topic toggles
}

type Referral struct {
	Code string
	// Stats are zero until referral attribution exists (needs signup-with-code + a
	// referrals table — a spec gap, see migration 0012).
	Signups   int
	Published int
	CreditIDR int
}

var ErrInvalid = errors.New("invalid preference")

func ValidLocale(s string) bool { return s == "id" || s == "my" || s == "en" }
func ValidTheme(s string) bool  { return s == "light" || s == "dark" || s == "system" }
