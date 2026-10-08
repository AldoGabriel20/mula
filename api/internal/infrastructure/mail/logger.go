// Package mail provides transactional email implementations. The dev mailer logs
// the message (and token) via slog instead of sending — handy for local auth flows.
package mail

import (
	"context"
	"log/slog"
)

type LoggerMailer struct{ log *slog.Logger }

func NewLoggerMailer(log *slog.Logger) *LoggerMailer { return &LoggerMailer{log: log} }

func (m *LoggerMailer) SendVerification(ctx context.Context, to, token string) error {
	m.log.InfoContext(ctx, "email: verification", "to", to, "token", token)
	return nil
}

func (m *LoggerMailer) SendInvitation(ctx context.Context, to, guestName, eventLabel, link string) error {
	m.log.InfoContext(ctx, "email: invitation", "to", to, "guest", guestName, "event", eventLabel, "link", link)
	return nil
}

func (m *LoggerMailer) SendTeamInvite(ctx context.Context, to, eventLabel, role, link string) error {
	m.log.InfoContext(ctx, "email: team invite", "to", to, "event", eventLabel, "role", role, "link", link)
	return nil
}

func (m *LoggerMailer) SendPasswordReset(ctx context.Context, to, token string) error {
	m.log.InfoContext(ctx, "email: password reset", "to", to, "token", token)
	return nil
}
