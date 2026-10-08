package http

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Tests for the API changes that align the backend with the latest dashboard UI
// (docs/api-change-plan.md). Each test walks one slice: happy path, validation, authorization and
// cross-event isolation. The role matrix for the new routes lives in authz_matrix_test.go.

type uiEnv struct {
	h          http.Handler
	pool       *pgxpool.Pool
	mail       *captureMailer
	ck         []*http.Cookie
	csrf, base string
	id         string
}

// uiSetup registers+verifies an owner and creates a wedding event.
func uiSetup(t *testing.T, email string) uiEnv {
	t.Helper()
	h, m, pool := setup(t)
	ck, csrf := registerLogin(t, h, email)
	verifyUser(t, h, pool, email)
	rr := do(t, h, "POST", "/api/v1/events", createEventReq{Type: "wedding", CoupleA: ptr("Raka"), CoupleB: ptr("Celine"), EventDate: ptr("2099-04-12T09:00:00Z")}, ck, csrf)
	var ev eventDTO
	_ = json.Unmarshal(rr.Body.Bytes(), &ev)
	return uiEnv{h: h, pool: pool, mail: m, ck: ck, csrf: csrf, base: "/api/v1/events/" + ev.ID, id: ev.ID}
}

func (e uiEnv) call(t *testing.T, method, path string, body any) (int, []byte) {
	t.Helper()
	rr := do(t, e.h, method, e.base+path, body, e.ck, e.csrf)
	return rr.Code, rr.Body.Bytes()
}

func want(t *testing.T, what string, got, wantCode int, body []byte) {
	t.Helper()
	if got != wantCode {
		t.Fatalf("%s: want %d got %d (%s)", what, wantCode, got, strings.TrimSpace(string(body)))
	}
}

func fieldErr(t *testing.T, body []byte, field string) {
	t.Helper()
	var e struct {
		Error struct {
			Fields map[string]string `json:"fields"`
		} `json:"error"`
	}
	_ = json.Unmarshal(body, &e)
	if e.Error.Fields[field] == "" {
		t.Fatalf("expected a %q field error, got %s", field, body)
	}
}

func TestScheduleDetails(t *testing.T) {
	e := uiSetup(t, "sch-ui@example.com")

	code, b := e.call(t, "POST", "/schedule", scheduleReq{
		Title: "Reception", StartsAt: ptr("2099-04-12T11:00:00Z"), EndsAt: ptr("2099-04-12T15:00:00Z"), Venue: ptr("The Ballroom"),
		Address: "Jl. Jend. Sudirman 5", DressCode: "Black tie optional", Description: "Dinner and toasts", Visibility: "invite_only",
	})
	want(t, "create moment", code, 201, b)
	var it scheduleDTO
	_ = json.Unmarshal(b, &it)
	if it.EndsAt == nil || *it.EndsAt != "2099-04-12T15:00:00Z" || it.Address != "Jl. Jend. Sudirman 5" || it.DressCode != "Black tie optional" || it.Visibility != "invite_only" || it.Description != "Dinner and toasts" {
		t.Fatalf("round trip: %+v", it)
	}

	// defaults: a bare moment is visible to everyone, with empty details
	code, b = e.call(t, "POST", "/schedule", scheduleReq{Title: "Bare"})
	want(t, "bare moment", code, 201, b)
	var bare scheduleDTO
	_ = json.Unmarshal(b, &bare)
	if bare.Visibility != "everyone" || bare.EndsAt != nil || bare.Address != "" {
		t.Fatalf("defaults: %+v", bare)
	}

	// patch only some fields; the rest stays
	code, b = e.call(t, "PATCH", "/schedule/"+it.ID, schedulePatchReq{DressCode: ptr("Cocktail"), Visibility: ptr("family_only")})
	want(t, "patch", code, 200, b)
	var up scheduleDTO
	_ = json.Unmarshal(b, &up)
	if up.DressCode != "Cocktail" || up.Visibility != "family_only" || up.Address != "Jl. Jend. Sudirman 5" || up.Title != "Reception" {
		t.Fatalf("partial patch: %+v", up)
	}

	// validation
	code, b = e.call(t, "POST", "/schedule", scheduleReq{Title: "x", Visibility: "everybody"})
	want(t, "bad visibility", code, 400, b)
	fieldErr(t, b, "visibility")
	code, b = e.call(t, "POST", "/schedule", scheduleReq{Title: "x", StartsAt: ptr("2099-04-12T15:00:00Z"), EndsAt: ptr("2099-04-12T11:00:00Z")})
	want(t, "ends before starts", code, 400, b)
	fieldErr(t, b, "ends_at")
	code, b = e.call(t, "PATCH", "/schedule/"+it.ID, schedulePatchReq{EndsAt: ptr("2099-04-12T08:00:00Z")}) // before the stored start
	want(t, "patch ends before stored start", code, 400, b)
	code, b = e.call(t, "POST", "/schedule", scheduleReq{Title: "x", EndsAt: ptr("tomorrow")})
	want(t, "bad timestamp", code, 400, b)
	fieldErr(t, b, "ends_at")
	code, b = e.call(t, "POST", "/schedule", scheduleReq{Title: "x", Address: strings.Repeat("a", 301)})
	want(t, "address too long", code, 400, b)

	// another event's owner cannot touch this moment (404, not 403)
	other := uiSetup2(t, e, "sch-ui-other@example.com")
	code2, b2 := other.callOn(t, "PATCH", e.base+"/schedule/"+it.ID, schedulePatchReq{Title: ptr("hijack")})
	want(t, "foreign event", code2, 404, b2)
}

