package http

import (
	"bytes"
	"context"
	"encoding/json"
	"github.com/mula/mula/internal/catalog"
	"image"
	"image/jpeg"
	"image/png"
	"io"
	"log/slog"
	"math/rand"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"strconv"
	"strings"
	"testing"
	"time"

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
	"github.com/mula/mula/internal/infrastructure/payment"
	"github.com/mula/mula/internal/infrastructure/postgres"
	"github.com/mula/mula/internal/infrastructure/storage"
)

const testWebhookSecret = "test-secret"

var testPay = payment.NewDev(testWebhookSecret, "/pay/dev")

// testSigner is the media-URL signer shared by setup() and tests (to mint expired tokens).
var testSigner = storage.NewSigner("test-media-secret")

func discardLogger() *slog.Logger { return slog.New(slog.NewTextHandler(io.Discard, nil)) }

// captureMailer records the last token per recipient so the test can complete
// verify/reset flows (the real dev mailer only logs).
type captureMailer struct {
	verify, reset map[string]string
	invites       map[string]string // guest email → personal link
	team          map[string]string // invitee email → role
}

func newCapture() *captureMailer {
	return &captureMailer{verify: map[string]string{}, reset: map[string]string{}, invites: map[string]string{}, team: map[string]string{}}
}
func (m *captureMailer) SendInvitation(_ context.Context, to, _, _, link string) error {
	m.invites[to] = link
	return nil
}
func (m *captureMailer) SendTeamInvite(_ context.Context, to, _, role, _ string) error {
	m.team[to] = role
	return nil
}
func (m *captureMailer) SendVerification(_ context.Context, to, token string) error {
	m.verify[to] = token
	return nil
}
func (m *captureMailer) SendPasswordReset(_ context.Context, to, token string) error {
	m.reset[to] = token
	return nil
}

// Run with: TEST_DATABASE_URL=postgres://mula:mula@host:5432/scratch?sslmode=disable go test ./...
// The schema must be migrated (cmd/migrate up) against that DB first.
func setup(t *testing.T) (http.Handler, *captureMailer, *pgxpool.Pool) {
	return setupWith(t, nil)
}

// setupWith is setup with a hook to adjust Deps (e.g. real rate limits, a trusted-proxy list).
func setupWith(t *testing.T, tweak func(*Deps)) (http.Handler, *captureMailer, *pgxpool.Pool) {
	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("TEST_DATABASE_URL not set; skipping DB integration test")
	}
	pool, err := postgres.NewPool(context.Background(), dsn)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	t.Cleanup(pool.Close)
	// clean slate
	if _, err := pool.Exec(context.Background(), "TRUNCATE users CASCADE"); err != nil {
		t.Fatalf("truncate: %v", err)
	}
	mailer := newCapture()
	svc := auth.NewService(postgres.NewUserRepo(pool), postgres.NewTokenRepo(pool), postgres.NewSessionRepo(pool), mailer)
	evSvc := eventapp.NewService(postgres.NewEventRepo(pool), postgres.NewMemberRepo(pool)).WithMailer(mailer, "http://web.test")
	ovRepo := postgres.NewOverviewRepo(pool)
	ovSvc := overview.NewService(ovRepo).WithActivity(ovRepo)
	gSvc := guestapp.NewService(postgres.NewGuestRepo(pool)).WithMailer(mailer, "http://web.test")
	// the catalog drives section sets, required sections and content validation: load and sync it like `make migrate`
	cat, problems := catalog.Load("../../../../catalog")
	problems = append(problems, cat.Validate(catalog.Options{})...)
	if len(problems) > 0 {
		t.Fatalf("catalog: %v", problems)
	}
	if _, err := catalog.Sync(context.Background(), pool, cat); err != nil {
		t.Fatalf("catalog sync: %v", err)
	}
	iSvc := invapp.NewService(postgres.NewInvitationRepo(pool)).WithContentSchema(cat.ContentChecker()).WithThemeSchema(cat.ThemeChecker())
	sSvc := schapp.NewService(postgres.NewScheduleRepo(pool))
	tSvc := taskapp.NewService(postgres.NewTaskRepo(pool))
	oSvc := opsapp.NewService(postgres.NewOpsRepo(pool))
	store, err := storage.NewLocal(t.TempDir())
	if err != nil {
		t.Fatalf("storage: %v", err)
	}
	giftSvc := giftapp.NewService(postgres.NewGiftRepo(pool), store, testSigner)
	billSvc := billapp.NewService(postgres.NewBillingRepo(pool), testPay)
	d := Deps{Log: discardLogger(), CORSOrigin: "*", Auth: svc, Event: evSvc, Overview: ovSvc, Guest: gSvc, Invitation: iSvc, Schedule: sSvc, Task: tSvc, Ops: oSvc, Gift: giftSvc, Billing: billSvc, Settings: setapp.NewService(postgres.NewSettingsRepo(pool)), Public: pubapp.NewService(postgres.NewPublicInviteRepo(pool), testSigner), Pool: pool, Secure: false, AuthRatePerMin: 100000, AuthRateBurst: 100000}
	if tweak != nil {
		tweak(&d)
	}
	return NewRouter(d), mailer, pool
}

// csrfOf extracts the csrf_token cookie value from a Set-Cookie list.
func csrfOf(cookies []*http.Cookie) string {
	for _, c := range cookies {
		if c.Name == csrfCookie {
			return c.Value
		}
	}
	return ""
}

func do(t *testing.T, h http.Handler, method, path string, body any, cookies []*http.Cookie, csrf string) *httptest.ResponseRecorder {
	t.Helper()
	var buf bytes.Buffer
	if body != nil {
		_ = json.NewEncoder(&buf).Encode(body)
	}
	req := httptest.NewRequest(method, path, &buf)
	for _, c := range cookies {
		req.AddCookie(c)
	}
	if csrf != "" {
		req.Header.Set("X-CSRF-Token", csrf)
	}
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)
	return rr
}

func TestAuthFlow(t *testing.T) {
	h, mailer, _ := setup(t)
	const email, pw = "aldo@example.com", "supersecret1"

	// register → 201
	if rr := do(t, h, "POST", "/api/v1/auth/register", registerReq{Email: email, Password: pw, Name: "Aldo"}, nil, ""); rr.Code != 201 {
		t.Fatalf("register: want 201 got %d (%s)", rr.Code, rr.Body)
	}
	// duplicate → 409
	if rr := do(t, h, "POST", "/api/v1/auth/register", registerReq{Email: email, Password: pw, Name: "Aldo"}, nil, ""); rr.Code != 409 {
		t.Fatalf("dup register: want 409 got %d", rr.Code)
	}
	// wrong password → 401
	if rr := do(t, h, "POST", "/api/v1/auth/login", loginReq{Email: email, Password: "nope"}, nil, ""); rr.Code != 401 {
		t.Fatalf("bad login: want 401 got %d", rr.Code)
	}
	// verify email with captured token → 204
	if rr := do(t, h, "POST", "/api/v1/auth/verify", tokenReq{Token: mailer.verify[email]}, nil, ""); rr.Code != 204 {
		t.Fatalf("verify: want 204 got %d (%s)", rr.Code, rr.Body)
	}
	// login ok → 200 + cookies
	rr := do(t, h, "POST", "/api/v1/auth/login", loginReq{Email: email, Password: pw}, nil, "")
	if rr.Code != 200 {
		t.Fatalf("login: want 200 got %d (%s)", rr.Code, rr.Body)
	}
	cookies := rr.Result().Cookies()
	if len(cookies) < 2 {
		t.Fatalf("expected session + csrf cookies, got %d", len(cookies))
	}
	// /me with cookie → 200
	if rr := do(t, h, "GET", "/api/v1/me", nil, cookies, ""); rr.Code != 200 {
		t.Fatalf("me: want 200 got %d (%s)", rr.Code, rr.Body)
	}
	// /me without cookie → 401
	if rr := do(t, h, "GET", "/api/v1/me", nil, nil, ""); rr.Code != 401 {
		t.Fatalf("me no-cookie: want 401 got %d", rr.Code)
	}

	// forgot → reset (single-use)
	if rr := do(t, h, "POST", "/api/v1/auth/password/forgot", emailReq{Email: email}, nil, ""); rr.Code != 204 {
		t.Fatalf("forgot: want 204 got %d", rr.Code)
	}
	rtok := mailer.reset[email]
	if rtok == "" {
		t.Fatal("no reset token captured")
	}
	if rr := do(t, h, "POST", "/api/v1/auth/password/reset", resetReq{Token: rtok, Password: "brandnewpw9"}, nil, ""); rr.Code != 204 {
		t.Fatalf("reset: want 204 got %d (%s)", rr.Code, rr.Body)
	}
	// reuse same token → 400 (single-use)
	if rr := do(t, h, "POST", "/api/v1/auth/password/reset", resetReq{Token: rtok, Password: "anotherpw99"}, nil, ""); rr.Code != 400 {
		t.Fatalf("reset reuse: want 400 got %d", rr.Code)
	}
	// new password logs in
	if rr := do(t, h, "POST", "/api/v1/auth/login", loginReq{Email: email, Password: "brandnewpw9"}, nil, ""); rr.Code != 200 {
		t.Fatalf("login new pw: want 200 got %d", rr.Code)
	}
}

// verifyUser marks the user's email verified through the real /auth/verify endpoint,
// using the token the register flow stored.
func verifyUser(t *testing.T, h http.Handler, pool *pgxpool.Pool, email string) {
	t.Helper()
	var tok string
	err := pool.QueryRow(context.Background(),
		`SELECT vt.token FROM verification_tokens vt JOIN users u ON u.id=vt.user_id WHERE u.email=$1 ORDER BY vt.created_at DESC LIMIT 1`, email).Scan(&tok)
	if err != nil {
		t.Fatalf("verification token for %s: %v", email, err)
	}
	if r := do(t, h, "POST", "/api/v1/auth/verify", tokenReq{Token: tok}, nil, ""); r.Code != 204 {
		t.Fatalf("verify %s: %d (%s)", email, r.Code, r.Body)
	}
}

func registerLogin(t *testing.T, h http.Handler, email string) ([]*http.Cookie, string) {
	t.Helper()
	const pw = "supersecret1"
	do(t, h, "POST", "/api/v1/auth/register", registerReq{Email: email, Password: pw, Name: email}, nil, "")
	rr := do(t, h, "POST", "/api/v1/auth/login", loginReq{Email: email, Password: pw}, nil, "")
	if rr.Code != 200 {
		t.Fatalf("login %s: %d", email, rr.Code)
	}
	cookies := rr.Result().Cookies()
	return cookies, csrfOf(cookies)
}

