// Package http wires the route table and middleware stack (mirrors docs/08).
package http

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"

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
	"github.com/mula/mula/internal/platform/clientip"
	"github.com/mula/mula/internal/transport/http/middleware"
)

// Deps are the dependencies a router needs.
type Deps struct {
	Log        *slog.Logger
	CORSOrigin string
	Auth       *auth.Service
	Event      *eventapp.Service
	Overview   *overview.Service
	Guest      *guestapp.Service
	Invitation *invapp.Service
	Schedule   *schapp.Service
	Task       *taskapp.Service
	Ops        *opsapp.Service
	Gift       *giftapp.Service
	Billing    *billapp.Service
	Settings   *setapp.Service
	Public     *pubapp.Service
	Pool       *pgxpool.Pool // optional; enables the DB readiness probe
	Secure     bool          // set cookies Secure (prod/HTTPS)
	// ClientIP resolves the real client address (honouring X-Forwarded-For ONLY from trusted
	// proxies). nil = trust nobody (peer address).
	ClientIP *clientip.Resolver
	// AuthRateLimit overrides the per-IP limiter on auth/public endpoints (per-minute, burst).
	// Zero value = production default (30/min, burst 10). Tests raise it; never disable it.
	AuthRatePerMin, AuthRateBurst int
}