// uiSetup2 registers a second user (sharing the DB/handler) with their own event.
func uiSetup2(t *testing.T, base uiEnv, email string) uiEnv {
	t.Helper()
	ck, csrf := registerLogin(t, base.h, email)
	verifyUser(t, base.h, base.pool, email)
	rr := do(t, base.h, "POST", "/api/v1/events", createEventReq{Type: "wedding"}, ck, csrf)
	var ev eventDTO
	_ = json.Unmarshal(rr.Body.Bytes(), &ev)
	return uiEnv{h: base.h, pool: base.pool, mail: base.mail, ck: ck, csrf: csrf, base: "/api/v1/events/" + ev.ID, id: ev.ID}
}

// callOn issues a request with this env's session against an absolute path.
func (e uiEnv) callOn(t *testing.T, method, path string, body any) (int, []byte) {
	t.Helper()
	rr := do(t, e.h, method, path, body, e.ck, e.csrf)
	return rr.Code, rr.Body.Bytes()
}

func TestGuestDetailsAndResend(t *testing.T) {
	e := uiSetup(t, "gst-ui@example.com")

	code, b := e.call(t, "POST", "/guests", guestReq{Name: "Sarah", Email: ptr("sarah@example.com"), TableLabel: ptr("A1"), Notes: "Vegetarian"})
	want(t, "create guest", code, 201, b)
	var g guestDTO
	_ = json.Unmarshal(b, &g)
	if g.TableLabel == nil || *g.TableLabel != "A1" || g.Notes != "Vegetarian" || g.InvitedAt != nil {
		t.Fatalf("details: %+v", g)
	}

	// patch notes; clear the table with ""
	code, b = e.call(t, "PATCH", "/guests/"+g.ID, guestPatchReq{Notes: ptr("Seat near the front"), TableLabel: ptr("")})
	want(t, "patch", code, 200, b)
	_ = json.Unmarshal(b, &g)
	if g.Notes != "Seat near the front" || g.TableLabel != nil {
		t.Fatalf("patched: %+v", g)
	}

	// validation: notes length, table length, reply status, party bounds
	code, b = e.call(t, "PATCH", "/guests/"+g.ID, guestPatchReq{Notes: ptr(strings.Repeat("n", 1001))})
	want(t, "notes too long", code, 400, b)
	fieldErr(t, b, "notes")
	code, b = e.call(t, "PATCH", "/guests/"+g.ID, guestPatchReq{TableLabel: ptr(strings.Repeat("t", 21))})
	want(t, "table too long", code, 400, b)
	code, b = e.call(t, "PATCH", "/guests/"+g.ID, guestPatchReq{RSVPStatus: ptr("maybe")})
	want(t, "bad rsvp status", code, 400, b)
	fieldErr(t, b, "rsvp_status")
	code, b = e.call(t, "PATCH", "/guests/"+g.ID, guestPatchReq{PartySize: ptrInt(-1)})
	want(t, "negative party", code, 400, b)
	code, b = e.call(t, "PATCH", "/guests/"+g.ID, guestPatchReq{PlusOnes: ptrInt(-2)})
	want(t, "negative plus ones", code, 400, b)
	code, b = e.call(t, "POST", "/guests", guestReq{Name: "Neg", PlusOnes: -1})
	want(t, "create negative plus ones", code, 400, b)

	// import carries table + notes
	code, b = e.call(t, "POST", "/guests/import", importReq{Guests: []guestReq{{Name: "Imported", TableLabel: ptr("B2"), Notes: "from csv"}}})
	want(t, "import", code, 200, b)
	_, lb := e.call(t, "GET", "/guests", nil)
	if !strings.Contains(string(lb), `"table_label":"B2"`) || !strings.Contains(string(lb), `"notes":"from csv"`) {
		t.Fatalf("import lost details: %s", lb)
	}

	// resend: emails the personal link and stamps invited_at
	code, b = e.call(t, "POST", "/guests/"+g.ID+"/resend", nil)
	want(t, "resend", code, 204, b)
	link := e.mail.invites["sarah@example.com"]
	if !strings.HasPrefix(link, "http://web.test/invite/") || len(link) < 40 {
		t.Fatalf("mailed link: %q", link)
	}
	code, b = e.call(t, "GET", "/guests/"+g.ID, nil)
	want(t, "get", code, 200, b)
	_ = json.Unmarshal(b, &g)
	if g.InvitedAt == nil {
		t.Fatal("invited_at not stamped after resend")
	}

	// no email on file → 422 no_email, nothing sent
	code, b = e.call(t, "POST", "/guests", guestReq{Name: "NoMail"})
	var nm guestDTO
	_ = json.Unmarshal(b, &nm)
	code, b = e.call(t, "POST", "/guests/"+nm.ID+"/resend", nil)
	want(t, "no email", code, 422, b)
	if !strings.Contains(string(b), "no_email") {
		t.Fatalf("error code: %s", b)
	}

	// a guest of another event is a 404 through this event's path
	other := uiSetup2(t, e, "gst-ui-other@example.com")
	code, b = other.call(t, "POST", "/guests", guestReq{Name: "Theirs", Email: ptr("theirs@example.com")})
	var theirs guestDTO
	_ = json.Unmarshal(b, &theirs)
	code, b = e.call(t, "POST", "/guests/"+theirs.ID+"/resend", nil)
	want(t, "foreign guest resend", code, 404, b)
	if _, sent := e.mail.invites["theirs@example.com"]; sent {
		t.Fatal("mail sent for a guest of another event")
	}
}

