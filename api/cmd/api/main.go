// Command api is the HTTP server entrypoint: load config, build router, serve.
package main

import (
	"context"
	"errors"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/mula/mula/internal/application/auth"
	billapp "github.com/mula/mula/internal/application/billing"
	eventapp "github.com/mula/mula/internal/application/event"
	giftapp "github.com/mula/mula/internal/application/gift"
	guestapp "github.com/mula/mula/internal/application/guest"
	invapp "github.com/mula/mula/internal/application/invitation"
	opsapp "github.com/mula/mula/internal/application/ops"
	"github.com/mula/mula/internal/application/overview"
	pubapp "github.com/mula/mula/internal/application/publicinvite"
	schapp "github.com/mula/mula/internal/application/schedule"
	setapp "github.com/mula/mula/internal/application/settings"
	taskapp "github.com/mula/mula/internal/application/task"
	"github.com/mula/mula/internal/infrastructure/mail"
	"github.com/mula/mula/internal/infrastructure/payment"
	"github.com/mula/mula/internal/infrastructure/postgres"
	"github.com/mula/mula/internal/infrastructure/storage"
	"github.com/mula/mula/internal/platform/clientip"
	"github.com/mula/mula/internal/platform/config"
	"github.com/mula/mula/internal/platform/logging"
	httptransport "github.com/mula/mula/internal/transport/http"
)

func main() {
	cfg := config.Load()
	log := logging.New(cfg.Env)

	// Which proxies may tell us the client IP. A malformed value is fatal on purpose: silently
	// falling back to "trust nobody" behind a proxy makes every user share one rate-limit bucket.
	ipr, err := clientip.Parse(cfg.TrustedProxies)
	if err != nil {
		log.Error("invalid TRUSTED_PROXIES", "err", err)
		os.Exit(1)
	}
	deps := httptransport.Deps{Log: log, CORSOrigin: cfg.CORSOrigin, Secure: cfg.Env != "dev", ClientIP: ipr}

	// Wire auth only when a database is configured; otherwise serve health-only.
	if cfg.DatabaseURL != "" {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		pool, err := postgres.NewPool(ctx, cfg.DatabaseURL)
		cancel()
		if err != nil {
			log.Error("database connect failed", "err", err)
			os.Exit(1)
		}
		defer pool.Close()

		mailer := mail.NewLoggerMailer(log)
		svc := auth.NewService(
			postgres.NewUserRepo(pool),
			postgres.NewTokenRepo(pool),
			postgres.NewSessionRepo(pool),
			mailer,
		)
		deps.Auth = svc
		deps.Event = eventapp.NewService(postgres.NewEventRepo(pool), postgres.NewMemberRepo(pool)).WithMailer(mailer, cfg.PublicBaseURL)
		ovRepo := postgres.NewOverviewRepo(pool)
		deps.Overview = overview.NewService(ovRepo).WithActivity(ovRepo)
		deps.Guest = guestapp.NewService(postgres.NewGuestRepo(pool)).WithMailer(mailer, cfg.PublicBaseURL)
		deps.Invitation = invapp.NewService(postgres.NewInvitationRepo(pool))
		deps.Schedule = schapp.NewService(postgres.NewScheduleRepo(pool))
		deps.Task = taskapp.NewService(postgres.NewTaskRepo(pool))
		deps.Settings = setapp.NewService(postgres.NewSettingsRepo(pool))
		deps.Public = pubapp.NewService(postgres.NewPublicInviteRepo(pool))
		deps.Ops = opsapp.NewService(postgres.NewOpsRepo(pool))

		store, err := storage.NewLocal(cfg.MediaDir)
		if err != nil {
			log.Error("media storage init failed", "err", err)
			os.Exit(1)
		}
		// Signed media URLs: a missing key outside dev would make them forgeable → refuse to start.
		mediaSecret := cfg.MediaSecret
		if mediaSecret == "" {
			if cfg.Env != "dev" {
				log.Error("MEDIA_SIGNING_SECRET is required outside dev")
				os.Exit(1)
			}
			mediaSecret = "dev-insecure-media-secret"
			log.Warn("using insecure dev media signing secret")
		}
		deps.Gift = giftapp.NewService(postgres.NewGiftRepo(pool), store, storage.NewSigner(mediaSecret))

		// A missing webhook secret outside dev would make webhooks forgeable → refuse to start.
		secret := cfg.PaymentSecret
		if secret == "" {
			if cfg.Env != "dev" {
				log.Error("PAYMENT_WEBHOOK_SECRET is required outside dev")
				os.Exit(1)
			}
			secret = "dev-insecure-secret"
			log.Warn("using insecure dev payment webhook secret")
		}
		deps.Billing = billapp.NewService(postgres.NewBillingRepo(pool), payment.NewDev(secret, "/pay/dev"))
		deps.Pool = pool
	} else {
		log.Warn("DATABASE_URL unset — serving health endpoints only")
	}

	srv := &http.Server{
		Addr:              cfg.Addr,
		Handler:           httptransport.NewRouter(deps),
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       60 * time.Second, // slow-body guard; largest body is a 10MB upload
		IdleTimeout:       120 * time.Second,
	}

	go func() {
		log.Info("api listening", "addr", cfg.Addr, "env", cfg.Env)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Error("server error", "err", err)
			os.Exit(1)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Error("graceful shutdown failed", "err", err)
	}
	log.Info("stopped")
}
