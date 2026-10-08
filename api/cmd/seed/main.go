// Command seed loads a demo account + celebration through the REAL application services
// (so every business rule, the argon2 hashing and token minting are exercised, not bypassed).
//
//	DATABASE_URL=... go run ./cmd/seed
//
// Idempotent: re-running reuses the demo user and skips data that already exists.
// Refuses to run unless APP_ENV=dev — demo credentials must never exist in production.
package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/mula/mula/internal/application/auth"
	eventapp "github.com/mula/mula/internal/application/event"
	giftapp "github.com/mula/mula/internal/application/gift"
	guestapp "github.com/mula/mula/internal/application/guest"
	invapp "github.com/mula/mula/internal/application/invitation"
	schedapp "github.com/mula/mula/internal/application/schedule"
	taskapp "github.com/mula/mula/internal/application/task"
	"github.com/mula/mula/internal/domain/event"
	"github.com/mula/mula/internal/domain/user"
	"github.com/mula/mula/internal/infrastructure/postgres"
	"github.com/mula/mula/internal/platform/config"
)

const (
	demoEmail    = "demo@mula.test"
	demoPassword = "demo-password-1" // dev only; printed below
)

// captureMailer remembers the verification token so the seed can verify the demo user
// through the real VerifyEmail path.
type captureMailer struct{ verify string }

func (m *captureMailer) SendVerification(_ context.Context, _, token string) error {
	m.verify = token
	return nil
}
func (m *captureMailer) SendPasswordReset(context.Context, string, string) error { return nil }