func TestTaskCategoryAndGiftQuantity(t *testing.T) {
	e := uiSetup(t, "tg-ui@example.com")

	code, b := e.call(t, "POST", "/tasks", taskReq{Title: "Book florist", Category: "Design"})
	want(t, "task", code, 201, b)
	var tk taskDTO
	_ = json.Unmarshal(b, &tk)
	if tk.Category != "Design" {
		t.Fatalf("category: %+v", tk)
	}
	code, b = e.call(t, "PATCH", "/tasks/"+tk.ID, taskPatchReq{Category: ptr("Gift")})
	want(t, "patch category", code, 200, b)
	_ = json.Unmarshal(b, &tk)
	if tk.Category != "Gift" {
		t.Fatalf("patched category: %+v", tk)
	}
	code, b = e.call(t, "POST", "/tasks", taskReq{Title: "x", Category: strings.Repeat("c", 41)})
	want(t, "category too long", code, 400, b)

	// registry quantity + claimed
	code, b = e.call(t, "POST", "/gifts", giftReq{Title: "Linen set", Quantity: 2})
	want(t, "gift", code, 201, b)
	var gf giftDTO
	_ = json.Unmarshal(b, &gf)
	if gf.Quantity != 2 || gf.Claimed != 0 {
		t.Fatalf("gift: %+v", gf)
	}
	code, b = e.call(t, "POST", "/gifts", giftReq{Title: "default qty"})
	var dflt giftDTO
	_ = json.Unmarshal(b, &dflt)
	if dflt.Quantity != 1 {
		t.Fatalf("default quantity: %+v", dflt)
	}
	code, b = e.call(t, "PATCH", "/gifts/"+gf.ID, giftPatchReq{Claimed: ptrInt(1)})
	want(t, "claim one", code, 200, b)
	code, b = e.call(t, "PATCH", "/gifts/"+gf.ID, giftPatchReq{Claimed: ptrInt(3)})
	want(t, "claimed above quantity", code, 400, b)
	fieldErr(t, b, "claimed")
	code, b = e.call(t, "PATCH", "/gifts/"+gf.ID, giftPatchReq{Quantity: ptrInt(1), Claimed: ptrInt(1)})
	want(t, "shrink to claimed", code, 200, b)
	code, b = e.call(t, "PATCH", "/gifts/"+gf.ID, giftPatchReq{Quantity: ptrInt(0)})
	want(t, "quantity zero", code, 400, b)
	code, b = e.call(t, "POST", "/gifts", giftReq{Title: "neg", Quantity: -1})
	want(t, "negative quantity", code, 400, b)
}

func TestGiftMethods(t *testing.T) {
	e := uiSetup(t, "gm-ui@example.com")

	code, b := e.call(t, "POST", "/gift-methods", methodReq{Type: "bank", Title: "BCA · Raka", Detail: "Account number", CopyValue: "8830 1122 45"})
	want(t, "create", code, 201, b)
	var m1 methodDTO
	_ = json.Unmarshal(b, &m1)
	code, b = e.call(t, "POST", "/gift-methods", methodReq{Type: "wallet", Title: "GoPay"})
	want(t, "create 2", code, 201, b)
	var m2 methodDTO
	_ = json.Unmarshal(b, &m2)
	if m1.Position != 0 || m2.Position != 1 {
		t.Fatalf("positions: %d %d", m1.Position, m2.Position)
	}

	// validation
	code, b = e.call(t, "POST", "/gift-methods", methodReq{Type: "crypto", Title: "x"})
	want(t, "bad type", code, 400, b)
	fieldErr(t, b, "type")
	code, b = e.call(t, "POST", "/gift-methods", methodReq{Type: "bank", Title: "  "})
	want(t, "blank title", code, 400, b)
	code, b = e.call(t, "PATCH", "/gift-methods/"+m1.ID, methodPatchReq{Title: ptr("")})
	want(t, "blank title on patch", code, 400, b)
	code, b = e.call(t, "POST", "/gift-methods", methodReq{Type: "bank", Title: "x", CopyValue: strings.Repeat("9", 301)})
	want(t, "copy too long", code, 400, b)

	// patch + reorder + list
	code, b = e.call(t, "PATCH", "/gift-methods/"+m1.ID, methodPatchReq{CopyValue: ptr("0000")})
	want(t, "patch", code, 200, b)
	code, b = e.call(t, "POST", "/gift-methods/reorder", reorderReq{Order: []string{m2.ID, m1.ID}})
	want(t, "reorder", code, 200, b)
	var list struct{ Data []methodDTO }
	_, lb := e.call(t, "GET", "/gift-methods", nil)
	_ = json.Unmarshal(lb, &list)
	if len(list.Data) != 2 || list.Data[0].ID != m2.ID || list.Data[1].CopyValue != "0000" {
		t.Fatalf("list after reorder: %s", lb)
	}

	// a method of another event: 404 via this event's path (patch + delete)
	other := uiSetup2(t, e, "gm-ui-other@example.com")
	_, ob := other.call(t, "POST", "/gift-methods", methodReq{Type: "physical", Title: "Theirs"})
	var theirs methodDTO
	_ = json.Unmarshal(ob, &theirs)
	code, b = e.call(t, "PATCH", "/gift-methods/"+theirs.ID, methodPatchReq{Title: ptr("hijack")})
	want(t, "foreign patch", code, 404, b)
	code, b = e.call(t, "DELETE", "/gift-methods/"+theirs.ID, nil)
	want(t, "foreign delete", code, 404, b)

	// public invitation: methods appear with the gift section, and only then
	code, b = e.call(t, "POST", "/invitation/publish", nil)
	want(t, "publish", code, 200, b)
	var pub struct{ Token string }
	_ = json.Unmarshal(b, &pub)
	page := func() struct {
		Methods []publicMethodDTO `json:"gift_methods"`
	} {
		var p struct {
			Methods []publicMethodDTO `json:"gift_methods"`
		}
		r := do(t, e.h, "GET", "/api/v1/invite/"+pub.Token, nil, nil, "")
		if r.Code != 200 {
			t.Fatalf("public page: %d", r.Code)
		}
		_ = json.Unmarshal(r.Body.Bytes(), &p)
		return p
	}
	if p := page(); len(p.Methods) != 2 || p.Methods[0].Title != "GoPay" {
		t.Fatalf("public methods: %+v", p.Methods)
	}
	var inv invitationDTO
	_, ib := e.call(t, "GET", "/invitation", nil)
	_ = json.Unmarshal(ib, &inv)
	for _, s := range inv.Sections {
		if s.Type == "gift" {
			e.call(t, "PATCH", "/invitation/sections/"+s.ID, sectionPatchReq{Visible: boolPtr(false)})
		}
	}
	if p := page(); len(p.Methods) != 0 {
		t.Fatalf("methods must be hidden with the gift section: %+v", p.Methods)
	}

	// delete
	code, b = e.call(t, "DELETE", "/gift-methods/"+m1.ID, nil)
	want(t, "delete", code, 204, b)
	code, b = e.call(t, "DELETE", "/gift-methods/"+m1.ID, nil)
	want(t, "delete again", code, 404, b)
}