func userID(t *testing.T, pool *pgxpool.Pool, email string) string {
	t.Helper()
	var id string
	if err := pool.QueryRow(context.Background(), "SELECT id FROM users WHERE email=$1", email).Scan(&id); err != nil {
		t.Fatalf("userID %s: %v", email, err)
	}
	return id
}

func addMember(t *testing.T, pool *pgxpool.Pool, eventID, uid, email, role string) {
	t.Helper()
	_, err := pool.Exec(context.Background(),
		"INSERT INTO event_members (event_id, user_id, email, role, accepted_at) VALUES ($1,$2,$3,$4,now())",
		eventID, uid, email, role)
	if err != nil {
		t.Fatalf("addMember: %v", err)
	}
}

func TestEventAuthz(t *testing.T) {
	h, _, pool := setup(t)

	ownerCk, ownerCsrf := registerLogin(t, h, "owner@example.com")
	strangerCk, _ := registerLogin(t, h, "stranger@example.com")

	// owner creates event → 201
	rr := do(t, h, "POST", "/api/v1/events", createEventReq{Type: "wedding", CoupleA: ptr("A"), CoupleB: ptr("B")}, ownerCk, ownerCsrf)
	if rr.Code != 201 {
		t.Fatalf("create: want 201 got %d (%s)", rr.Code, rr.Body)
	}
	var created eventDTO
	if err := json.Unmarshal(rr.Body.Bytes(), &created); err != nil {
		t.Fatal(err)
	}
	id := created.ID
	path := "/api/v1/events/" + id

	// stranger: non-member → 404 (never 403, no leak)
	if rr := do(t, h, "GET", path, nil, strangerCk, ""); rr.Code != 404 {
		t.Fatalf("stranger GET: want 404 got %d", rr.Code)
	}
	if rr := do(t, h, "PATCH", path, patchEventReq{Venue: ptr("X")}, strangerCk, csrfOf(strangerCk)); rr.Code != 404 {
		t.Fatalf("stranger PATCH: want 404 got %d", rr.Code)
	}
	// unknown id → 404
	if rr := do(t, h, "GET", "/api/v1/events/00000000-0000-0000-0000-000000000000", nil, ownerCk, ""); rr.Code != 404 {
		t.Fatalf("unknown GET: want 404 got %d", rr.Code)
	}

	// owner: full access
	if rr := do(t, h, "GET", path, nil, ownerCk, ""); rr.Code != 200 {
		t.Fatalf("owner GET: want 200 got %d", rr.Code)
	}
	if rr := do(t, h, "PATCH", path, patchEventReq{Venue: ptr("Ballroom")}, ownerCk, ownerCsrf); rr.Code != 200 {
		t.Fatalf("owner PATCH: want 200 got %d (%s)", rr.Code, rr.Body)
	}

	// family member: read-only
	familyCk, familyCsrf := registerLogin(t, h, "family@example.com")
	addMember(t, pool, id, userID(t, pool, "family@example.com"), "family@example.com", "family")
	if rr := do(t, h, "GET", path, nil, familyCk, ""); rr.Code != 200 {
		t.Fatalf("family GET: want 200 got %d", rr.Code)
	}
	if rr := do(t, h, "PATCH", path, patchEventReq{Venue: ptr("Y")}, familyCk, familyCsrf); rr.Code != 403 {
		t.Fatalf("family PATCH: want 403 got %d", rr.Code)
	}
	if rr := do(t, h, "DELETE", path, nil, familyCk, familyCsrf); rr.Code != 403 {
		t.Fatalf("family DELETE: want 403 got %d", rr.Code)
	}

	// cohost: editor but not owner
	cohostCk, cohostCsrf := registerLogin(t, h, "cohost@example.com")
	addMember(t, pool, id, userID(t, pool, "cohost@example.com"), "cohost@example.com", "cohost")
	if rr := do(t, h, "PATCH", path, patchEventReq{Venue: ptr("Garden")}, cohostCk, cohostCsrf); rr.Code != 200 {
		t.Fatalf("cohost PATCH: want 200 got %d", rr.Code)
	}
	if rr := do(t, h, "DELETE", path, nil, cohostCk, cohostCsrf); rr.Code != 403 {
		t.Fatalf("cohost DELETE: want 403 got %d", rr.Code)
	}

	// owner delete → 204, then gone → 404
	if rr := do(t, h, "DELETE", path, nil, ownerCk, ownerCsrf); rr.Code != 204 {
		t.Fatalf("owner DELETE: want 204 got %d", rr.Code)
	}
	if rr := do(t, h, "GET", path, nil, ownerCk, ""); rr.Code != 404 {
		t.Fatalf("deleted GET: want 404 got %d", rr.Code)
	}
}

func ptr(s string) *string { return &s }

func TestGuests(t *testing.T) {
	h, _, _ := setup(t)
	ck, csrf := registerLogin(t, h, "gst@example.com")
	rr := do(t, h, "POST", "/api/v1/events", createEventReq{Type: "wedding"}, ck, csrf)
	var ev eventDTO
	_ = json.Unmarshal(rr.Body.Bytes(), &ev)
	base := "/api/v1/events/" + ev.ID

	// create group
	if r := do(t, h, "POST", base+"/groups", groupReq{Name: "Family"}, ck, csrf); r.Code != 201 {
		t.Fatalf("group: %d (%s)", r.Code, r.Body)
	}

	// create guest
	r := do(t, h, "POST", base+"/guests", guestReq{Name: "Sarah", PlusOnes: 2, VIP: true}, ck, csrf)
	if r.Code != 201 {
		t.Fatalf("create guest: %d (%s)", r.Code, r.Body)
	}
	var g guestDTO
	_ = json.Unmarshal(r.Body.Bytes(), &g)

	// list → 1
	r = do(t, h, "GET", base+"/guests", nil, ck, "")
	var list struct {
		Data []guestDTO `json:"data"`
	}
	_ = json.Unmarshal(r.Body.Bytes(), &list)
	if len(list.Data) != 1 {
		t.Fatalf("list want 1, got %d", len(list.Data))
	}

	// patch: mark RSVP yes
	if r := do(t, h, "PATCH", base+"/guests/"+g.ID, guestPatchReq{RSVPStatus: ptr("yes"), PartySize: ptrInt(3)}, ck, csrf); r.Code != 200 {
		t.Fatalf("patch: %d (%s)", r.Code, r.Body)
	}

	// segments: vip=1, plus_ones=1, follow_up=0 (responded), not_opened=1
	r = do(t, h, "GET", base+"/guests/segments", nil, ck, "")
	var segMap map[string]int
	_ = json.Unmarshal(r.Body.Bytes(), &segMap)
	if segMap["vip"] != 1 || segMap["plus_ones"] != 1 || segMap["follow_up"] != 0 {
		t.Fatalf("segments unexpected: %v", segMap)
	}

	// import 2 more
	if r := do(t, h, "POST", base+"/guests/import", importReq{Guests: []guestReq{{Name: "Budi"}, {Name: "Maya"}}}, ck, csrf); r.Code != 200 {
		t.Fatalf("import: %d", r.Code)
	}

	// overview journey Sent reflects 3 guests, Replied 1
	r = do(t, h, "GET", base+"/overview", nil, ck, "")
	var ov struct {
		Journey []struct {
			Stage string `json:"stage"`
			Count int    `json:"count"`
		} `json:"journey"`
	}
	_ = json.Unmarshal(r.Body.Bytes(), &ov)
	byStage := map[string]int{}
	for _, j := range ov.Journey {
		byStage[j.Stage] = j.Count
	}
	if byStage["Sent"] != 3 || byStage["Replied"] != 1 {
		t.Fatalf("overview journey: Sent=%d Replied=%d (want 3/1)", byStage["Sent"], byStage["Replied"])
	}

	// delete first guest
	if r := do(t, h, "DELETE", base+"/guests/"+g.ID, nil, ck, csrf); r.Code != 204 {
		t.Fatalf("delete: %d", r.Code)
	}
}

func ptrInt(i int) *int { return &i }

func TestInvitation(t *testing.T) {
	h, _, pool := setup(t)
	ck, csrf := registerLogin(t, h, "dsn@example.com")
	verifyUser(t, h, pool, "dsn@example.com")
	rr := do(t, h, "POST", "/api/v1/events", createEventReq{Type: "wedding"}, ck, csrf)
	var ev eventDTO
	_ = json.Unmarshal(rr.Body.Bytes(), &ev)
	base := "/api/v1/events/" + ev.ID
	type inv struct {
		Palette   string `json:"palette"`
		Published bool   `json:"published"`
		Sections  []struct {
			ID      string         `json:"id"`
			Type    string         `json:"type"`
			Visible bool           `json:"visible"`
			Content map[string]any `json:"content"`
		} `json:"sections"`
	}
	parse := func(r *httptest.ResponseRecorder) inv {
		var i inv
		if err := json.Unmarshal(r.Body.Bytes(), &i); err != nil {
			t.Fatal(err)
		}
		return i
	}

	// GET auto-creates with 5 default sections
	i0 := parse(do(t, h, "GET", base+"/invitation", nil, ck, ""))
	if len(i0.Sections) != 5 {
		t.Fatalf("default sections want 5, got %d", len(i0.Sections))
	}

	// PATCH palette
	if r := do(t, h, "PATCH", base+"/invitation", invitationPatchReq{Palette: ptr("Stone")}, ck, csrf); parse(r).Palette != "Stone" {
		t.Fatal("palette not persisted")
	}

	// update a section: hide + sanitize content
	sid := i0.Sections[0].ID
	i1 := parse(do(t, h, "PATCH", base+"/invitation/sections/"+sid, sectionPatchReq{Visible: boolPtr(false), Content: map[string]any{"title": "<script>x</script>Hello"}}, ck, csrf))
	var hero struct {
		vis bool
		txt string
	}
	for _, s := range i1.Sections {
		if s.ID == sid {
			hero.vis = s.Visible
			hero.txt, _ = s.Content["title"].(string)
		}
	}
	if hero.vis {
		t.Fatal("section should be hidden")
	}
	if hero.txt != "scriptx/scriptHello" {
		t.Fatalf("content not sanitized: %q", hero.txt)
	}

	// reorder: reverse
	order := make([]string, len(i0.Sections))
	for j, s := range i0.Sections {
		order[len(i0.Sections)-1-j] = s.ID
	}
	i2 := parse(do(t, h, "POST", base+"/invitation/sections/reorder", reorderReq{Order: order}, ck, csrf))
	if i2.Sections[0].ID != order[0] {
		t.Fatal("reorder not applied")
	}

	// hero was hidden above (required section) → publishing is refused until it is shown again
	if r := do(t, h, "POST", base+"/invitation/publish", nil, ck, csrf); r.Code != 422 {
		t.Fatalf("publish with hidden hero: want 422 got %d", r.Code)
	}
	do(t, h, "PATCH", base+"/invitation/sections/"+sid, sectionPatchReq{Visible: boolPtr(true)}, ck, csrf)

	// publish → token + url, event status published
	rp := do(t, h, "POST", base+"/invitation/publish", nil, ck, csrf)
	if rp.Code != 200 {
		t.Fatalf("publish: %d", rp.Code)
	}
	var pub struct{ Token, URL string }
	_ = json.Unmarshal(rp.Body.Bytes(), &pub)
	if pub.Token == "" || pub.URL != "/invite/"+pub.Token {
		t.Fatalf("publish payload: %+v", pub)
	}
	if ie := parse(do(t, h, "GET", base+"/invitation", nil, ck, "")); !ie.Published {
		t.Fatal("invitation should be published")
	}
	var evp eventDTO
	_ = json.Unmarshal(do(t, h, "GET", base, nil, ck, "").Body.Bytes(), &evp)
	if evp.Status != "published" {
		t.Fatalf("event status want published, got %q", evp.Status)
	}

	// unpublish → draft
	if r := do(t, h, "POST", base+"/invitation/unpublish", nil, ck, csrf); r.Code != 204 {
		t.Fatalf("unpublish: %d", r.Code)
	}
	if parse(do(t, h, "GET", base+"/invitation", nil, ck, "")).Published {
		t.Fatal("should be unpublished")
	}
}