func main() {
	cfg := config.Load()
	// `seed e2e-user <email>`: one verified user (+ optional published event) as JSON, for
	// Playwright. Same dev-only guard as the demo seed; adds NO HTTP surface to the API.
	if len(os.Args) >= 2 && os.Args[1] == "e2e-user" {
		runE2EUser(cfg)
		return
	}
	if cfg.Env != "dev" {
		fail("refusing to seed: APP_ENV=%q (seed only runs with APP_ENV=dev)", cfg.Env)
	}
	dsn, err := cfg.RequireDatabaseURL()
	if err != nil {
		fail("%v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	pool, err := postgres.NewPool(ctx, dsn)
	if err != nil {
		fail("connect: %v", err)
	}
	defer pool.Close()

	mail := &captureMailer{}
	authSvc := auth.NewService(postgres.NewUserRepo(pool), postgres.NewTokenRepo(pool), postgres.NewSessionRepo(pool), mail)
	evSvc := eventapp.NewService(postgres.NewEventRepo(pool), postgres.NewMemberRepo(pool))
	invSvc := invapp.NewService(postgres.NewInvitationRepo(pool))
	guestSvc := guestapp.NewService(postgres.NewGuestRepo(pool))
	taskSvc := taskapp.NewService(postgres.NewTaskRepo(pool))

	// ---- demo user (register → verify through the real flow) ----
	u, err := authSvc.Register(ctx, demoEmail, demoPassword, "Demo Host")
	switch {
	case err == nil:
		if err := authSvc.VerifyEmail(ctx, mail.verify); err != nil {
			fail("verify demo user: %v", err)
		}
		fmt.Println("created demo user")
	case errors.Is(err, user.ErrEmailTaken):
		u, _, err = authSvc.Login(ctx, demoEmail, demoPassword, "seed", "127.0.0.1")
		if err != nil {
			fail("demo user exists but the demo password doesn't work (changed?): %v", err)
		}
		fmt.Println("demo user already exists")
	default:
		fail("register demo user: %v", err)
	}

	// ---- demo celebration (skip if the user already has one) ----
	events, err := evSvc.List(ctx, u.ID)
	if err != nil {
		fail("list events: %v", err)
	}
	if len(events) > 0 {
		enrich(ctx, events[0].ID, evSvc, guestSvc, taskSvc, schedapp.NewService(postgres.NewScheduleRepo(pool)), giftapp.NewService(postgres.NewGiftRepo(pool), nil, nil))
		fmt.Println("demo celebration already exists")
		printSummary(ctx, events[0].ID, guestSvc)
		return
	}

	date := time.Now().AddDate(0, 3, 0).UTC().Format("2006-01-02") + "T09:00:00Z"
	a, b, venue := "Raka", "Celine", "The Glasshouse, Jakarta"
	ev, err := evSvc.Create(ctx, u.ID, u.Email, eventapp.CreateInput{
		Type: "wedding", CoupleA: &a, CoupleB: &b, EventDate: &date, Venue: &venue,
	})
	if err != nil {
		fail("create event: %v", err)
	}

	// invitation: default sections + a palette + hero copy
	inv, err := invSvc.Get(ctx, ev.ID)
	if err != nil {
		fail("invitation: %v", err)
	}
	pal := "Stone"
	if _, err := invSvc.Update(ctx, ev.ID, invapp.UpdatePatch{Palette: &pal}); err != nil {
		fail("palette: %v", err)
	}
	for _, s := range inv.Sections {
		if s.Type == "hero" {
			if _, err := invSvc.UpdateSection(ctx, ev.ID, s.ID, invapp.SectionPatch{Content: map[string]any{"title": "The wedding of"}}); err != nil {
				fail("hero: %v", err)
			}
		}
	}

	// guests (one with plus-ones, one VIP)
	for _, g := range []guestapp.GuestInput{
		{Name: "Sarah Wijaya", PlusOnes: 2},
		{Name: "Budi Santoso", VIP: true},
		{Name: "Maya Anindita"},
	} {
		if _, err := guestSvc.Create(ctx, ev.ID, g); err != nil {
			fail("guest %s: %v", g.Name, err)
		}
	}

	// a couple of tasks so the overview has something to show
	for _, t := range []string{"Book the venue", "Choose the caterer"} {
		if _, err := taskSvc.Create(ctx, ev.ID, taskapp.Input{Title: t, Priority: "high"}); err != nil {
			fail("task: %v", err)
		}
	}

	// publish (verified user + required sections present → passes the real rules)
	if _, err := invSvc.Publish(ctx, ev.ID, true); err != nil {
		fail("publish: %v", err)
	}
	enrich(ctx, ev.ID, evSvc, guestSvc, taskSvc, schedapp.NewService(postgres.NewScheduleRepo(pool)), giftapp.NewService(postgres.NewGiftRepo(pool), nil, nil))
	fmt.Println("created demo celebration (published)")
	printSummary(ctx, ev.ID, guestSvc)
}

// enrich adds the data the dashboard's newer screens show: moments with details, guest notes/tables,
// task categories, registry quantities, gift methods and one pending team invite.
// Each block runs only while its table is empty for the event, so re-running never duplicates.
func enrich(ctx context.Context, eventID string, ev *eventapp.Service, guests *guestapp.Service, tasks *taskapp.Service, sched *schedapp.Service, gifts *giftapp.Service) {
	if items, err := sched.List(ctx, eventID); err == nil && len(items) == 0 {
		start := func(h int) *string {
			s := time.Now().AddDate(0, 3, 0).UTC().Format("2006-01-02") + fmt.Sprintf("T%02d:00:00Z", h)
			return &s
		}
		venue := "The Glasshouse, Jakarta"
		for _, in := range []schedapp.Input{
			{Title: "Ceremony", StartsAt: start(9), EndsAt: start(10), Venue: &venue, Address: "Jl. Jend. Sudirman 5", DressCode: "Black tie optional", Description: "Vows under the glass roof.", Visibility: "everyone"},
			{Title: "Reception dinner", StartsAt: start(11), EndsAt: start(15), Venue: &venue, DressCode: "Black tie optional", Description: "Dinner and toasts.", Visibility: "invite_only"},
		} {
			if _, err := sched.Create(ctx, eventID, in); err != nil {
				fail("moment %s: %v", in.Title, err)
			}
		}
	}
	if gs, err := guests.List(ctx, eventID); err == nil {
		for i, g := range gs {
			if g.Notes != "" || g.TableLabel != nil {
				continue
			}
			tbl, note := fmt.Sprintf("A%d", i+1), []string{"Vegetarian", "Seat near the front", ""}[i%3]
			if _, err := guests.Update(ctx, g.ID, guestapp.GuestPatch{TableLabel: &tbl, Notes: &note}); err != nil {
				fail("guest details %s: %v", g.Name, err)
			}
		}
	}
	if ts, err := tasks.List(ctx, eventID); err == nil {
		for i, t := range ts {
			if t.Category == "" {
				c := []string{"Event day", "Guests"}[i%2]
				if _, err := tasks.Update(ctx, t.ID, taskapp.Patch{Category: &c}); err != nil {
					fail("task category: %v", err)
				}
			}
		}
	}
	if gl, err := gifts.ListGifts(ctx, eventID); err == nil && len(gl) == 0 {
		if _, err := gifts.CreateGift(ctx, eventID, giftapp.GiftInput{Title: "Linen bedding set", Description: "Stone, king size", Quantity: 2}); err != nil {
			fail("registry item: %v", err)
		}
	}
	if ms, err := gifts.ListMethods(ctx, eventID); err == nil && len(ms) == 0 {
		for _, in := range []giftapp.MethodInput{
			{Type: "bank", Title: "BCA · Raka Pratama", Detail: "Account number", CopyValue: "8830 1122 45"},
			{Type: "wallet", Title: "GoPay", Detail: "Phone number", CopyValue: "0812 3456 7890"},
		} {
			if _, err := gifts.CreateMethod(ctx, eventID, in); err != nil {
				fail("gift method: %v", err)
			}
		}
	}
	// Pending team invite; a duplicate on re-run is expected and ignored.
	if _, err := ev.Invite(ctx, eventID, "cilla@mula.test", event.RoleCohost, "Raka & Celine"); err != nil && !errors.Is(err, event.ErrMemberExists) {
		fmt.Fprintf(os.Stderr, "seed: team invite skipped: %v\n", err)
	}
}

func printSummary(ctx context.Context, eventID string, guests *guestapp.Service) {
	fmt.Println()
	fmt.Println("  Demo login")
	fmt.Printf("    email:    %s\n    password: %s\n", demoEmail, demoPassword)
	gs, err := guests.List(ctx, eventID)
	if err != nil || len(gs) == 0 {
		return
	}
	fmt.Println("  Guest personal links (open on the web app origin):")
	for _, g := range gs {
		if g.Token != nil {
			fmt.Printf("    %-16s /invite/%s\n", g.Name, *g.Token)
		}
	}
}

func fail(format string, a ...any) {
	fmt.Fprintf(os.Stderr, "seed: "+format+"\n", a...)
	os.Exit(1)
}

// runE2EUser: seed e2e-user <email> [--with-event]
// Prints one JSON object. Idempotent per email (re-run → same user, fresh login not needed).
func runE2EUser(cfg config.Config) {
	if cfg.Env != "dev" {
		fail("refusing e2e-user: APP_ENV=%q (dev only)", cfg.Env)
	}
	if len(os.Args) < 3 || !strings.Contains(os.Args[2], "@") {
		fail("usage: seed e2e-user <email> [--with-event]")
	}
	email := os.Args[2]
	withEvent := len(os.Args) > 3 && os.Args[3] == "--with-event"
	const password = "e2e-password-1"

	dsn, err := cfg.RequireDatabaseURL()
	if err != nil {
		fail("%v", err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	pool, err := postgres.NewPool(ctx, dsn)
	if err != nil {
		fail("connect: %v", err)
	}
	defer pool.Close()

	mail := &captureMailer{}
	authSvc := auth.NewService(postgres.NewUserRepo(pool), postgres.NewTokenRepo(pool), postgres.NewSessionRepo(pool), mail)
	evSvc := eventapp.NewService(postgres.NewEventRepo(pool), postgres.NewMemberRepo(pool))
	invSvc := invapp.NewService(postgres.NewInvitationRepo(pool))
	guestSvc := guestapp.NewService(postgres.NewGuestRepo(pool))

	u, err := authSvc.Register(ctx, email, password, "E2E User")
	switch {
	case err == nil:
		if err := authSvc.VerifyEmail(ctx, mail.verify); err != nil {
			fail("verify: %v", err)
		}
	case errors.Is(err, user.ErrEmailTaken):
		if u, _, err = authSvc.Login(ctx, email, password, "e2e", "127.0.0.1"); err != nil {
			fail("user exists with a different password: %v", err)
		}
	default:
		fail("register: %v", err)
	}

	out := map[string]any{"email": email, "password": password}
	if withEvent {
		a, b := "Aldo", "Cilla"
		ev, err := evSvc.Create(ctx, u.ID, u.Email, eventapp.CreateInput{Type: "wedding", CoupleA: &a, CoupleB: &b})
		if err != nil {
			fail("event: %v", err)
		}
		g, err := guestSvc.Create(ctx, ev.ID, guestapp.GuestInput{Name: "E2E Guest", PlusOnes: 1})
		if err != nil {
			fail("guest: %v", err)
		}
		if _, err := invSvc.Publish(ctx, ev.ID, true); err != nil {
			fail("publish: %v", err)
		}
		g, err = guestSvc.Get(ctx, g.ID)
		if err != nil || g.Token == nil {
			fail("guest token: %v", err)
		}
		out["event_id"] = ev.ID
		out["guest_token"] = *g.Token
	}
	b, _ := json.Marshal(out)
	fmt.Println(string(b))
}