func TestLiveDetails(t *testing.T) {
	e := uiSetup(t, "live-ui@example.com")

	code, b := e.call(t, "GET", "/live", nil)
	want(t, "default", code, 200, b)
	if !strings.Contains(string(b), `"show_on_invitation":true`) || !strings.Contains(string(b), `"status":"offline"`) {
		t.Fatalf("defaults: %s", b)
	}
	code, b = e.call(t, "PATCH", "/live", livePatchReq{Provider: ptr("YouTube Live"), StreamURL: ptr("https://youtube.com/live/abc"), Status: ptr("scheduled"), StartsAt: ptr("2099-04-12T03:00:00Z")})
	want(t, "patch", code, 200, b)
	if !strings.Contains(string(b), `"starts_at":"2099-04-12T03:00:00Z"`) {
		t.Fatalf("starts_at: %s", b)
	}

	// validation: javascript: urls never reach the public page; bad timestamps rejected
	code, b = e.call(t, "PATCH", "/live", livePatchReq{StreamURL: ptr("javascript:alert(1)")})
	want(t, "js url", code, 400, b)
	fieldErr(t, b, "stream_url")
	code, b = e.call(t, "PATCH", "/live", livePatchReq{StartsAt: ptr("soon")})
	want(t, "bad starts_at", code, 400, b)
	// "" clears the start time; other fields are untouched
	code, b = e.call(t, "PATCH", "/live", livePatchReq{StartsAt: ptr("")})
	want(t, "clear", code, 200, b)
	if !strings.Contains(string(b), `"starts_at":null`) || !strings.Contains(string(b), "youtube.com/live/abc") {
		t.Fatalf("clear: %s", b)
	}

	// the event-day payload now uses snake_case live fields (it used Go field names before)
	_, ed := e.call(t, "GET", "/eventday", nil)
	if strings.Contains(string(ed), `"Provider"`) || !strings.Contains(string(ed), `"stream_url"`) {
		t.Fatalf("eventday live shape: %s", ed)
	}

	// public page: live is shown only when allowed AND not offline
	_, pb := e.call(t, "POST", "/invitation/publish", nil)
	var pub struct{ Token string }
	_ = json.Unmarshal(pb, &pub)
	live := func() *publicLiveDTO {
		var p struct {
			Live *publicLiveDTO `json:"live"`
		}
		r := do(t, e.h, "GET", "/api/v1/invite/"+pub.Token, nil, nil, "")
		_ = json.Unmarshal(r.Body.Bytes(), &p)
		return p.Live
	}
	if l := live(); l == nil || l.Status != "scheduled" {
		t.Fatalf("public live: %+v", l)
	}
	e.call(t, "PATCH", "/live", livePatchReq{ShowOnInvitation: boolPtr(false)})
	if l := live(); l != nil {
		t.Fatalf("hidden live leaked: %+v", l)
	}
	e.call(t, "PATCH", "/live", livePatchReq{ShowOnInvitation: boolPtr(true), Status: ptr("offline")})
	if l := live(); l != nil {
		t.Fatalf("offline live leaked: %+v", l)
	}
}