func boolPtr(b bool) *bool { return &b }

// upload posts a multipart "file" field with the given bytes + filename.
func upload(t *testing.T, h http.Handler, path, filename string, data []byte, cookies []*http.Cookie, csrf string) *httptest.ResponseRecorder {
	t.Helper()
	var buf bytes.Buffer
	mw := multipart.NewWriter(&buf)
	fw, _ := mw.CreateFormFile("file", filename)
	_, _ = fw.Write(data)
	_ = mw.Close()
	req := httptest.NewRequest("POST", path, &buf)
	req.Header.Set("Content-Type", mw.FormDataContentType())
	for _, c := range cookies {
		req.AddCookie(c)
	}
	req.Header.Set("X-CSRF-Token", csrf)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)
	return rr
}

// tinyPNG is a real, decodable PNG (generated once).
var tinyPNG = func() []byte {
	var b bytes.Buffer
	_ = png.Encode(&b, image.NewRGBA(image.Rect(0, 0, 4, 4)))
	return b.Bytes()
}()

// encodePNG returns a w×h PNG of pseudo-random noise (incompressible → large file).
func encodePNG(t *testing.T, w, h int) []byte {
	t.Helper()
	img := image.NewRGBA(image.Rect(0, 0, w, h))
	rand.New(rand.NewSource(1)).Read(img.Pix)
	var b bytes.Buffer
	if err := png.Encode(&b, img); err != nil {
		t.Fatal(err)
	}
	return b.Bytes()
}

// jpegWithEXIF is a valid JPEG with an APP1/Exif segment (carrying marker) after SOI —
// what a phone photo looks like.
func jpegWithEXIF(t *testing.T, marker string) []byte {
	t.Helper()
	var plain bytes.Buffer
	if err := jpeg.Encode(&plain, image.NewRGBA(image.Rect(0, 0, 8, 8)), nil); err != nil {
		t.Fatal(err)
	}
	payload := append([]byte("Exif\x00\x00"), []byte(marker)...)
	seg := []byte{0xFF, 0xE1, byte((len(payload) + 2) >> 8), byte((len(payload) + 2) & 0xFF)}
	seg = append(seg, payload...)
	b := plain.Bytes()
	out := append([]byte{}, b[:2]...)
	out = append(out, seg...)
	return append(out, b[2:]...)
}

// webhook posts a signed (or deliberately tampered) payload to the webhook endpoint.
func webhook(t *testing.T, h http.Handler, body, sig, ts string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest("POST", "/api/v1/billing/webhook", strings.NewReader(body))
	req.Header.Set("X-Signature", sig)
	req.Header.Set("X-Timestamp", ts)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)
	return rr
}

func TestPublish(t *testing.T) {
	h, _, pool := setup(t)
	ck, csrf := registerLogin(t, h, "pub@example.com")
	rr := do(t, h, "POST", "/api/v1/events", createEventReq{Type: "wedding", CoupleA: ptr("Raka"), CoupleB: ptr("Celine"), Venue: ptr("Glasshouse")}, ck, csrf)
	var ev eventDTO
	_ = json.Unmarshal(rr.Body.Bytes(), &ev)
	base := "/api/v1/events/" + ev.ID

	// 1) unverified email → 422 email_not_verified, nothing published
	r := do(t, h, "POST", base+"/invitation/publish", nil, ck, csrf)
	if r.Code != 422 || !strings.Contains(r.Body.String(), "email_not_verified") {
		t.Fatalf("unverified publish: want 422 email_not_verified, got %d %s", r.Code, r.Body)
	}
	verifyUser(t, h, pool, "pub@example.com")

	// 2) hide the required rsvp section → 422 invitation_incomplete naming it
	var inv invitationDTO
	_ = json.Unmarshal(do(t, h, "GET", base+"/invitation", nil, ck, "").Body.Bytes(), &inv)
	secID := map[string]string{}
	for _, s := range inv.Sections {
		secID[s.Type] = s.ID
	}
	do(t, h, "PATCH", base+"/invitation/sections/"+secID["rsvp"], sectionPatchReq{Visible: boolPtr(false)}, ck, csrf)
	r = do(t, h, "POST", base+"/invitation/publish", nil, ck, csrf)
	if r.Code != 422 || !strings.Contains(r.Body.String(), "invitation_incomplete") || !strings.Contains(r.Body.String(), `"rsvp"`) {
		t.Fatalf("hidden required section: want 422 naming rsvp, got %d %s", r.Code, r.Body)
	}
	// ... and the whole thing is still private
	if r := do(t, h, "GET", "/api/v1/invite/anything", nil, nil, ""); r.Code != 404 {
		t.Fatalf("nothing published yet: want 404 got %d", r.Code)
	}

	// 3) restore + give the hero + a host-only-looking section some content; publish OK
	do(t, h, "PATCH", base+"/invitation/sections/"+secID["rsvp"], sectionPatchReq{Visible: boolPtr(true)}, ck, csrf)
	do(t, h, "PATCH", base+"/invitation/sections/"+secID["hero"], sectionPatchReq{Content: map[string]any{"title": "Raka & Celine"}}, ck, csrf)
	do(t, h, "PATCH", base+"/invitation/sections/"+secID["gift"], sectionPatchReq{Visible: boolPtr(false), Content: map[string]any{"title": "SECRET-HIDDEN-SECTION"}}, ck, csrf)
	r = do(t, h, "POST", base+"/invitation/publish", nil, ck, csrf)
	if r.Code != 200 {
		t.Fatalf("publish: %d %s", r.Code, r.Body)
	}
	var pub struct{ Token, URL string }
	_ = json.Unmarshal(r.Body.Bytes(), &pub)
	if len(pub.Token) < 20 {
		t.Fatalf("token too short to be unguessable: %q", pub.Token)
	}

	// 4) republish keeps the SAME link
	var pub2 struct{ Token string }
	_ = json.Unmarshal(do(t, h, "POST", base+"/invitation/publish", nil, ck, csrf).Body.Bytes(), &pub2)
	if pub2.Token != pub.Token {
		t.Fatalf("republish must keep the link: %q vs %q", pub2.Token, pub.Token)
	}

	// 5) public read: no session, guest-safe
	pr := do(t, h, "GET", "/api/v1/invite/"+pub.Token, nil, nil, "")
	if pr.Code != 200 {
		t.Fatalf("public read: %d %s", pr.Code, pr.Body)
	}
	body := pr.Body.String()
	var tagged struct {
		CoupleA  *string `json:"couple_a"`
		CoupleB  *string `json:"couple_b"`
		Venue    *string `json:"venue"`
		Sections []struct {
			Type    string         `json:"type"`
			Content map[string]any `json:"content"`
		} `json:"sections"`
	}
	if err := json.Unmarshal(pr.Body.Bytes(), &tagged); err != nil {
		t.Fatal(err)
	}
	if tagged.CoupleA == nil || *tagged.CoupleA != "Raka" || tagged.CoupleB == nil || *tagged.CoupleB != "Celine" || tagged.Venue == nil || *tagged.Venue != "Glasshouse" {
		t.Fatalf("public event fields wrong: %s", body)
	}
	heroTitle := ""
	for _, s := range tagged.Sections {
		if s.Type == "hero" {
			heroTitle, _ = s.Content["title"].(string)
		}
	}
	if heroTitle != "Raka & Celine" {
		t.Fatalf("hero title: want %q got %q", "Raka & Celine", heroTitle)
	}
	// leak checks: hidden section content, owner/email/ids must not be present
	for _, leak := range []string{"SECRET-HIDDEN-SECTION", "pub@example.com", ev.OwnerID, ev.ID, "owner_id", "email", "public_token"} {
		if strings.Contains(body, leak) {
			t.Fatalf("public DTO leaked %q: %s", leak, body)
		}
	}
	// hidden section absent from the type list too
	var pv struct{ Sections []struct{ Type string } }
	_ = json.Unmarshal(pr.Body.Bytes(), &pv)
	for _, s := range pv.Sections {
		if s.Type == "gift" {
			t.Fatal("hidden gift section was served to guests")
		}
	}
	if cc := pr.Header().Get("Cache-Control"); !strings.Contains(cc, "no-store") {
		t.Fatalf("public page must not be shared-cached (personal links reveal guest data), got %q", cc)
	}

	// 6) wrong token → 404 (same as unknown)
	if r := do(t, h, "GET", "/api/v1/invite/"+pub.Token+"x", nil, nil, ""); r.Code != 404 {
		t.Fatalf("wrong token: want 404 got %d", r.Code)
	}

	// 7) unpublish revokes immediately; old link dead; and a republish mints a NEW token
	if r := do(t, h, "POST", base+"/invitation/unpublish", nil, ck, csrf); r.Code != 204 {
		t.Fatalf("unpublish: %d", r.Code)
	}
	if r := do(t, h, "GET", "/api/v1/invite/"+pub.Token, nil, nil, ""); r.Code != 404 {
		t.Fatalf("revoked token: want 404 got %d", r.Code)
	}
	var pub3 struct{ Token string }
	_ = json.Unmarshal(do(t, h, "POST", base+"/invitation/publish", nil, ck, csrf).Body.Bytes(), &pub3)
	if pub3.Token == "" || pub3.Token == pub.Token {
		t.Fatalf("republish after revoke must mint a fresh token (old link must stay dead): %q", pub3.Token)
	}
	if r := do(t, h, "GET", "/api/v1/invite/"+pub.Token, nil, nil, ""); r.Code != 404 {
		t.Fatalf("old link must stay dead after republish: got %d", r.Code)
	}
	if r := do(t, h, "GET", "/api/v1/invite/"+pub3.Token, nil, nil, ""); r.Code != 200 {
		t.Fatalf("new link must work: %d", r.Code)
	}

	// 8) deleting the event kills the public link too
	if r := do(t, h, "DELETE", base, nil, ck, csrf); r.Code != 204 {
		t.Fatalf("delete event: %d", r.Code)
	}
	if r := do(t, h, "GET", "/api/v1/invite/"+pub3.Token, nil, nil, ""); r.Code != 404 {
		t.Fatalf("deleted event link: want 404 got %d", r.Code)
	}

	// 9) a non-editor cannot publish
	ck2, csrf2 := registerLogin(t, h, "pubowner@example.com")
	verifyUser(t, h, pool, "pubowner@example.com")
	rr = do(t, h, "POST", "/api/v1/events", createEventReq{Type: "wedding"}, ck2, csrf2)
	var ev2 eventDTO
	_ = json.Unmarshal(rr.Body.Bytes(), &ev2)
	famCk, famCsrf := registerLogin(t, h, "pubfam@example.com")
	verifyUser(t, h, pool, "pubfam@example.com")
	addMember(t, pool, ev2.ID, userID(t, pool, "pubfam@example.com"), "pubfam@example.com", "family")
	if r := do(t, h, "POST", "/api/v1/events/"+ev2.ID+"/invitation/publish", nil, famCk, famCsrf); r.Code != 403 {
		t.Fatalf("family publish: want 403 got %d", r.Code)
	}
}

