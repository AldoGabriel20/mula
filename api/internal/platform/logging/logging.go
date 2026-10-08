// Package logging builds the app's structured slog logger.
package logging

import (
	"log/slog"
	"os"
)

// New returns a slog.Logger. Dev gets text output; anything else gets JSON.
func New(env string) *slog.Logger {
	level := slog.LevelInfo
	if env == "dev" {
		return slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelDebug}))
	}
	return slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: level}))
}