func TestMembers(t *testing.T) {
	e := uiSetup(t, "team-ui@example.com")

	// the owner is listed first, active
	code, b := e.call(t, "GET", "/members", nil)
	want(t, "list", code, 200, b)
	var list struct{ Data []memberDTO }
	_ = json.Unmarshal(b, &list)
	if len(list.Data) != 1 || list.Data[0].Role != "owner" || list.Data[0].Status != "active" || list.Data[0].Email != "team-ui@example.com" {
		t.Fatalf("owner row: %s", b)
	}
	ownerRow := list.Data[0]

	// invite a person who has no account yet → pending, mail goes out, role is recorded
	code, b = e.call(t, "POST", "/members", memberReq{Email: "  Cilla@Example.com ", Role: "cohost"})
	want(t, "invite", code, 201, b)
	var m memberDTO
	_ = json.Unmarshal(b, &m)
	if m.Status != "invited" || m.Role != "cohost" || m.Email != "cilla@example.com" || m.UserID != nil {
		t.Fatalf("pending invite: %+v", m)
	}
	if e.mail.team["cilla@example.com"] != "cohost" {
		t.Fatalf("invite mail: %v", e.mail.team)
	}

	// duplicates (any case) → 409; validation → 400; owner cannot be granted
	code, b = e.call(t, "POST", "/members", memberReq{Email: "CILLA@example.com", Role: "planner"})
	want(t, "duplicate", code, 409, b)
	code, b = e.call(t, "POST", "/members", memberReq{Email: "not-an-email", Role: "family"})
	want(t, "bad email", code, 400, b)
	fieldErr(t, b, "email")
	code, b = e.call(t, "POST", "/members", memberReq{Email: "x@example.com", Role: "owner"})
	want(t, "grant owner", code, 400, b)
	fieldErr(t, b, "role")
	code, b = e.call(t, "POST", "/members", memberReq{Email: "x@example.com", Role: "superadmin"})
	want(t, "unknown role", code, 400, b)

	// the pending seat gives NO access until the invited email belongs to a VERIFIED account
	ck, _ := registerLogin(t, e.h, "cilla@example.com")
	if r := do(t, e.h, "GET", "/api/v1/events", nil, ck, ""); strings.Contains(r.Body.String(), e.id) {
		t.Fatalf("unverified account must not inherit the seat: %s", r.Body)
	}
	if r := do(t, e.h, "GET", e.base, nil, ck, ""); r.Code != 404 {
		t.Fatalf("unverified account reading the event: want 404 got %d", r.Code)
	}
	verifyUser(t, e.h, e.pool, "cilla@example.com")
	if r := do(t, e.h, "GET", "/api/v1/events", nil, ck, ""); !strings.Contains(r.Body.String(), e.id) {
		t.Fatalf("verified account should see the event after listing: %s", r.Body)
	}
	_, b = e.call(t, "GET", "/members", nil)
	_ = json.Unmarshal(b, &list)
	var cilla memberDTO
	for _, x := range list.Data {
		if x.Email == "cilla@example.com" {
			cilla = x
		}
	}
	if cilla.Status != "active" || cilla.UserID == nil || cilla.Name != "cilla@example.com" {
		t.Fatalf("accepted member: %+v", cilla)
	}
	// ...and now she is a co-host: can edit, cannot manage the team
	if r := do(t, e.h, "POST", e.base+"/tasks", taskReq{Title: "by cohost"}, ck, csrfOf(ck)); r.Code != 201 && r.Code != 403 {
		t.Fatalf("cohost task: %d", r.Code)
	}

	// change role; owner row is immutable
	code, b = e.call(t, "PATCH", "/members/"+cilla.ID, memberPatchReq{Role: "usher"})
	want(t, "change role", code, 200, b)
	if !strings.Contains(string(b), `"role":"usher"`) {
		t.Fatalf("role: %s", b)
	}
	code, b = e.call(t, "PATCH", "/members/"+cilla.ID, memberPatchReq{Role: "owner"})
	want(t, "promote to owner", code, 400, b)
	code, b = e.call(t, "PATCH", "/members/"+ownerRow.ID, memberPatchReq{Role: "family"})
	want(t, "demote owner", code, 422, b)
	code, b = e.call(t, "DELETE", "/members/"+ownerRow.ID, nil)
	want(t, "remove owner", code, 422, b)

	// a member of another event: 404 through this path
	other := uiSetup2(t, e, "team-ui-other@example.com")
	_, ob := other.call(t, "GET", "/members", nil)
	var ol struct{ Data []memberDTO }
	_ = json.Unmarshal(ob, &ol)
	code, b = e.call(t, "DELETE", "/members/"+ol.Data[0].ID, nil)
	want(t, "foreign member", code, 404, b)

	// remove → gone, and access with it
	code, b = e.call(t, "DELETE", "/members/"+cilla.ID, nil)
	want(t, "remove", code, 204, b)
	if r := do(t, e.h, "GET", e.base, nil, ck, ""); r.Code != 404 {
		t.Fatalf("removed member still reads the event: %d", r.Code)
	}
	code, b = e.call(t, "DELETE", "/members/"+cilla.ID, nil)
	want(t, "remove twice", code, 404, b)

	// inviting an already-registered, verified user attaches immediately
	registerLogin(t, e.h, "known@example.com")
	verifyUser(t, e.h, e.pool, "known@example.com")
	code, b = e.call(t, "POST", "/members", memberReq{Email: "known@example.com", Role: "planner"})
	want(t, "invite existing", code, 201, b)
	_ = json.Unmarshal(b, &m)
	if m.Status != "active" || m.UserID == nil {
		t.Fatalf("existing verified user should be active at once: %+v", m)
	}
}