// TestAuthRateLimitDefaults proves the production limiter is still on: with the default
// config (burst 10) the 11th rapid login from one IP is rejected with 429 + Retry-After.
func TestAuthRateLimitDefaults(t *testing.T) {
	_, _, pool := setup(t) // truncates + validates DB; we build our own router below
	svc := auth.NewService(postgres.NewUserRepo(pool), postgres.NewTokenRepo(pool), postgres.NewSessionRepo(pool), newCapture())
	h := NewRouter(Deps{Log: discardLogger(), CORSOrigin: "*", Auth: svc, Pool: pool}) // no overrides → defaults
	var last *httptest.ResponseRecorder
	limited := -1
	for i := 0; i < 15; i++ {
		last = do(t, h, "POST", "/api/v1/auth/login", loginReq{Email: "nobody@example.com", Password: "wrong-wrong"}, nil, "")
		if last.Code == 429 {
			limited = i
			break
		}
	}
	if limited < 0 {
		t.Fatal("default limiter never returned 429 in 15 attempts")
	}
	if limited < 10 {
		t.Fatalf("limiter tripped too early at attempt %d (burst is 10)", limited)
	}
	if last.Header().Get("Retry-After") == "" {
		t.Fatal("429 must carry Retry-After")
	}
}

func TestPublicInvite(t *testing.T) {
	h, _, pool := setup(t)
	ck, csrf := registerLogin(t, h, "pubinv@example.com")
	verifyUser(t, h, pool, "pubinv@example.com")
	rr := do(t, h, "POST", "/api/v1/events", createEventReq{Type: "wedding", CoupleA: ptr("Raka"), CoupleB: ptr("Celine"), EventDate: ptr("2099-04-12T09:00:00Z")}, ck, csrf)
	var ev eventDTO
	_ = json.Unmarshal(rr.Body.Bytes(), &ev)
	base := "/api/v1/events/" + ev.ID

	// two guests; Sarah may bring 2 plus-ones
	mk := func(name string, plus int) guestDTO {
		r := do(t, h, "POST", base+"/guests", guestReq{Name: name, PlusOnes: plus}, ck, csrf)
		var g guestDTO
		_ = json.Unmarshal(r.Body.Bytes(), &g)
		return g
	}
	sarah, budi := mk("Sarah", 2), mk("Budi", 0)
	if sarah.InvitePath == nil || !strings.HasPrefix(*sarah.InvitePath, "/invite/") || len(*sarah.InvitePath) < 28 {
		t.Fatalf("host must receive an unguessable personal link, got %v", sarah.InvitePath)
	}
	tok := func(g guestDTO) string { return strings.TrimPrefix(*g.InvitePath, "/invite/") }

	// BEFORE publish: neither link works (guests can't see an unpublished invitation)
	if r := do(t, h, "GET", "/api/v1/invite/"+tok(sarah), nil, nil, ""); r.Code != 404 {
		t.Fatalf("personal link before publish: want 404 got %d", r.Code)
	}
	r := do(t, h, "POST", base+"/invitation/publish", nil, ck, csrf)
	var pub struct{ Token string }
	_ = json.Unmarshal(r.Body.Bytes(), &pub)
	if pub.Token == "" {
		t.Fatalf("publish failed: %d %s", r.Code, r.Body)
	}

	// GENERIC link: page works, NO guest block, does not record an open, cannot RSVP
	var page struct {
		Guest *struct {
			Name       string `json:"name"`
			RSVPStatus string `json:"rsvp_status"`
			MaxParty   int    `json:"max_party"`
		} `json:"guest"`
	}
	gr := do(t, h, "GET", "/api/v1/invite/"+pub.Token, nil, nil, "")
	if gr.Code != 200 {
		t.Fatalf("generic link: %d", gr.Code)
	}
	_ = json.Unmarshal(gr.Body.Bytes(), &page)
	if page.Guest != nil {
		t.Fatal("generic link must not carry guest data")
	}
	rsvpBody := rsvpReq{Status: "yes", PartySize: 1}
	if r := do(t, h, "POST", "/api/v1/invite/"+pub.Token+"/rsvp", rsvpBody, nil, ""); r.Code != 403 || !strings.Contains(r.Body.String(), "personal_link_required") {
		t.Fatalf("generic link RSVP: want 403 personal_link_required, got %d %s", r.Code, r.Body)
	}

	// host journey BEFORE any guest opens: Opened=0, Replied=0
	journey := func() map[string]int {
		var o struct {
			Journey []struct {
				Stage string `json:"stage"`
				Count int    `json:"count"`
			} `json:"journey"`
		}
		_ = json.Unmarshal(do(t, h, "GET", base+"/overview", nil, ck, "").Body.Bytes(), &o)
		m := map[string]int{}
		for _, j := range o.Journey {
			m[j.Stage] = j.Count
		}
		return m
	}
	if j := journey(); j["Sent"] != 2 || j["Opened"] != 0 || j["Replied"] != 0 {
		t.Fatalf("journey before opens: %v", j)
	}

	// PERSONAL link: greets Sarah by name, exposes ONLY her own info, records the open
	pr := do(t, h, "GET", "/api/v1/invite/"+tok(sarah), nil, nil, "")
	if pr.Code != 200 {
		t.Fatalf("personal link: %d", pr.Code)
	}
	_ = json.Unmarshal(pr.Body.Bytes(), &page)
	if page.Guest == nil || page.Guest.Name != "Sarah" || page.Guest.RSVPStatus != "pending" || page.Guest.MaxParty != 3 {
		t.Fatalf("personal guest block wrong: %+v", page.Guest)
	}
	if strings.Contains(pr.Body.String(), "Budi") || strings.Contains(pr.Body.String(), "pubinv@example.com") || strings.Contains(pr.Body.String(), tok(budi)) {
		t.Fatal("personal page leaked another guest / host email / another token")
	}
	if cc := pr.Header().Get("Cache-Control"); !strings.Contains(cc, "no-store") {
		t.Fatalf("personal page must be no-store, got %q", cc)
	}
	if j := journey(); j["Opened"] != 1 {
		t.Fatalf("open not tracked for host: %v", j)
	}
	// opened_at is set once: second view does not move it
	var first, second string
	_ = pool.QueryRow(context.Background(), `SELECT opened_at::text FROM guests WHERE id=$1`, sarah.ID).Scan(&first)
	do(t, h, "GET", "/api/v1/invite/"+tok(sarah), nil, nil, "")
	_ = pool.QueryRow(context.Background(), `SELECT opened_at::text FROM guests WHERE id=$1`, sarah.ID).Scan(&second)
	if first == "" || first != second {
		t.Fatalf("opened_at must be set once on first view: %q vs %q", first, second)
	}

	// RSVP validation
	for name, body := range map[string]rsvpReq{
		"bad status":    {Status: "maybe", PartySize: 1},
		"yes, party 0":  {Status: "yes", PartySize: 0},
		"yes, negative": {Status: "yes", PartySize: -2},
	} {
		if r := do(t, h, "POST", "/api/v1/invite/"+tok(sarah)+"/rsvp", body, nil, ""); r.Code != 400 {
			t.Fatalf("%s: want 400 got %d", name, r.Code)
		}
	}
	// RSVP yes for 9 → server caps at 1+plus_ones = 3 (client can't claim a bigger party)
	if r := do(t, h, "POST", "/api/v1/invite/"+tok(sarah)+"/rsvp", rsvpReq{Status: "yes", PartySize: 9, Note: ptr("<b>vegan</b>")}, nil, ""); r.Code != 204 {
		t.Fatalf("rsvp: want 204 got %d (%s)", r.Code, r.Body)
	}
	var status string
	var party int
	var note *string
	_ = pool.QueryRow(context.Background(), `SELECT status, party_size, note FROM rsvps WHERE guest_id=$1`, sarah.ID).Scan(&status, &party, &note)
	if status != "yes" || party != 3 {
		t.Fatalf("rsvp stored wrong: %s/%d (want yes/3 — capped)", status, party)
	}
	if note == nil || strings.ContainsAny(*note, "<>") {
		t.Fatalf("note must be sanitised: %v", note)
	}
	// host journey updates: Replied = 1
	if j := journey(); j["Replied"] != 1 {
		t.Fatalf("RSVP must update host journey: %v", j)
	}
	// RSVP is editable: switch to "no" → party forced to 0
	do(t, h, "POST", "/api/v1/invite/"+tok(sarah)+"/rsvp", rsvpReq{Status: "no", PartySize: 5}, nil, "")
	_ = pool.QueryRow(context.Background(), `SELECT status, party_size FROM rsvps WHERE guest_id=$1`, sarah.ID).Scan(&status, &party)
	if status != "no" || party != 0 {
		t.Fatalf("decline stored wrong: %s/%d", status, party)
	}

	// WISH: personal link ignores a client-supplied name (can't impersonate); text sanitised + bounded
	if r := do(t, h, "POST", "/api/v1/invite/"+tok(sarah)+"/wish", wishReq{Name: "THE POPE", Message: "<script>x</script>Congrats!"}, nil, ""); r.Code != 201 {
		t.Fatalf("wish: %d (%s)", r.Code, r.Body)
	}
	var author, msg string
	_ = pool.QueryRow(context.Background(), `SELECT author_name, message FROM wishes WHERE event_id=$1 ORDER BY created_at DESC LIMIT 1`, ev.ID).Scan(&author, &msg)
	if author != "Sarah" || strings.ContainsAny(msg, "<>") {
		t.Fatalf("wish attribution/sanitising wrong: author=%q msg=%q", author, msg)
	}
	// generic link wish needs a name; too-long and empty are rejected
	if r := do(t, h, "POST", "/api/v1/invite/"+pub.Token+"/wish", wishReq{Message: "hi"}, nil, ""); r.Code != 400 {
		t.Fatalf("anonymous wish without a name: want 400 got %d", r.Code)
	}
	if r := do(t, h, "POST", "/api/v1/invite/"+pub.Token+"/wish", wishReq{Name: "Walk-in", Message: "Best wishes"}, nil, ""); r.Code != 201 {
		t.Fatalf("generic wish with name: want 201 got %d", r.Code)
	}
	if r := do(t, h, "POST", "/api/v1/invite/"+tok(budi)+"/wish", wishReq{Message: strings.Repeat("x", 501)}, nil, ""); r.Code != 400 {
		t.Fatalf("501-char wish: want 400 got %d", r.Code)
	}
	if r := do(t, h, "POST", "/api/v1/invite/"+tok(budi)+"/wish", wishReq{Message: "   "}, nil, ""); r.Code != 400 {
		t.Fatalf("blank wish: want 400 got %d", r.Code)
	}
	// host sees the wishes (existing GET /wishes)
	if w := do(t, h, "GET", base+"/wishes", nil, ck, "").Body.String(); !strings.Contains(w, "Walk-in") || !strings.Contains(w, "Sarah") {
		t.Fatalf("host wishes list: %s", w)
	}

	// token isolation: a foreign / mangled token is just 404 on every endpoint
	for _, path := range []string{"", "/rsvp", "/wish"} {
		method := "GET"
		var body any
		if path != "" {
			method, body = "POST", rsvpReq{Status: "yes", PartySize: 1}
		}
		if r := do(t, h, method, "/api/v1/invite/"+tok(budi)+"zz"+path, body, nil, ""); r.Code != 404 {
			t.Fatalf("foreign token %q: want 404 got %d", path, r.Code)
		}
	}

	// RSVP cutoff: an event that ended long ago is closed (422), but the page still renders
	rr = do(t, h, "POST", "/api/v1/events", createEventReq{Type: "wedding", EventDate: ptr("2001-01-01T09:00:00Z")}, ck, csrf)
	var old eventDTO
	_ = json.Unmarshal(rr.Body.Bytes(), &old)
	oldBase := "/api/v1/events/" + old.ID
	og := func() guestDTO {
		var g guestDTO
		_ = json.Unmarshal(do(t, h, "POST", oldBase+"/guests", guestReq{Name: "Late"}, ck, csrf).Body.Bytes(), &g)
		return g
	}()
	do(t, h, "POST", oldBase+"/invitation/publish", nil, ck, csrf)
	if r := do(t, h, "GET", og.InvitePathURL(), nil, nil, ""); r.Code != 200 {
		t.Fatalf("closed event page should still render, got %d", r.Code)
	}
	if r := do(t, h, "POST", og.InvitePathURL()+"/rsvp", rsvpReq{Status: "yes", PartySize: 1}, nil, ""); r.Code != 422 || !strings.Contains(r.Body.String(), "rsvp_closed") {
		t.Fatalf("rsvp after cutoff: want 422 rsvp_closed, got %d %s", r.Code, r.Body)
	}

	// UNPUBLISH revokes the generic link AND every personal link
	if r := do(t, h, "POST", base+"/invitation/unpublish", nil, ck, csrf); r.Code != 204 {
		t.Fatalf("unpublish: %d", r.Code)
	}
	for name, u := range map[string]string{"generic": pub.Token, "sarah": tok(sarah), "budi": tok(budi)} {
		if r := do(t, h, "GET", "/api/v1/invite/"+u, nil, nil, ""); r.Code != 404 {
			t.Fatalf("%s link after unpublish: want 404 got %d", name, r.Code)
		}
	}
	if r := do(t, h, "POST", "/api/v1/invite/"+tok(sarah)+"/rsvp", rsvpReq{Status: "yes", PartySize: 1}, nil, ""); r.Code != 404 {
		t.Fatalf("rsvp after unpublish: want 404 got %d", r.Code)
	}
}

