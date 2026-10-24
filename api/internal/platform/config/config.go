// Package config loads service configuration from the environment (12-factor).
package config

import (
	"fmt"
	"os"
	"strconv"
)

type Config struct {
	Addr           string // HTTP listen address, e.g. ":8080"
	DatabaseURL    string // postgres DSN; required by the migrate command
	CORSOrigin     string // allowed browser origin for the SPA
	Env            string // "dev" | "prod"
	MediaDir       string // local media blob directory (dev); S3 impl replaces this in prod
	CatalogDir     string // template catalog (manifests, section content schemas); the API refuses to start without a valid one
	PaymentSecret  string // shared secret for webhook HMAC (dev provider); required when Env != dev
	MediaSecret    string // HMAC key for signed media URLs; required when Env != dev
	PublicBaseURL  string // web origin used in links we email (invitations); defaults to CORS_ORIGIN
	TrustedProxies string // comma-separated CIDRs/IPs whose X-Forwarded-For we believe; empty = trust nobody
	// DevAuthRatePerMin / DevAuthRateBurst raise the per-IP limit on auth + guest endpoints so a browser test
	// suite (every page from 127.0.0.1) is not throttled. Honoured ONLY when Env == "dev"; 0 = the production default.
	DevAuthRatePerMin, DevAuthRateBurst int
}

// Load reads config from env with sane dev defaults. DatabaseURL has no default:
// it is only required where a DB connection is actually used (migrate).
func Load() Config {
	return Config{
		Addr:              env("API_ADDR", ":8080"),
		DatabaseURL:       os.Getenv("DATABASE_URL"),
		CORSOrigin:        env("CORS_ORIGIN", "http://localhost:3000"),
		Env:               env("APP_ENV", "dev"),
		MediaDir:          env("MEDIA_DIR", "./var/media"),
		CatalogDir:        env("CATALOG_DIR", "../catalog"),
		PaymentSecret:     os.Getenv("PAYMENT_WEBHOOK_SECRET"),
		MediaSecret:       os.Getenv("MEDIA_SIGNING_SECRET"),
		PublicBaseURL:     env("PUBLIC_BASE_URL", env("CORS_ORIGIN", "http://localhost:3000")),
		TrustedProxies:    os.Getenv("TRUSTED_PROXIES"),
		DevAuthRatePerMin: atoi("DEV_AUTH_RATE_PER_MIN"),
		DevAuthRateBurst:  atoi("DEV_AUTH_RATE_BURST"),
	}
}

// RequireDatabaseURL returns the DSN or an error when it is unset.
func (c Config) RequireDatabaseURL() (string, error) {
	if c.DatabaseURL == "" {
		return "", fmt.Errorf("DATABASE_URL is required")
	}
	return c.DatabaseURL, nil
}

func atoi(key string) int {
	n, _ := strconv.Atoi(os.Getenv(key))
	if n < 0 {
		return 0
	}
	return n
}

func env(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