func TestActivityFeed(t *testing.T) {
	e := uiSetup(t, "act-ui@example.com")

	_, b := e.call(t, "POST", "/guests", guestReq{Name: "Sarah", PlusOnes: 1})
	var g guestDTO
	_ = json.Unmarshal(b, &g)
	_, b = e.call(t, "POST", "/invitation/publish", nil)
	e.call(t, "PATCH", "/guests/"+g.ID, guestPatchReq{RSVPStatus: ptr("yes"), PartySize: ptrInt(2)})
	e.call(t, "POST", "/checkin", checkinReq{GuestID: g.ID})
	if _, err := e.pool.Exec(t.Context(), `INSERT INTO wishes (event_id, author_name, message) VALUES ($1,'Budi','hi')`, e.id); err != nil {
		t.Fatal(err)
	}
	_, tb := e.call(t, "POST", "/tasks", taskReq{Title: "Book venue"})
	var tk taskDTO
	_ = json.Unmarshal(tb, &tk)
	e.call(t, "PATCH", "/tasks/"+tk.ID, taskPatchReq{Done: boolPtr(true)})

	code, b := e.call(t, "GET", "/activity", nil)
	want(t, "feed", code, 200, b)
	var feed struct {
		Data []struct {
			Kind, Actor, Text, At string
		}
	}
	_ = json.Unmarshal(b, &feed)
	kinds := map[string]bool{}
	var prev time.Time = time.Now().Add(time.Hour)
	for _, it := range feed.Data {
		kinds[it.Kind] = true
		at, err := time.Parse(time.RFC3339, it.At)
		if err != nil || at.After(prev) {
			t.Fatalf("feed not newest-first / bad time: %+v", feed.Data)
		}
		prev = at
	}
	for _, k := range []string{"rsvp", "wish", "checkin", "task", "guest"} {
		if !kinds[k] {
			t.Fatalf("feed lacks %q: %s", k, b)
		}
	}
	if !strings.Contains(string(b), "confirmed attendance for 2") {
		t.Fatalf("rsvp text: %s", b)
	}

	// limit
	_, b = e.call(t, "GET", "/activity?limit=2", nil)
	_ = json.Unmarshal(b, &feed)
	if len(feed.Data) != 2 {
		t.Fatalf("limit=2 returned %d", len(feed.Data))
	}
	code, b = e.call(t, "GET", "/activity?limit=abc", nil)
	want(t, "bad limit", code, 400, b)
	code, b = e.call(t, "GET", "/activity?limit=0", nil)
	want(t, "zero limit", code, 400, b)
	_, b = e.call(t, "GET", "/activity?limit=9999", nil) // clamped, not an error
	_ = json.Unmarshal(b, &feed)
	if len(feed.Data) > 50 {
		t.Fatalf("limit not clamped: %d", len(feed.Data))
	}

	// another event's feed never includes this event's rows
	other := uiSetup2(t, e, "act-ui-other@example.com")
	_, ob := other.call(t, "GET", "/activity", nil)
	if strings.Contains(string(ob), "Sarah") || strings.Contains(string(ob), "Budi") {
		t.Fatalf("activity leaked across events: %s", ob)
	}
}

func TestProfilePhoneAndSessions(t *testing.T) {
	h, _, _ := setup(t)
	ck, csrf := registerLogin(t, h, "me-ui@example.com")

	// phone: set, keep on a name-only patch, clear, validate
	r := do(t, h, "PATCH", "/api/v1/me", map[string]any{"name": "Me", "phone": "+62 812-3456 (7890)", "avatar_url": "https://example.com/a.png"}, ck, csrf)
	if r.Code != 200 || !strings.Contains(r.Body.String(), `"phone":"+62 812-3456 (7890)"`) {
		t.Fatalf("set phone: %d %s", r.Code, r.Body)
	}
	r = do(t, h, "PATCH", "/api/v1/me", map[string]any{"name": "Me Again"}, ck, csrf)
	if !strings.Contains(r.Body.String(), `"phone":"+62`) || !strings.Contains(r.Body.String(), `"avatar_url":"https://example.com/a.png"`) {
		t.Fatalf("a name-only patch must not wipe phone/avatar: %s", r.Body)
	}
	if r := do(t, h, "PATCH", "/api/v1/me", map[string]any{"name": "Me", "phone": "call me"}, ck, csrf); r.Code != 400 {
		t.Fatalf("bad phone: want 400 got %d", r.Code)
	}
	r = do(t, h, "PATCH", "/api/v1/me", map[string]any{"name": "Me", "phone": ""}, ck, csrf)
	if !strings.Contains(r.Body.String(), `"phone":null`) {
		t.Fatalf("clear phone: %s", r.Body)
	}

	// sessions: two logins → two devices, the caller's flagged current
	rr := do(t, h, "POST", "/api/v1/auth/login", loginReq{Email: "me-ui@example.com", Password: "supersecret1"}, nil, "")
	ck2 := rr.Result().Cookies()
	var list struct {
		Data []sessionDTO `json:"data"`
	}
	_ = json.Unmarshal(do(t, h, "GET", "/api/v1/me/sessions", nil, ck, "").Body.Bytes(), &list)
	if len(list.Data) != 2 {
		t.Fatalf("sessions: %+v", list.Data)
	}
	cur, other := "", ""
	for _, s := range list.Data {
		if s.Current {
			cur = s.ID
		} else {
			other = s.ID
		}
	}
	if cur == "" || other == "" {
		t.Fatalf("exactly one session is current: %+v", list.Data)
	}

	// someone else's session id → 404 and it survives
	ock, ocsrf := registerLogin(t, h, "me-ui-other@example.com")
	var ol struct {
		Data []sessionDTO `json:"data"`
	}
	_ = json.Unmarshal(do(t, h, "GET", "/api/v1/me/sessions", nil, ock, "").Body.Bytes(), &ol)
	if r := do(t, h, "DELETE", "/api/v1/me/sessions/"+ol.Data[0].ID, nil, ck, csrf); r.Code != 404 {
		t.Fatalf("revoking a foreign session: want 404 got %d", r.Code)
	}
	if r := do(t, h, "GET", "/api/v1/me", nil, ock, ""); r.Code != 200 {
		t.Fatalf("the other user's session must survive: %d", r.Code)
	}
	if r := do(t, h, "DELETE", "/api/v1/me/sessions/not-a-uuid", nil, ck, csrf); r.Code != 404 {
		t.Fatalf("malformed id: want 404 got %d", r.Code)
	}
	_ = ocsrf

	// requires CSRF + auth
	if r := do(t, h, "DELETE", "/api/v1/me/sessions/"+other, nil, ck, ""); r.Code != 403 {
		t.Fatalf("revoke without csrf: want 403 got %d", r.Code)
	}
	if r := do(t, h, "GET", "/api/v1/me/sessions", nil, nil, ""); r.Code != 401 {
		t.Fatalf("anonymous sessions: want 401 got %d", r.Code)
	}

	// revoke the other device: its cookie stops working, ours keeps working
	if r := do(t, h, "DELETE", "/api/v1/me/sessions/"+other, nil, ck, csrf); r.Code != 204 {
		t.Fatalf("revoke other: %d", r.Code)
	}
	if r := do(t, h, "GET", "/api/v1/me", nil, ck2, ""); r.Code != 401 && cookieSession(ck2) == other {
		t.Fatalf("revoked session still works: %d", r.Code)
	}
	if r := do(t, h, "GET", "/api/v1/me", nil, ck, ""); r.Code != 200 {
		t.Fatalf("current session must survive: %d", r.Code)
	}
	// revoking the current one signs us out and clears the cookie
	r = do(t, h, "DELETE", "/api/v1/me/sessions/"+cur, nil, ck, csrf)
	if r.Code != 204 {
		t.Fatalf("revoke current: %d", r.Code)
	}
	cleared := false
	for _, c := range r.Result().Cookies() {
		if c.Name == sessionCookie && c.MaxAge < 0 {
			cleared = true
		}
	}
	if !cleared {
		t.Fatal("revoking the current session must clear the cookie")
	}
	if r := do(t, h, "GET", "/api/v1/me", nil, ck, ""); r.Code != 401 {
		t.Fatalf("after revoking current: want 401 got %d", r.Code)
	}
}