// InvitePathURL returns the full API path for this guest's personal link (test helper).
func (g guestDTO) InvitePathURL() string {
	return "/api/v1/invite/" + strings.TrimPrefix(*g.InvitePath, "/invite/")
}

// Import is a single batched statement: prove the array round-trip preserves every field,
// skips blanks, and gives every guest a distinct personal token that actually opens its page.
func TestGuestImportBatch(t *testing.T) {
	h, _, pool := setup(t)
	ck, csrf := registerLogin(t, h, "imp@example.com")
	verifyUser(t, h, pool, "imp@example.com")
	rr := do(t, h, "POST", "/api/v1/events", createEventReq{Type: "wedding"}, ck, csrf)
	var ev eventDTO
	_ = json.Unmarshal(rr.Body.Bytes(), &ev)
	base := "/api/v1/events/" + ev.ID

	var grp struct {
		ID string `json:"id"`
	}
	_ = json.Unmarshal(do(t, h, "POST", base+"/groups", groupReq{Name: "Family"}, ck, csrf).Body.Bytes(), &grp)

	in := []guestReq{
		{Name: "Alice", Email: ptr("alice@example.com"), Phone: ptr("+62 811"), GroupID: &grp.ID, PlusOnes: 2, VIP: true},
		{Name: "   "}, // blank → skipped
		{Name: "Bob"}, // all optionals nil
		{Name: "Carol", PlusOnes: 1},
	}
	r := do(t, h, "POST", base+"/guests/import", importReq{Guests: in}, ck, csrf)
	if r.Code != 200 || !strings.Contains(r.Body.String(), `"inserted":3`) {
		t.Fatalf("import: %d %s", r.Code, r.Body)
	}
	// empty import is a clean no-op
	if r := do(t, h, "POST", base+"/guests/import", importReq{Guests: nil}, ck, csrf); r.Code != 200 || !strings.Contains(r.Body.String(), `"inserted":0`) {
		t.Fatalf("empty import: %d %s", r.Code, r.Body)
	}

	var list struct {
		Data []guestDTO `json:"data"`
	}
	_ = json.Unmarshal(do(t, h, "GET", base+"/guests", nil, ck, "").Body.Bytes(), &list)
	by := map[string]guestDTO{}
	for _, g := range list.Data {
		by[g.Name] = g
	}
	if len(list.Data) != 3 {
		t.Fatalf("want 3 guests, got %d", len(list.Data))
	}
	a := by["Alice"]
	if a.PlusOnes != 2 || !a.VIP || a.GroupName == nil || *a.GroupName != "Family" || a.Email == nil || *a.Email != "alice@example.com" || a.Phone == nil || *a.Phone != "+62 811" {
		t.Fatalf("Alice fields lost in the batch: %+v", a)
	}
	if b := by["Bob"]; b.PlusOnes != 0 || b.VIP || b.GroupID != nil || b.Email != nil {
		t.Fatalf("Bob should have empty optionals: %+v", b)
	}
	if by["Carol"].PlusOnes != 1 {
		t.Fatalf("Carol plus-ones: %+v", by["Carol"])
	}

	// tokens: present, distinct, unguessable length, and each really resolves to ITS guest
	seen := map[string]bool{}
	do(t, h, "POST", base+"/invitation/publish", nil, ck, csrf)
	for _, g := range list.Data {
		if g.InvitePath == nil {
			t.Fatalf("%s has no invite link", g.Name)
		}
		tok := strings.TrimPrefix(*g.InvitePath, "/invite/")
		if len(tok) != 22 || seen[tok] {
			t.Fatalf("%s token %q: want unique 22 chars", g.Name, tok)
		}
		seen[tok] = true
		page := do(t, h, "GET", "/api/v1/invite/"+tok, nil, nil, "")
		if page.Code != 200 || !strings.Contains(page.Body.String(), `"name":"`+g.Name+`"`) {
			t.Fatalf("%s's personal link doesn't open their page: %d %s", g.Name, page.Code, page.Body)
		}
	}
}

// Legacy guests (no token) are given one, in a single statement, the first time the host lists.
func TestGuestTokenBackfill(t *testing.T) {
	h, _, pool := setup(t)
	ck, csrf := registerLogin(t, h, "bf@example.com")
	rr := do(t, h, "POST", "/api/v1/events", createEventReq{Type: "wedding"}, ck, csrf)
	var ev eventDTO
	_ = json.Unmarshal(rr.Body.Bytes(), &ev)
	base := "/api/v1/events/" + ev.ID
	for _, n := range []string{"A", "B", "C"} {
		do(t, h, "POST", base+"/guests", guestReq{Name: n}, ck, csrf)
	}
	if _, err := pool.Exec(context.Background(), `UPDATE guests SET token=NULL WHERE event_id=$1`, ev.ID); err != nil {
		t.Fatal(err)
	}
	// another event's token-less guest must NOT be touched by this event's list
	rr2 := do(t, h, "POST", "/api/v1/events", createEventReq{Type: "wedding"}, ck, csrf)
	var ev2 eventDTO
	_ = json.Unmarshal(rr2.Body.Bytes(), &ev2)
	do(t, h, "POST", "/api/v1/events/"+ev2.ID+"/guests", guestReq{Name: "Other"}, ck, csrf)
	_, _ = pool.Exec(context.Background(), `UPDATE guests SET token=NULL WHERE event_id=$1`, ev2.ID)

	var list struct {
		Data []guestDTO `json:"data"`
	}
	_ = json.Unmarshal(do(t, h, "GET", base+"/guests", nil, ck, "").Body.Bytes(), &list)
	seen := map[string]bool{}
	for _, g := range list.Data {
		if g.InvitePath == nil || seen[*g.InvitePath] {
			t.Fatalf("backfill failed/duplicated for %s: %v", g.Name, g.InvitePath)
		}
		seen[*g.InvitePath] = true
	}
	var left int
	_ = pool.QueryRow(context.Background(), `SELECT count(*) FROM guests WHERE event_id=$1 AND token IS NULL`, ev2.ID).Scan(&left)
	if left != 1 {
		t.Fatalf("listing event 1 must not touch event 2's guests (token-less left: %d, want 1)", left)
	}
}

