// Package config loads service configuration from the environment (12-factor).
package config

import (
	"fmt"
	"os"
)

type Config struct {
	Addr           string // HTTP listen address, e.g. ":8080"
	DatabaseURL    string // postgres DSN; required by the migrate command
	CORSOrigin     string // allowed browser origin for the SPA
	Env            string // "dev" | "prod"
	MediaDir       string // local media blob directory (dev); S3 impl replaces this in prod
	PaymentSecret  string // shared secret for webhook HMAC (dev provider); required when Env != dev
	MediaSecret    string // HMAC key for signed media URLs; required when Env != dev
	PublicBaseURL  string // web origin used in links we email (invitations); defaults to CORS_ORIGIN
	TrustedProxies string // comma-separated CIDRs/IPs whose X-Forwarded-For we believe; empty = trust nobody
}

// Load reads config from env with sane dev defaults. DatabaseURL has no default:
// it is only required where a DB connection is actually used (migrate).
func Load() Config {
	return Config{
		Addr:           env("API_ADDR", ":8080"),
		DatabaseURL:    os.Getenv("DATABASE_URL"),
		CORSOrigin:     env("CORS_ORIGIN", "http://localhost:3000"),
		Env:            env("APP_ENV", "dev"),
		MediaDir:       env("MEDIA_DIR", "./var/media"),
		PaymentSecret:  os.Getenv("PAYMENT_WEBHOOK_SECRET"),
		MediaSecret:    os.Getenv("MEDIA_SIGNING_SECRET"),
		PublicBaseURL:  env("PUBLIC_BASE_URL", env("CORS_ORIGIN", "http://localhost:3000")),
		TrustedProxies: os.Getenv("TRUSTED_PROXIES"),
	}
}

// RequireDatabaseURL returns the DSN or an error when it is unset.
func (c Config) RequireDatabaseURL() (string, error) {
	if c.DatabaseURL == "" {
		return "", fmt.Errorf("DATABASE_URL is required")
	}
	return c.DatabaseURL, nil
}

func env(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