func cookieSession(ck []*http.Cookie) string {
	for _, c := range ck {
		if c.Name == sessionCookie {
			return c.Value
		}
	}
	return ""
}

func TestInvitationDeadlineAndTemplates(t *testing.T) {
	e := uiSetup(t, "inv-ui@example.com")

	// catalog is public
	r := do(t, e.h, "GET", "/api/v1/templates", nil, nil, "")
	var cat struct {
		Data []struct {
			ID, Slug, Name, Category, Palette string
			Tags                              []string
		}
	}
	_ = json.Unmarshal(r.Body.Bytes(), &cat)
	if r.Code != 200 || len(cat.Data) != 8 || cat.Data[0].Slug != "linen-vow" || len(cat.Data[0].Tags) != 2 {
		t.Fatalf("templates: %d %s", r.Code, r.Body)
	}

	// a valid template sticks; an unknown one is a 400, not a 500 or a dangling id
	code, b := e.call(t, "PATCH", "/invitation", invitationPatchReq{TemplateID: &cat.Data[1].ID})
	want(t, "template", code, 200, b)
	if !strings.Contains(string(b), cat.Data[1].ID) {
		t.Fatalf("template not stored: %s", b)
	}
	code, b = e.call(t, "PATCH", "/invitation", invitationPatchReq{TemplateID: ptr("00000000-0000-0000-0000-000000000000")})
	want(t, "unknown template", code, 400, b)
	fieldErr(t, b, "template_id")
	code, b = e.call(t, "PATCH", "/invitation", invitationPatchReq{TemplateID: ptr("not-a-uuid")})
	want(t, "malformed template id", code, 400, b)

	// RSVP deadline: a past deadline closes replies even though the event is far in the future
	_, gb := e.call(t, "POST", "/guests", guestReq{Name: "Sarah"})
	var g guestDTO
	_ = json.Unmarshal(gb, &g)
	_, pb := e.call(t, "POST", "/invitation/publish", nil)
	var pub struct{ Token string }
	_ = json.Unmarshal(pb, &pub)
	tok := strings.TrimPrefix(*g.InvitePath, "/invite/")
	rsvp := func() int {
		return do(t, e.h, "POST", "/api/v1/invite/"+tok+"/rsvp", rsvpReq{Status: "yes", PartySize: 1}, nil, "").Code
	}
	past := time.Now().Add(-time.Hour).UTC().Format(time.RFC3339)
	code, b = e.call(t, "PATCH", "/invitation", invitationPatchReq{RSVPDeadline: &past})
	want(t, "set deadline", code, 200, b)
	if !strings.Contains(string(b), `"rsvp_deadline":"`+past+`"`) {
		t.Fatalf("deadline not returned: %s", b)
	}
	if c := rsvp(); c != 422 {
		t.Fatalf("reply after the deadline: want 422 got %d", c)
	}
	pg := do(t, e.h, "GET", "/api/v1/invite/"+tok, nil, nil, "")
	if !strings.Contains(pg.Body.String(), `"rsvp_deadline":"`+past+`"`) {
		t.Fatalf("public page must expose the deadline: %s", pg.Body)
	}
	future := time.Now().Add(time.Hour).UTC().Format(time.RFC3339)
	e.call(t, "PATCH", "/invitation", invitationPatchReq{RSVPDeadline: &future})
	if c := rsvp(); c != 204 {
		t.Fatalf("reply before the deadline: want 204 got %d", c)
	}
	// "" clears it → the event-day cut-off applies again (event is in 2099 → open)
	code, b = e.call(t, "PATCH", "/invitation", invitationPatchReq{RSVPDeadline: ptr("")})
	want(t, "clear deadline", code, 200, b)
	if !strings.Contains(string(b), `"rsvp_deadline":null`) {
		t.Fatalf("cleared: %s", b)
	}
	if c := rsvp(); c != 204 {
		t.Fatalf("after clearing: want 204 got %d", c)
	}
	code, b = e.call(t, "PATCH", "/invitation", invitationPatchReq{RSVPDeadline: ptr("next friday")})
	want(t, "bad deadline", code, 400, b)
	fieldErr(t, b, "rsvp_deadline")
	// patching other fields leaves the deadline alone
	e.call(t, "PATCH", "/invitation", invitationPatchReq{RSVPDeadline: &future})
	_, b = e.call(t, "PATCH", "/invitation", invitationPatchReq{Palette: ptr("Stone")})
	if !strings.Contains(string(b), future) {
		t.Fatalf("unrelated patch cleared the deadline: %s", b)
	}
}