func TestSettings(t *testing.T) {
	h, _, _ := setup(t)
	ck, csrf := registerLogin(t, h, "set@example.com")
	other, otherCsrf := registerLogin(t, h, "set-other@example.com")

	type prefs struct {
		Locale        string          `json:"locale"`
		Theme         string          `json:"theme"`
		Notifications map[string]bool `json:"notifications"`
	}
	get := func(cookies []*http.Cookie) prefs {
		var p prefs
		_ = json.Unmarshal(do(t, h, "GET", "/api/v1/me/preferences", nil, cookies, "").Body.Bytes(), &p)
		return p
	}

	// defaults before any write
	if p := get(ck); p.Locale != "en" || p.Theme != "system" {
		t.Fatalf("defaults: %+v", p)
	}

	// invalid values rejected, nothing changes
	if r := do(t, h, "PATCH", "/api/v1/me/preferences", prefsPatchReq{Locale: ptr("fr")}, ck, csrf); r.Code != 400 {
		t.Fatalf("bad locale: want 400 got %d", r.Code)
	}
	if r := do(t, h, "PATCH", "/api/v1/me/preferences", prefsPatchReq{Theme: ptr("neon")}, ck, csrf); r.Code != 400 {
		t.Fatalf("bad theme: want 400 got %d", r.Code)
	}
	// CSRF required
	if r := do(t, h, "PATCH", "/api/v1/me/preferences", prefsPatchReq{Theme: ptr("dark")}, ck, ""); r.Code != 403 {
		t.Fatalf("no csrf: want 403 got %d", r.Code)
	}

	// partial patches compose: locale, then theme, then notification keys merge
	do(t, h, "PATCH", "/api/v1/me/preferences", prefsPatchReq{Locale: ptr("id")}, ck, csrf)
	do(t, h, "PATCH", "/api/v1/me/preferences", prefsPatchReq{Theme: ptr("dark")}, ck, csrf)
	do(t, h, "PATCH", "/api/v1/me/preferences", prefsPatchReq{Notifications: map[string]bool{"rsvp": true}}, ck, csrf)
	do(t, h, "PATCH", "/api/v1/me/preferences", prefsPatchReq{Notifications: map[string]bool{"digest": false}}, ck, csrf)
	p := get(ck)
	if p.Locale != "id" || p.Theme != "dark" || !p.Notifications["rsvp"] || p.Notifications["digest"] {
		t.Fatalf("persisted prefs wrong: %+v", p)
	}
	if _, ok := p.Notifications["digest"]; !ok {
		t.Fatalf("notification key digest=false must be stored (merge, not overwrite): %+v", p.Notifications)
	}
	// another user is unaffected
	if po := get(other); po.Locale != "en" || po.Theme != "system" || len(po.Notifications) != 0 {
		t.Fatalf("prefs leaked across users: %+v", po)
	}

	// profile persists (existing /me)
	if r := do(t, h, "PATCH", "/api/v1/me", updateMeReq{Name: "Renamed"}, ck, csrf); r.Code != 200 {
		t.Fatalf("profile patch: %d", r.Code)
	}
	if !strings.Contains(do(t, h, "GET", "/api/v1/me", nil, ck, "").Body.String(), `"name":"Renamed"`) {
		t.Fatal("profile name not persisted")
	}

	// security: change password (existing endpoint) — wrong current → 401, right → 204
	if r := do(t, h, "POST", "/api/v1/me/password", changePasswordReq{Current: "wrong-wrong", New: "brandnewpw9"}, ck, csrf); r.Code != 401 {
		t.Fatalf("wrong current pw: want 401 got %d", r.Code)
	}
	if r := do(t, h, "POST", "/api/v1/me/password", changePasswordReq{Current: "supersecret1", New: "brandnewpw9"}, ck, csrf); r.Code != 204 {
		t.Fatalf("change pw: want 204 got %d", r.Code)
	}
	if r := do(t, h, "POST", "/api/v1/auth/login", loginReq{Email: "set@example.com", Password: "brandnewpw9"}, nil, ""); r.Code != 200 {
		t.Fatalf("login with new pw: %d", r.Code)
	}

	// referral: code is generated once, stable, unique per user
	code := func(cookies []*http.Cookie) string {
		var rf struct {
			Code string `json:"code"`
		}
		_ = json.Unmarshal(do(t, h, "GET", "/api/v1/me/referral", nil, cookies, "").Body.Bytes(), &rf)
		return rf.Code
	}
	c1, c2 := code(ck), code(ck)
	if len(c1) != 8 || c1 != c2 {
		t.Fatalf("referral code not stable/8 chars: %q vs %q", c1, c2)
	}
	if co := code(other); co == "" || co == c1 {
		t.Fatalf("referral codes must differ per user: %q vs %q", co, c1)
	}
	if r := do(t, h, "GET", "/api/v1/me/referral", nil, nil, ""); r.Code != 401 {
		t.Fatalf("anonymous referral: want 401 got %d", r.Code)
	}
	_ = otherCsrf
}

func TestBilling(t *testing.T) {
	h, _, _ := setup(t)

	// catalog is public (no cookie) and seeded
	r := do(t, h, "GET", "/api/v1/packages", nil, nil, "")
	if r.Code != 200 || !strings.Contains(r.Body.String(), `"slug":"signature"`) {
		t.Fatalf("packages: %d %s", r.Code, r.Body)
	}
	if r := do(t, h, "GET", "/api/v1/addons", nil, nil, ""); r.Code != 200 {
		t.Fatalf("addons: %d", r.Code)
	}

	// checkout requires a session
	if r := do(t, h, "POST", "/api/v1/billing/checkout", checkoutReq{Package: "signature"}, nil, ""); r.Code != 401 && r.Code != 403 {
		t.Fatalf("anonymous checkout: want 401/403 got %d", r.Code)
	}
	ck, csrf := registerLogin(t, h, "bill@example.com")
	if r := do(t, h, "POST", "/api/v1/billing/checkout", checkoutReq{Package: "nope"}, ck, csrf); r.Code != 404 {
		t.Fatalf("unknown package: want 404 got %d", r.Code)
	}
	cr := do(t, h, "POST", "/api/v1/billing/checkout", checkoutReq{Package: "signature"}, ck, csrf)
	if cr.Code != 201 {
		t.Fatalf("checkout: %d (%s)", cr.Code, cr.Body)
	}
	var co struct{ Ref, URL string }
	_ = json.Unmarshal(cr.Body.Bytes(), &co)
	if !strings.HasPrefix(co.Ref, "dev_") || co.URL == "" {
		t.Fatalf("checkout payload: %+v", co)
	}

	// pending until the webhook arrives; invoice listed as pending at the catalog price
	var sub struct {
		Subscription *struct{ Package, Status string } `json:"subscription"`
	}
	_ = json.Unmarshal(do(t, h, "GET", "/api/v1/billing/subscription", nil, ck, "").Body.Bytes(), &sub)
	if sub.Subscription == nil || sub.Subscription.Status != "pending" || sub.Subscription.Package != "signature" {
		t.Fatalf("pending subscription: %+v", sub.Subscription)
	}
	if inv := do(t, h, "GET", "/api/v1/billing/invoices", nil, ck, "").Body.String(); !strings.Contains(inv, `"status":"pending"`) || !strings.Contains(inv, `"amount":349000`) {
		t.Fatalf("pending invoice: %s", inv)
	}

	body := `{"ref":"` + co.Ref + `","status":"paid"}`
	ts := strconv.FormatInt(time.Now().Unix(), 10)
	good := testPay.Sign([]byte(body), ts)

	// forged signature → 401, nothing changes
	if r := webhook(t, h, body, "deadbeef", ts); r.Code != 401 {
		t.Fatalf("forged sig: want 401 got %d", r.Code)
	}
	// valid signature but tampered body → 401
	if r := webhook(t, h, strings.Replace(body, "paid", "failed", 1), good, ts); r.Code != 401 {
		t.Fatalf("tampered body: want 401 got %d", r.Code)
	}
	// stale timestamp (replay window) → 401
	old := strconv.FormatInt(time.Now().Add(-time.Hour).Unix(), 10)
	if r := webhook(t, h, body, testPay.Sign([]byte(body), old), old); r.Code != 401 {
		t.Fatalf("stale ts: want 401 got %d", r.Code)
	}
	// still pending after all the rejects
	_ = json.Unmarshal(do(t, h, "GET", "/api/v1/billing/subscription", nil, ck, "").Body.Bytes(), &sub)
	if sub.Subscription.Status != "pending" {
		t.Fatalf("rejected webhooks must not settle; status=%s", sub.Subscription.Status)
	}

	// valid → active + invoice paid
	if r := webhook(t, h, body, good, ts); r.Code != 204 {
		t.Fatalf("valid webhook: want 204 got %d (%s)", r.Code, r.Body)
	}
	_ = json.Unmarshal(do(t, h, "GET", "/api/v1/billing/subscription", nil, ck, "").Body.Bytes(), &sub)
	if sub.Subscription.Status != "active" {
		t.Fatalf("after paid webhook: status=%s", sub.Subscription.Status)
	}
	if inv := do(t, h, "GET", "/api/v1/billing/invoices", nil, ck, "").Body.String(); !strings.Contains(inv, `"status":"paid"`) {
		t.Fatalf("paid invoice: %s", inv)
	}

	// replay of the same valid webhook is a harmless no-op (204, stays active); a later
	// "failed" for the same ref must NOT downgrade an already-settled subscription
	if r := webhook(t, h, body, good, ts); r.Code != 204 {
		t.Fatalf("replay: want 204 got %d", r.Code)
	}
	failBody := `{"ref":"` + co.Ref + `","status":"failed"}`
	if r := webhook(t, h, failBody, testPay.Sign([]byte(failBody), ts), ts); r.Code != 204 {
		t.Fatalf("late failed: want 204 got %d", r.Code)
	}
	_ = json.Unmarshal(do(t, h, "GET", "/api/v1/billing/subscription", nil, ck, "").Body.Bytes(), &sub)
	if sub.Subscription.Status != "active" {
		t.Fatalf("settled subscription must stay active, got %s", sub.Subscription.Status)
	}

	// another user can't see this user's billing
	otherCk, _ := registerLogin(t, h, "other-bill@example.com")
	if o := do(t, h, "GET", "/api/v1/billing/invoices", nil, otherCk, "").Body.String(); strings.Contains(o, co.Ref) || strings.Contains(o, `"paid"`) {
		t.Fatalf("invoice leak across users: %s", o)
	}
}