// NewRouter builds the HTTP handler: stdlib ServeMux + the middleware stack.
func NewRouter(d Deps) http.Handler {
	mux := http.NewServeMux()

	// health
	mux.HandleFunc("GET /healthz", health)
	mux.HandleFunc("GET /readyz", readyz(d.Pool))

	// auth — present only when wired (keeps the scaffold's health-only router usable)
	if d.Auth != nil {
		ipr := d.ClientIP
		if ipr == nil {
			ipr, _ = clientip.Parse("") // trust nobody
		}
		ah := NewAuthHandler(d.Auth, d.Secure, ipr)
		mh := NewMeHandler(d.Auth, d.Secure)
		perMin, burst := 30, 10 // production default: per-IP 30/min, burst 10
		if d.AuthRatePerMin > 0 {
			perMin, burst = d.AuthRatePerMin, d.AuthRateBurst
		}
		authRL := middleware.RateLimit(perMin, burst, ipr.IP) // per real client IP (anonymous endpoints)
		// Per-USER limits for authenticated writes (doc 10: "writes per user"). Two tiers:
		//  - heavy: ops that cost real CPU/memory/IO (argon2 verify ≈46ms+64MiB, 5MB uploads, bulk import,
		//    checkout) → tight.   - write: every other mutation → generous, only stops runaway scripts.
		heavyPer, heavyBurst, writePer, writeBurst := 20, 5, 600, 60
		if d.AuthRatePerMin > 0 { // tests raise the limits; production values above are the defaults
			heavyPer, heavyBurst, writePer, writeBurst = d.AuthRatePerMin, d.AuthRateBurst, d.AuthRatePerMin, d.AuthRateBurst
		}
		heavyRL := middleware.RateLimit(heavyPer, heavyBurst, rateKeyUser)
		writeRL := middleware.RateLimit(writePer, writeBurst, rateKeyUser)
		// `csrf` is on EVERY authenticated mutation and always runs after needAuth, so it is the one
		// choke point: it checks the CSRF token AND applies the per-user write limit. A new write
		// route can therefore not forget either (TestWriteRoutesAreRateLimited proves it).
		csrfCheck := middleware.CSRF(csrfCookie, "X-CSRF-Token")
		csrf := func(next http.Handler) http.Handler { return csrfCheck(writeRL(next)) }
		needAuth := requireAuth(d.Auth)

		// public (rate-limited)
		mux.Handle("POST /api/v1/auth/register", authRL(http.HandlerFunc(ah.Register)))
		mux.Handle("POST /api/v1/auth/login", authRL(http.HandlerFunc(ah.Login)))
		mux.Handle("POST /api/v1/auth/verify", authRL(http.HandlerFunc(ah.Verify)))
		mux.Handle("POST /api/v1/auth/verify/resend", authRL(http.HandlerFunc(ah.ResendVerification)))
		mux.Handle("POST /api/v1/auth/password/forgot", authRL(http.HandlerFunc(ah.Forgot)))
		mux.Handle("POST /api/v1/auth/password/reset", authRL(http.HandlerFunc(ah.Reset)))

		// authenticated (CSRF on mutations)
		mux.Handle("POST /api/v1/auth/logout", middleware.Chain(http.HandlerFunc(ah.Logout), needAuth, csrf))
		mux.Handle("GET /api/v1/me", needAuth(http.HandlerFunc(mh.Get)))
		mux.Handle("PATCH /api/v1/me", middleware.Chain(http.HandlerFunc(mh.Update), needAuth, csrf))
		mux.Handle("GET /api/v1/me/sessions", needAuth(http.HandlerFunc(mh.Sessions)))
		mux.Handle("DELETE /api/v1/me/sessions/{sid}", middleware.Chain(http.HandlerFunc(mh.RevokeSession), needAuth, csrf))
		mux.Handle("POST /api/v1/me/password", middleware.Chain(http.HandlerFunc(mh.ChangePassword), needAuth, csrf, heavyRL))

		if d.Settings != nil {
			sth := NewSettingsHandler(d.Settings)
			mux.Handle("GET /api/v1/me/preferences", needAuth(http.HandlerFunc(sth.GetPrefs)))
			mux.Handle("PATCH /api/v1/me/preferences", middleware.Chain(http.HandlerFunc(sth.PatchPrefs), needAuth, csrf))
			mux.Handle("GET /api/v1/me/referral", needAuth(http.HandlerFunc(sth.Referral)))
		}

		// guest-facing (no session; the token in the path is the credential). Rate-limited.
		if d.Public != nil {
			ph := NewPublicHandler(d.Public)
			mux.Handle("GET /api/v1/invite/{token}", authRL(http.HandlerFunc(ph.Get)))
			mux.Handle("POST /api/v1/invite/{token}/rsvp", authRL(http.HandlerFunc(ph.RSVP)))
			mux.Handle("POST /api/v1/invite/{token}/wish", authRL(http.HandlerFunc(ph.Wish)))
		}

		// billing: catalog is public; subscription/invoices/checkout need a session; the
		// webhook is authenticated by the provider signature (no cookie, no CSRF).
		if d.Billing != nil {
			bh := NewBillingHandler(d.Billing)
			mux.HandleFunc("GET /api/v1/packages", bh.Packages)
			mux.HandleFunc("GET /api/v1/addons", bh.Addons)
			mux.Handle("GET /api/v1/billing/subscription", needAuth(http.HandlerFunc(bh.Subscription)))
			mux.Handle("GET /api/v1/billing/invoices", needAuth(http.HandlerFunc(bh.Invoices)))
			mux.Handle("POST /api/v1/billing/checkout", middleware.Chain(http.HandlerFunc(bh.Checkout), needAuth, csrf, heavyRL))
			mux.Handle("POST /api/v1/billing/webhook", authRL(http.HandlerFunc(bh.Webhook)))
		}

		// events + membership authz (requireEventRole runs after needAuth)
		if d.Event != nil {
			eh := NewEventHandler(d.Event)
			member := requireEventRole(d.Event, anyMember)
			editor := requireEventRole(d.Event, editorOnly)
			owner := requireEventRole(d.Event, ownerOnly)

			mh2 := NewMembersHandler(d.Event)
			mux.Handle("GET /api/v1/events/{id}/members", middleware.Chain(http.HandlerFunc(mh2.List), needAuth, member))
			mux.Handle("POST /api/v1/events/{id}/members", middleware.Chain(http.HandlerFunc(mh2.Invite), needAuth, csrf, owner))
			mux.Handle("PATCH /api/v1/events/{id}/members/{mid}", middleware.Chain(http.HandlerFunc(mh2.Patch), needAuth, csrf, owner))
			mux.Handle("DELETE /api/v1/events/{id}/members/{mid}", middleware.Chain(http.HandlerFunc(mh2.Delete), needAuth, csrf, owner))

			mux.Handle("GET /api/v1/events", needAuth(http.HandlerFunc(eh.List)))
			mux.Handle("POST /api/v1/events", middleware.Chain(http.HandlerFunc(eh.Create), needAuth, csrf))
			mux.Handle("GET /api/v1/events/{id}", middleware.Chain(http.HandlerFunc(eh.Get), needAuth, member))
			mux.Handle("PATCH /api/v1/events/{id}", middleware.Chain(http.HandlerFunc(eh.Patch), needAuth, csrf, editor))
			mux.Handle("DELETE /api/v1/events/{id}", middleware.Chain(http.HandlerFunc(eh.Delete), needAuth, csrf, owner))

			if d.Overview != nil {
				oh := NewOverviewHandler(d.Event, d.Overview)
				mux.Handle("GET /api/v1/events/{id}/overview", middleware.Chain(http.HandlerFunc(oh.Get), needAuth, member))
				mux.Handle("GET /api/v1/events/{id}/activity", middleware.Chain(http.HandlerFunc(oh.Activity), needAuth, member))
				mux.Handle("POST /api/v1/events/{id}/notes/{key}/dismiss", middleware.Chain(http.HandlerFunc(oh.DismissNote), needAuth, csrf, member))
			}

			if d.Guest != nil {
				gh := NewGuestHandler(d.Guest, d.Event)
				mux.Handle("GET /api/v1/events/{id}/guests", middleware.Chain(http.HandlerFunc(gh.List), needAuth, member))
				mux.Handle("POST /api/v1/events/{id}/guests", middleware.Chain(http.HandlerFunc(gh.Create), needAuth, csrf, editor))
				mux.Handle("GET /api/v1/events/{id}/guests/segments", middleware.Chain(http.HandlerFunc(gh.Segments), needAuth, member))
				mux.Handle("POST /api/v1/events/{id}/guests/import", middleware.Chain(http.HandlerFunc(gh.Import), needAuth, csrf, editor, heavyRL))
				mux.Handle("GET /api/v1/events/{id}/guests/{gid}", middleware.Chain(http.HandlerFunc(gh.Get), needAuth, editor))
				mux.Handle("PATCH /api/v1/events/{id}/guests/{gid}", middleware.Chain(http.HandlerFunc(gh.Patch), needAuth, csrf, editor))
				mux.Handle("DELETE /api/v1/events/{id}/guests/{gid}", middleware.Chain(http.HandlerFunc(gh.Delete), needAuth, csrf, editor))
				mux.Handle("POST /api/v1/events/{id}/guests/{gid}/resend", middleware.Chain(http.HandlerFunc(gh.Resend), needAuth, csrf, editor, heavyRL))
				mux.Handle("GET /api/v1/events/{id}/groups", middleware.Chain(http.HandlerFunc(gh.ListGroups), needAuth, editor))
				mux.Handle("POST /api/v1/events/{id}/groups", middleware.Chain(http.HandlerFunc(gh.CreateGroup), needAuth, csrf, editor))
			}

			if d.Invitation != nil {
				ih := NewInvitationHandler(d.Invitation)
				mux.HandleFunc("GET /api/v1/templates", ih.Templates)
				mux.Handle("GET /api/v1/events/{id}/invitation", middleware.Chain(http.HandlerFunc(ih.Get), needAuth, member))
				mux.Handle("PATCH /api/v1/events/{id}/invitation", middleware.Chain(http.HandlerFunc(ih.Update), needAuth, csrf, editor))
				mux.Handle("POST /api/v1/events/{id}/invitation/sections", middleware.Chain(http.HandlerFunc(ih.AddSection), needAuth, csrf, editor))
				mux.Handle("POST /api/v1/events/{id}/invitation/sections/reorder", middleware.Chain(http.HandlerFunc(ih.Reorder), needAuth, csrf, editor))
				mux.Handle("PATCH /api/v1/events/{id}/invitation/sections/{sid}", middleware.Chain(http.HandlerFunc(ih.UpdateSection), needAuth, csrf, editor))
				mux.Handle("DELETE /api/v1/events/{id}/invitation/sections/{sid}", middleware.Chain(http.HandlerFunc(ih.DeleteSection), needAuth, csrf, editor))
				mux.Handle("POST /api/v1/events/{id}/invitation/publish", middleware.Chain(http.HandlerFunc(ih.Publish), needAuth, csrf, editor))
				mux.Handle("POST /api/v1/events/{id}/invitation/unpublish", middleware.Chain(http.HandlerFunc(ih.Unpublish), needAuth, csrf, editor))
			}

			if d.Schedule != nil {
				sh := NewScheduleHandler(d.Schedule)
				mux.Handle("GET /api/v1/events/{id}/schedule", middleware.Chain(http.HandlerFunc(sh.List), needAuth, member))
				mux.Handle("POST /api/v1/events/{id}/schedule", middleware.Chain(http.HandlerFunc(sh.Create), needAuth, csrf, editor))
				mux.Handle("POST /api/v1/events/{id}/schedule/reorder", middleware.Chain(http.HandlerFunc(sh.Reorder), needAuth, csrf, editor))
				mux.Handle("GET /api/v1/events/{id}/schedule.ics", middleware.Chain(http.HandlerFunc(sh.ICS), needAuth, member))
				mux.Handle("PATCH /api/v1/events/{id}/schedule/{sid}", middleware.Chain(http.HandlerFunc(sh.Patch), needAuth, csrf, editor))
				mux.Handle("DELETE /api/v1/events/{id}/schedule/{sid}", middleware.Chain(http.HandlerFunc(sh.Delete), needAuth, csrf, editor))
			}

			if d.Task != nil {
				th := NewTaskHandler(d.Task)
				mux.Handle("GET /api/v1/events/{id}/tasks", middleware.Chain(http.HandlerFunc(th.List), needAuth, member))
				mux.Handle("POST /api/v1/events/{id}/tasks", middleware.Chain(http.HandlerFunc(th.Create), needAuth, csrf, editor))
				mux.Handle("PATCH /api/v1/events/{id}/tasks/{tid}", middleware.Chain(http.HandlerFunc(th.Patch), needAuth, csrf, editor))
				mux.Handle("DELETE /api/v1/events/{id}/tasks/{tid}", middleware.Chain(http.HandlerFunc(th.Delete), needAuth, csrf, editor))
			}

			if d.Ops != nil {
				oph := NewOpsHandler(d.Ops)
				staff := requireEventRole(d.Event, staffOnly)
				mux.Handle("GET /api/v1/events/{id}/checkin", middleware.Chain(http.HandlerFunc(oph.Arrivals), needAuth, staff))
				mux.Handle("POST /api/v1/events/{id}/checkin", middleware.Chain(http.HandlerFunc(oph.CheckIn), needAuth, csrf, staff))
				mux.Handle("GET /api/v1/events/{id}/eventday", middleware.Chain(http.HandlerFunc(oph.EventDay), needAuth, member))
				mux.Handle("GET /api/v1/events/{id}/live", middleware.Chain(http.HandlerFunc(oph.GetLive), needAuth, editor))
				mux.Handle("PATCH /api/v1/events/{id}/live", middleware.Chain(http.HandlerFunc(oph.PatchLive), needAuth, csrf, editor))
			}

			if d.Gift != nil {
				gh := NewGiftHandler(d.Gift)
				mux.Handle("GET /api/v1/events/{id}/gifts", middleware.Chain(http.HandlerFunc(gh.ListGifts), needAuth, member))
				mux.Handle("POST /api/v1/events/{id}/gifts", middleware.Chain(http.HandlerFunc(gh.CreateGift), needAuth, csrf, editor))
				mux.Handle("PATCH /api/v1/events/{id}/gifts/{gid}", middleware.Chain(http.HandlerFunc(gh.PatchGift), needAuth, csrf, editor))
				mux.Handle("DELETE /api/v1/events/{id}/gifts/{gid}", middleware.Chain(http.HandlerFunc(gh.DeleteGift), needAuth, csrf, editor))
				mux.Handle("GET /api/v1/events/{id}/gift-methods", middleware.Chain(http.HandlerFunc(gh.ListMethods), needAuth, member))
				mux.Handle("POST /api/v1/events/{id}/gift-methods", middleware.Chain(http.HandlerFunc(gh.CreateMethod), needAuth, csrf, editor))
				mux.Handle("POST /api/v1/events/{id}/gift-methods/reorder", middleware.Chain(http.HandlerFunc(gh.ReorderMethods), needAuth, csrf, editor))
				mux.Handle("PATCH /api/v1/events/{id}/gift-methods/{mid}", middleware.Chain(http.HandlerFunc(gh.PatchMethod), needAuth, csrf, editor))
				mux.Handle("DELETE /api/v1/events/{id}/gift-methods/{mid}", middleware.Chain(http.HandlerFunc(gh.DeleteMethod), needAuth, csrf, editor))
				mux.Handle("GET /api/v1/events/{id}/transactions", middleware.Chain(http.HandlerFunc(gh.ListTransactions), needAuth, member))
				mux.Handle("GET /api/v1/events/{id}/wishes", middleware.Chain(http.HandlerFunc(gh.ListWishes), needAuth, member))
				mux.Handle("PATCH /api/v1/events/{id}/wishes/{wid}", middleware.Chain(http.HandlerFunc(gh.ApproveWish), needAuth, csrf, editor))
				mux.Handle("GET /api/v1/events/{id}/media", middleware.Chain(http.HandlerFunc(gh.ListMedia), needAuth, member))
				mux.Handle("POST /api/v1/events/{id}/media", middleware.Chain(http.HandlerFunc(gh.UploadMedia), needAuth, csrf, editor, heavyRL))
				mux.Handle("GET /api/v1/events/{id}/media/{mid}/file", middleware.Chain(http.HandlerFunc(gh.ServeMedia), needAuth, member))
				// signed URL: no session; the HMAC token is the authorization
				mux.Handle("GET /api/v1/media/{mid}/file", authRL(http.HandlerFunc(gh.ServeSignedMedia)))
				mux.Handle("DELETE /api/v1/events/{id}/media/{mid}", middleware.Chain(http.HandlerFunc(gh.DeleteMedia), needAuth, csrf, editor))
			}
		}
	}

	return middleware.Chain(mux,
		middleware.SecurityHeaders(d.Secure),
		middleware.Recover(d.Log),
		middleware.AssignRequestID,
		middleware.Logger(d.Log),
		middleware.CORS(d.CORSOrigin),
	)
}

func health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func readyz(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if pool != nil {
			ctx, cancel := context.WithTimeout(r.Context(), 2e9) // 2s
			defer cancel()
			if err := pool.Ping(ctx); err != nil {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusServiceUnavailable)
				_ = json.NewEncoder(w).Encode(map[string]string{"status": "db_unavailable"})
				return
			}
		}
		writeJSON(w, http.StatusOK, map[string]string{"status": "ready"})
	}
}