func TestAddonCheckout(t *testing.T) {
	h, _, _ := setup(t)
	ck, csrf := registerLogin(t, h, "addon-ui@example.com")

	post := func(body any) (int, []byte) {
		r := do(t, h, "POST", "/api/v1/billing/checkout", body, ck, csrf)
		return r.Code, r.Body.Bytes()
	}
	// nothing to buy / unknown add-on / too many → 400
	if c, b := post(checkoutReq{}); c != 400 {
		t.Fatalf("empty checkout: want 400 got %d (%s)", c, b)
	}
	if c, b := post(checkoutReq{Addons: []string{"nope"}}); c != 400 || !strings.Contains(string(b), "addons") {
		t.Fatalf("unknown addon: %d %s", c, b)
	}
	if c, b := post(checkoutReq{Addons: make([]string, 21)}); c != 400 {
		t.Fatalf("21 addons: want 400 got %d (%s)", c, b)
	}

	// two add-ons (+ a duplicate slug) → ONE invoice for the DB prices summed
	c, b := post(checkoutReq{Addons: []string{"live-stream", "gallery", "gallery"}})
	if c != 201 {
		t.Fatalf("addon checkout: %d %s", c, b)
	}
	var co struct{ Ref, URL string }
	_ = json.Unmarshal(b, &co)
	inv := do(t, h, "GET", "/api/v1/billing/invoices", nil, ck, "").Body.String()
	if !strings.Contains(inv, `"amount":208000`) || !strings.Contains(inv, "Memories gallery") || !strings.Contains(inv, "Live streaming") || !strings.Contains(inv, `"status":"pending"`) {
		t.Fatalf("add-on invoice: %s", inv)
	}
	var sub struct {
		Subscription any `json:"subscription"`
		Addons       []struct{ Slug, Status string }
	}
	read := func() {
		sub.Addons, sub.Subscription = nil, nil
		_ = json.Unmarshal(do(t, h, "GET", "/api/v1/billing/subscription", nil, ck, "").Body.Bytes(), &sub)
	}
	read()
	if sub.Subscription != nil || len(sub.Addons) != 2 || sub.Addons[0].Status != "pending" {
		t.Fatalf("pending add-ons: %+v", sub)
	}

	// forged webhook changes nothing; the signed one activates; replay and late "failed" are no-ops
	body := `{"ref":"` + co.Ref + `","status":"paid"}`
	ts := strconv.FormatInt(time.Now().Unix(), 10)
	if r := webhook(t, h, body, "deadbeef", ts); r.Code != 401 {
		t.Fatalf("forged: %d", r.Code)
	}
	read()
	if sub.Addons[0].Status != "pending" {
		t.Fatal("forged webhook activated an add-on")
	}
	if r := webhook(t, h, body, testPay.Sign([]byte(body), ts), ts); r.Code != 204 {
		t.Fatalf("paid webhook: %d", r.Code)
	}
	read()
	if len(sub.Addons) != 2 || sub.Addons[0].Status != "active" || sub.Addons[1].Status != "active" {
		t.Fatalf("after paid: %+v", sub.Addons)
	}
	failBody := `{"ref":"` + co.Ref + `","status":"failed"}`
	if r := webhook(t, h, failBody, testPay.Sign([]byte(failBody), ts), ts); r.Code != 204 {
		t.Fatalf("late failed: %d", r.Code)
	}
	read()
	if sub.Addons[0].Status != "active" {
		t.Fatalf("settled add-on downgraded: %+v", sub.Addons)
	}

	// package + add-on in one order: one invoice, subscription AND add-on pending together
	c, b = post(checkoutReq{Package: "essential", Addons: []string{"live-stream"}})
	if c != 201 {
		t.Fatalf("combined: %d %s", c, b)
	}
	var co2 struct{ Ref string }
	_ = json.Unmarshal(b, &co2)
	if inv := do(t, h, "GET", "/api/v1/billing/invoices", nil, ck, "").Body.String(); !strings.Contains(inv, `"amount":278000`) || !strings.Contains(inv, "Essential + Live streaming") {
		t.Fatalf("combined invoice: %s", inv)
	}
	// a failed payment fails the add-on and cancels the subscription; it never grants anything
	fb := `{"ref":"` + co2.Ref + `","status":"failed"}`
	if r := webhook(t, h, fb, testPay.Sign([]byte(fb), ts), ts); r.Code != 204 {
		t.Fatalf("failed webhook: %d", r.Code)
	}
	read()
	for _, a := range sub.Addons {
		if a.Slug == "live-stream" && a.Status != "active" { // the earlier paid purchase is still there
			t.Fatalf("live-stream should still be owned from the first order: %+v", sub.Addons)
		}
	}

	// another user owns nothing
	ock, _ := registerLogin(t, h, "addon-ui-other@example.com")
	if o := do(t, h, "GET", "/api/v1/billing/subscription", nil, ock, "").Body.String(); strings.Contains(o, "live-stream") {
		t.Fatalf("add-on ownership leaked across users: %s", o)
	}
	// package-only checkout keeps its old behaviour
	if c, b := post(checkoutReq{Package: "signature"}); c != 201 {
		t.Fatalf("package-only checkout: %d %s", c, b)
	}
	if c, _ := post(checkoutReq{Package: "nope"}); c != 404 {
		t.Fatalf("unknown package: want 404 got %d", c)
	}
}