func TestGiftsAndMemories(t *testing.T) {
	h, _, pool := setup(t)
	ck, csrf := registerLogin(t, h, "gift@example.com")
	rr := do(t, h, "POST", "/api/v1/events", createEventReq{Type: "wedding"}, ck, csrf)
	var ev eventDTO
	_ = json.Unmarshal(rr.Body.Bytes(), &ev)
	base := "/api/v1/events/" + ev.ID

	// --- registry CRUD ---
	if r := do(t, h, "POST", base+"/gifts", giftReq{Title: " "}, ck, csrf); r.Code != 400 {
		t.Fatalf("empty title: want 400 got %d", r.Code)
	}
	if r := do(t, h, "POST", base+"/gifts", giftReq{Title: "Honeymoon", URL: ptr("javascript:alert(1)")}, ck, csrf); r.Code != 400 {
		t.Fatalf("javascript: url must be rejected, got %d", r.Code)
	}
	r := do(t, h, "POST", base+"/gifts", giftReq{Title: "Honeymoon", URL: ptr("https://pay.example/h")}, ck, csrf)
	if r.Code != 201 {
		t.Fatalf("create gift: %d (%s)", r.Code, r.Body)
	}
	var g giftDTO
	_ = json.Unmarshal(r.Body.Bytes(), &g)
	if r := do(t, h, "PATCH", base+"/gifts/"+g.ID, giftPatchReq{Title: ptr("Honeymoon fund")}, ck, csrf); r.Code != 200 {
		t.Fatalf("patch gift: %d", r.Code)
	}
	if !strings.Contains(do(t, h, "GET", base+"/gifts", nil, ck, "").Body.String(), "Honeymoon fund") {
		t.Fatal("gift list missing patched title")
	}

	// --- transactions + wishes (seeded: they come from webhooks / the public invite) ---
	if _, err := pool.Exec(context.Background(),
		`INSERT INTO transactions (event_id, provider_ref, amount, currency, from_name, status) VALUES ($1,'ref1',150000,'IDR','Sarah','paid')`, ev.ID); err != nil {
		t.Fatal(err)
	}
	if tx := do(t, h, "GET", base+"/transactions", nil, ck, "").Body.String(); !strings.Contains(tx, `"from_name":"Sarah"`) || !strings.Contains(tx, `"amount":150000`) {
		t.Fatalf("transactions: %s", tx)
	}
	var wid string
	if err := pool.QueryRow(context.Background(),
		`INSERT INTO wishes (event_id, author_name, message) VALUES ($1,'Budi','Congrats!') RETURNING id`, ev.ID).Scan(&wid); err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(do(t, h, "GET", base+"/wishes", nil, ck, "").Body.String(), "Congrats!") {
		t.Fatal("wishes list missing seeded wish")
	}
	if r := do(t, h, "PATCH", base+"/wishes/"+wid, wishApproveReq{Approved: false}, ck, csrf); r.Code != 204 {
		t.Fatalf("moderate wish: %d", r.Code)
	}

	// --- media upload validation + EXIF strip + signed URLs (MED) ---
	if r := upload(t, h, base+"/media", "evil.png", []byte("<script>alert(1)</script>"), ck, csrf); r.Code != 415 {
		t.Fatalf("non-image bytes: want 415 got %d (%s)", r.Code, r.Body)
	}
	if r := upload(t, h, base+"/media", "anim.gif", append([]byte("GIF89a"), make([]byte, 64)...), ck, csrf); r.Code != 415 {
		t.Fatalf("gif not allowlisted: want 415 got %d", r.Code)
	}
	// header sniffs as PNG but is truncated → must be rejected, not stored
	if r := upload(t, h, base+"/media", "trunc.png", tinyPNG[:24], ck, csrf); r.Code != 415 {
		t.Fatalf("truncated png: want 415 got %d", r.Code)
	}
	// WebP is no longer accepted (cannot be re-encoded to strip metadata)
	if r := upload(t, h, base+"/media", "x.webp", append([]byte("RIFF\x00\x00\x00\x00WEBPVP8 "), make([]byte, 40)...), ck, csrf); r.Code != 415 {
		t.Fatalf("webp: want 415 got %d", r.Code)
	}
	bigImg := encodePNG(t, 2200, 2200) // random-ish noise → incompressible, > 5 MiB
	if len(bigImg) > 5<<20 {
		if r := upload(t, h, base+"/media", "big.png", bigImg, ck, csrf); r.Code != 413 && r.Code != 400 {
			t.Fatalf("oversize: want 413/400 got %d", r.Code)
		}
	}

	// a phone-style JPEG with GPS in EXIF
	const gps = "GPS:-6.2088,106.8456"
	up := upload(t, h, base+"/media", "photo.txt", jpegWithEXIF(t, gps), ck, csrf)
	if up.Code != 201 {
		t.Fatalf("valid jpeg upload: %d (%s)", up.Code, up.Body)
	}
	var m mediaDTO
	_ = json.Unmarshal(up.Body.Bytes(), &m)
	if m.ContentType != "image/jpeg" {
		t.Fatalf("content type from bytes: got %q", m.ContentType)
	}
	if !strings.HasPrefix(m.URL, "/api/v1/media/"+m.ID+"/file?sig=") {
		t.Fatalf("expected a signed url, got %q", m.URL)
	}

	// signed URL serves with NO session; bytes are metadata-free but still a valid JPEG
	srv := do(t, h, "GET", m.URL, nil, nil, "")
	if srv.Code != 200 || srv.Header().Get("Content-Type") != "image/jpeg" || srv.Header().Get("X-Content-Type-Options") != "nosniff" {
		t.Fatalf("signed serve: %d ct=%q nosniff=%q", srv.Code, srv.Header().Get("Content-Type"), srv.Header().Get("X-Content-Type-Options"))
	}
	if bytes.Contains(srv.Body.Bytes(), []byte(gps)) || bytes.Contains(srv.Body.Bytes(), []byte("Exif")) {
		t.Fatal("served image still contains EXIF/GPS")
	}
	if _, err := jpeg.Decode(bytes.NewReader(srv.Body.Bytes())); err != nil {
		t.Fatalf("served image must decode: %v", err)
	}

	// signed URL negatives: missing/garbage sig and a token minted for a different media id → 404
	idPath := "/api/v1/media/" + m.ID + "/file"
	for name, u := range map[string]string{
		"no sig":      idPath,
		"garbage sig": idPath + "?sig=abc",
		"wrong id":    "/api/v1/media/00000000-0000-0000-0000-000000000000/file?sig=" + strings.SplitN(m.URL, "sig=", 2)[1],
	} {
		if r := do(t, h, "GET", u, nil, nil, ""); r.Code != 404 {
			t.Fatalf("%s: want 404 got %d", name, r.Code)
		}
	}
	// expired token (signed with the same key, past expiry) → 404
	expired := testSigner.Sign(m.ID, -time.Minute)
	if r := do(t, h, "GET", idPath+"?sig="+expired, nil, nil, ""); r.Code != 404 {
		t.Fatalf("expired sig: want 404 got %d", r.Code)
	}

	// session route still enforces authz: anonymous 401, stranger 404, owner 200
	sessURL := "/api/v1/events/" + ev.ID + "/media/" + m.ID + "/file"
	if r := do(t, h, "GET", sessURL, nil, nil, ""); r.Code != 401 {
		t.Fatalf("anonymous session route: want 401 got %d", r.Code)
	}
	strangerCk, _ := registerLogin(t, h, "mediastranger@example.com")
	if r := do(t, h, "GET", sessURL, nil, strangerCk, ""); r.Code != 404 {
		t.Fatalf("stranger session route: want 404 got %d", r.Code)
	}
	if r := do(t, h, "GET", sessURL, nil, ck, ""); r.Code != 200 {
		t.Fatalf("owner session route: want 200 got %d", r.Code)
	}

	// delete → both routes 404
	if r := do(t, h, "DELETE", base+"/media/"+m.ID, nil, ck, csrf); r.Code != 204 {
		t.Fatalf("delete media: %d", r.Code)
	}
	if r := do(t, h, "GET", m.URL, nil, nil, ""); r.Code != 404 {
		t.Fatalf("deleted media via signed url: want 404 got %d", r.Code)
	}
	if r := do(t, h, "DELETE", base+"/gifts/"+g.ID, nil, ck, csrf); r.Code != 204 {
		t.Fatalf("delete gift: %d", r.Code)
	}
}

func TestOps(t *testing.T) {
	h, _, pool := setup(t)
	ownerCk, ownerCsrf := registerLogin(t, h, "ops@example.com")
	rr := do(t, h, "POST", "/api/v1/events", createEventReq{Type: "wedding"}, ownerCk, ownerCsrf)
	var ev eventDTO
	_ = json.Unmarshal(rr.Body.Bytes(), &ev)
	base := "/api/v1/events/" + ev.ID

	// two guests; one RSVP yes
	mk := func(name string) guestDTO {
		r := do(t, h, "POST", base+"/guests", guestReq{Name: name}, ownerCk, ownerCsrf)
		var g guestDTO
		_ = json.Unmarshal(r.Body.Bytes(), &g)
		return g
	}
	g1, g2 := mk("Sarah"), mk("Budi")
	do(t, h, "PATCH", base+"/guests/"+g1.ID, guestPatchReq{RSVPStatus: ptr("yes"), PartySize: ptrInt(2)}, ownerCk, ownerCsrf)

	// usher + family members
	usherCk, usherCsrf := registerLogin(t, h, "usher@example.com")
	addMember(t, pool, ev.ID, userID(t, pool, "usher@example.com"), "usher@example.com", "usher")
	familyCk, familyCsrf := registerLogin(t, h, "fam@example.com")
	addMember(t, pool, ev.ID, userID(t, pool, "fam@example.com"), "fam@example.com", "family")

	// usher can check in; repeat is idempotent
	for i := 0; i < 2; i++ {
		if r := do(t, h, "POST", base+"/checkin", checkinReq{GuestID: g1.ID}, usherCk, usherCsrf); r.Code != 204 {
			t.Fatalf("usher checkin #%d: %d (%s)", i, r.Code, r.Body)
		}
	}
	// family (non-staff) cannot
	if r := do(t, h, "POST", base+"/checkin", checkinReq{GuestID: g2.ID}, familyCk, familyCsrf); r.Code != 403 {
		t.Fatalf("family checkin: want 403 got %d", r.Code)
	}
	// unknown guest → 404
	if r := do(t, h, "POST", base+"/checkin", checkinReq{GuestID: "00000000-0000-0000-0000-000000000000"}, usherCk, usherCsrf); r.Code != 404 {
		t.Fatalf("unknown guest: want 404 got %d", r.Code)
	}

	// arrivals: exactly 1 (idempotent)
	var arr struct {
		Data []arrivalDTO `json:"data"`
	}
	_ = json.Unmarshal(do(t, h, "GET", base+"/checkin", nil, usherCk, "").Body.Bytes(), &arr)
	if len(arr.Data) != 1 || arr.Data[0].GuestName != "Sarah" {
		t.Fatalf("arrivals: %+v", arr.Data)
	}

	// eventday: expected 2, checked_in 1, attending 1, remaining 1 — readable by family (member)
	var ed struct {
		Expected, CheckedIn, Attending, Remaining int
	}
	r := do(t, h, "GET", base+"/eventday", nil, familyCk, "")
	if r.Code != 200 {
		t.Fatalf("eventday: %d", r.Code)
	}
	var raw map[string]any
	_ = json.Unmarshal(r.Body.Bytes(), &raw)
	ed.Expected, ed.CheckedIn, ed.Attending, ed.Remaining = int(raw["expected"].(float64)), int(raw["checked_in"].(float64)), int(raw["attending"].(float64)), int(raw["remaining"].(float64))
	if ed.Expected != 2 || ed.CheckedIn != 1 || ed.Attending != 1 || ed.Remaining != 1 {
		t.Fatalf("eventday stats: %+v", ed)
	}

	// live: usher (non-editor) → 403; owner patches; bad status → 400
	if r := do(t, h, "PATCH", base+"/live", livePatchReq{Status: ptr("live")}, usherCk, usherCsrf); r.Code != 403 {
		t.Fatalf("usher live: want 403 got %d", r.Code)
	}
	if r := do(t, h, "PATCH", base+"/live", livePatchReq{Status: ptr("broadcasting")}, ownerCk, ownerCsrf); r.Code != 400 {
		t.Fatalf("bad status: want 400 got %d", r.Code)
	}
	r = do(t, h, "PATCH", base+"/live", livePatchReq{Provider: ptr("youtube"), StreamURL: ptr("https://x.test/s"), Status: ptr("live")}, ownerCk, ownerCsrf)
	if r.Code != 200 || !strings.Contains(r.Body.String(), `"status":"live"`) {
		t.Fatalf("live patch: %d %s", r.Code, r.Body)
	}
	if g := do(t, h, "GET", base+"/live", nil, ownerCk, ""); !strings.Contains(g.Body.String(), `"provider":"youtube"`) {
		t.Fatalf("live get: %s", g.Body)
	}
}

func TestTasks(t *testing.T) {
	h, _, _ := setup(t)
	ck, csrf := registerLogin(t, h, "tsk@example.com")
	rr := do(t, h, "POST", "/api/v1/events", createEventReq{Type: "wedding"}, ck, csrf)
	var ev eventDTO
	_ = json.Unmarshal(rr.Body.Bytes(), &ev)
	base := "/api/v1/events/" + ev.ID

	// validation: empty title + bad priority → 400
	if r := do(t, h, "POST", base+"/tasks", taskReq{Title: " "}, ck, csrf); r.Code != 400 {
		t.Fatalf("empty title: want 400 got %d", r.Code)
	}
	if r := do(t, h, "POST", base+"/tasks", taskReq{Title: "x", Priority: "urgent"}, ck, csrf); r.Code != 400 {
		t.Fatalf("bad priority: want 400 got %d", r.Code)
	}

	mk := func(title string) taskDTO {
		r := do(t, h, "POST", base+"/tasks", taskReq{Title: title, Priority: "high"}, ck, csrf)
		if r.Code != 201 {
			t.Fatalf("create: %d (%s)", r.Code, r.Body)
		}
		var d taskDTO
		_ = json.Unmarshal(r.Body.Bytes(), &d)
		return d
	}
	a, b := mk("Book venue"), mk("Send invites")

	counts := func() (total, done, open int) {
		r := do(t, h, "GET", base+"/tasks", nil, ck, "")
		var l struct {
			Counts struct{ Total, Done, Open int } `json:"counts"`
		}
		_ = json.Unmarshal(r.Body.Bytes(), &l)
		return l.Counts.Total, l.Counts.Done, l.Counts.Open
	}
	if tt, d, o := counts(); tt != 2 || d != 0 || o != 2 {
		t.Fatalf("counts want 2/0/2 got %d/%d/%d", tt, d, o)
	}

	// overview shows the open-tasks note
	hasTasksNote := func() bool {
		r := do(t, h, "GET", base+"/overview", nil, ck, "")
		var o struct {
			Notes []struct {
				ID string `json:"id"`
			} `json:"notes"`
		}
		_ = json.Unmarshal(r.Body.Bytes(), &o)
		for _, n := range o.Notes {
			if n.ID == "tasks" {
				return true
			}
		}
		return false
	}
	if !hasTasksNote() {
		t.Fatal("overview should show tasks note while tasks are open")
	}

	// toggle both done → counts + note gone
	for _, id := range []string{a.ID, b.ID} {
		if r := do(t, h, "PATCH", base+"/tasks/"+id, taskPatchReq{Done: boolPtr(true)}, ck, csrf); r.Code != 200 {
			t.Fatalf("toggle: %d", r.Code)
		}
	}
	if tt, d, o := counts(); tt != 2 || d != 2 || o != 0 {
		t.Fatalf("after toggle want 2/2/0 got %d/%d/%d", tt, d, o)
	}
	if hasTasksNote() {
		t.Fatal("tasks note should clear when all done")
	}

	// delete
	if r := do(t, h, "DELETE", base+"/tasks/"+a.ID, nil, ck, csrf); r.Code != 204 {
		t.Fatalf("delete: %d", r.Code)
	}
}

func TestSchedule(t *testing.T) {
	h, _, _ := setup(t)
	ck, csrf := registerLogin(t, h, "sch@example.com")
	rr := do(t, h, "POST", "/api/v1/events", createEventReq{Type: "wedding"}, ck, csrf)
	var ev eventDTO
	_ = json.Unmarshal(rr.Body.Bytes(), &ev)
	base := "/api/v1/events/" + ev.ID

	mk := func(title, at string) scheduleDTO {
		r := do(t, h, "POST", base+"/schedule", scheduleReq{Title: title, StartsAt: ptr(at), Venue: ptr("Hall; A, B")}, ck, csrf)
		if r.Code != 201 {
			t.Fatalf("create %s: %d (%s)", title, r.Code, r.Body)
		}
		var d scheduleDTO
		_ = json.Unmarshal(r.Body.Bytes(), &d)
		return d
	}
	a := mk("Ceremony", "2027-04-12T09:00:00Z")
	b := mk("Reception", "2027-04-12T12:00:00Z")

	// invalid time → 400
	if r := do(t, h, "POST", base+"/schedule", scheduleReq{Title: "x", StartsAt: ptr("nope")}, ck, csrf); r.Code != 400 {
		t.Fatalf("bad time: want 400 got %d", r.Code)
	}

	// reorder → [b, a]
	r := do(t, h, "POST", base+"/schedule/reorder", reorderReq{Order: []string{b.ID, a.ID}}, ck, csrf)
	var list struct {
		Data []scheduleDTO `json:"data"`
	}
	_ = json.Unmarshal(r.Body.Bytes(), &list)
	if len(list.Data) != 2 || list.Data[0].ID != b.ID {
		t.Fatalf("reorder not applied: %+v", list.Data)
	}

	// patch title
	if r := do(t, h, "PATCH", base+"/schedule/"+a.ID, schedulePatchReq{Title: ptr("Holy Matrimony")}, ck, csrf); r.Code != 200 {
		t.Fatalf("patch: %d", r.Code)
	}

	// .ics download: content-type + escaped venue + events
	ics := do(t, h, "GET", base+"/schedule.ics", nil, ck, "")
	if ics.Code != 200 || ics.Header().Get("Content-Type") != "text/calendar; charset=utf-8" {
		t.Fatalf("ics: %d %q", ics.Code, ics.Header().Get("Content-Type"))
	}
	body := ics.Body.String()
	for _, want := range []string{"BEGIN:VCALENDAR", "SUMMARY:Holy Matrimony", `LOCATION:Hall\; A\, B`, "DTSTART:20270412T090000Z", "END:VCALENDAR"} {
		if !strings.Contains(body, want) {
			t.Fatalf("ics missing %q in:\n%s", want, body)
		}
	}

	// delete
	if r := do(t, h, "DELETE", base+"/schedule/"+b.ID, nil, ck, csrf); r.Code != 204 {
		t.Fatalf("delete: %d", r.Code)
	}
}

func TestOverview(t *testing.T) {
	h, _, _ := setup(t)
	ck, csrf := registerLogin(t, h, "ovr@example.com")

	rr := do(t, h, "POST", "/api/v1/events", createEventReq{Type: "wedding"}, ck, csrf)
	if rr.Code != 201 {
		t.Fatalf("create: %d", rr.Code)
	}
	var ev eventDTO
	_ = json.Unmarshal(rr.Body.Bytes(), &ev)
	base := "/api/v1/events/" + ev.ID

	type ovr struct {
		Readiness struct {
			Score int `json:"score"`
			Parts []struct {
				Key  string `json:"key"`
				Done bool   `json:"done"`
			} `json:"parts"`
		} `json:"readiness"`
		Notes []struct {
			ID string `json:"id"`
		} `json:"notes"`
	}
	get := func() ovr {
		r := do(t, h, "GET", base+"/overview", nil, ck, "")
		if r.Code != 200 {
			t.Fatalf("overview GET: %d (%s)", r.Code, r.Body)
		}
		var o ovr
		if err := json.Unmarshal(r.Body.Bytes(), &o); err != nil {
			t.Fatal(err)
		}
		return o
	}
	noteSet := func(o ovr) map[string]bool {
		m := map[string]bool{}
		for _, n := range o.Notes {
			m[n.ID] = true
		}
		return m
	}

	o1 := get()
	if len(o1.Readiness.Parts) != 9 || o1.Readiness.Score != 0 {
		t.Fatalf("bare: want 9 parts score 0, got %d parts score %d", len(o1.Readiness.Parts), o1.Readiness.Score)
	}
	if n := noteSet(o1); !n["details"] || !n["team"] {
		t.Fatalf("want details+team notes, got %v", n)
	}

	// complete details → invitation part done + publish note
	do(t, h, "PATCH", base, patchEventReq{CoupleA: ptr("A"), CoupleB: ptr("B"), EventDate: ptr("2027-04-12T09:00:00Z"), Venue: ptr("Hall")}, ck, csrf)
	o2 := get()
	if o2.Readiness.Score == 0 {
		t.Fatal("score should rise after details complete")
	}
	if n := noteSet(o2); n["details"] || !n["publish"] {
		t.Fatalf("want publish note, no details note; got %v", n)
	}

	// dismiss publish note
	if r := do(t, h, "POST", base+"/notes/publish/dismiss", nil, ck, csrf); r.Code != 204 {
		t.Fatalf("dismiss: %d", r.Code)
	}
	if noteSet(get())["publish"] {
		t.Fatal("publish note should be dismissed")
	}
}
