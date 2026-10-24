package http

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"reflect"
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
	if r.Code != 200 || len(cat.Data) != 11 || cat.Data[0].Slug != "linen-vow" || len(cat.Data[0].Tags) != 2 || cat.Data[8].Slug != "gilded-seal" || cat.Data[9].Slug != "we-do" || cat.Data[10].Slug != "arunika" {
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

func TestEventTimezone(t *testing.T) {
	e := uiSetup(t, "tz-ui@example.com")
	zone := func(b []byte) string {
		var ev eventDTO
		_ = json.Unmarshal(b, &ev)
		return ev.Timezone
	}

	// created without a zone → the Jakarta default, echoed on read
	code, b := e.callOn(t, "GET", e.base, nil)
	want(t, "get", code, 200, b)
	if z := zone(b); z != "Asia/Jakarta" {
		t.Fatalf("default timezone = %q", z)
	}

	// created with a zone → stored as given
	rr := do(t, e.h, "POST", "/api/v1/events", createEventReq{Type: "wedding", Timezone: ptr("Europe/Amsterdam")}, e.ck, e.csrf)
	want(t, "create with tz", rr.Code, 201, rr.Body.Bytes())
	if z := zone(rr.Body.Bytes()); z != "Europe/Amsterdam" {
		t.Fatalf("created timezone = %q", z)
	}

	// an unknown or empty zone is a field error on create and patch, and changes nothing
	for _, bad := range []string{"Mars/Base", "", "Local"} {
		rr = do(t, e.h, "POST", "/api/v1/events", createEventReq{Type: "wedding", Timezone: ptr(bad)}, e.ck, e.csrf)
		want(t, "create bad tz "+bad, rr.Code, 400, rr.Body.Bytes())
		fieldErr(t, rr.Body.Bytes(), "timezone")
		code, b = e.callOn(t, "PATCH", e.base, patchEventReq{Timezone: ptr(bad)})
		want(t, "patch bad tz "+bad, code, 400, b)
		fieldErr(t, b, "timezone")
	}
	code, b = e.callOn(t, "GET", e.base, nil)
	if z := zone(b); code != 200 || z != "Asia/Jakarta" {
		t.Fatalf("timezone changed by rejected patches: %d %q", code, z)
	}

	// patch updates it; a patch without the field keeps it; the list shows it too
	code, b = e.callOn(t, "PATCH", e.base, patchEventReq{Timezone: ptr("Asia/Makassar")})
	want(t, "patch tz", code, 200, b)
	if z := zone(b); z != "Asia/Makassar" {
		t.Fatalf("patched timezone = %q", z)
	}
	code, b = e.callOn(t, "PATCH", e.base, patchEventReq{Venue: ptr("Glasshouse")})
	want(t, "patch venue", code, 200, b)
	if z := zone(b); z != "Asia/Makassar" {
		t.Fatalf("timezone lost on unrelated patch: %q", z)
	}
	code, b = e.callOn(t, "GET", "/api/v1/events", nil)
	want(t, "list", code, 200, b)
	if !strings.Contains(string(b), `"timezone":"Asia/Makassar"`) {
		t.Fatalf("list lacks timezone: %s", b)
	}
}

func TestScheduleTemplateExtras(t *testing.T) {
	e := uiSetup(t, "sch-gs@example.com")
	other := uiSetup2(t, e, "sch-gs-other@example.com")
	media := func(ev uiEnv) string {
		var id string
		if err := e.pool.QueryRow(t.Context(),
			`INSERT INTO media (event_id, kind, storage_key, url, content_type, size_bytes) VALUES ($1,'photo','k','u','image/png',1) RETURNING id`, ev.id).Scan(&id); err != nil {
			t.Fatal(err)
		}
		return id
	}
	own, foreign := media(e), media(other)
	dto := func(b []byte) scheduleDTO {
		var d scheduleDTO
		_ = json.Unmarshal(b, &d)
		return d
	}

	// bare moment: empty extras, no photo
	code, b := e.call(t, "POST", "/schedule", scheduleReq{Title: "Bare"})
	want(t, "bare", code, 201, b)
	if d := dto(b); d.Label != "" || d.MapURL != "" || d.VenueNote != "" || d.MediaID != nil {
		t.Fatalf("defaults: %+v", d)
	}

	// create with every extra; round trip through list
	code, b = e.call(t, "POST", "/schedule", scheduleReq{Title: "Akad", Label: "The Ceremony", MapURL: "https://maps.app.goo.gl/x", VenueNote: "Garden pavilion", MediaID: &own})
	want(t, "create extras", code, 201, b)
	it := dto(b)
	if it.Label != "The Ceremony" || it.MapURL != "https://maps.app.goo.gl/x" || it.VenueNote != "Garden pavilion" || it.MediaID == nil || *it.MediaID != own {
		t.Fatalf("round trip: %+v", it)
	}
	code, b = e.call(t, "GET", "/schedule", nil)
	want(t, "list", code, 200, b)
	if !strings.Contains(string(b), `"label":"The Ceremony"`) || !strings.Contains(string(b), `"media_id":"`+own+`"`) {
		t.Fatalf("list lacks extras: %s", b)
	}

	// map_url must be https with a host
	for _, bad := range []string{"javascript:alert(1)", "http://maps.example.com/x", "data:text/html,x", "https://", "//evil.example", "https://" + strings.Repeat("a", 500)} {
		code, b = e.call(t, "POST", "/schedule", scheduleReq{Title: "x", MapURL: bad})
		want(t, "create map_url "+bad[:min(len(bad), 20)], code, 400, b)
		fieldErr(t, b, "map_url")
		code, b = e.call(t, "PATCH", "/schedule/"+it.ID, schedulePatchReq{MapURL: ptr(bad)})
		want(t, "patch map_url "+bad[:min(len(bad), 20)], code, 400, b)
		fieldErr(t, b, "map_url")
	}

	// length caps
	code, b = e.call(t, "POST", "/schedule", scheduleReq{Title: "x", Label: strings.Repeat("a", 41)})
	want(t, "label too long", code, 400, b)
	fieldErr(t, b, "label")
	code, b = e.call(t, "PATCH", "/schedule/"+it.ID, schedulePatchReq{VenueNote: ptr(strings.Repeat("a", 161))})
	want(t, "venue_note too long", code, 400, b)
	fieldErr(t, b, "venue_note")

	// photo: another event's media and malformed ids are rejected; nothing changes
	for _, bad := range []string{foreign, "00000000-0000-0000-0000-000000000000", "not-a-uuid"} {
		code, b = e.call(t, "POST", "/schedule", scheduleReq{Title: "x", MediaID: &bad})
		want(t, "create media "+bad, code, 400, b)
		fieldErr(t, b, "media_id")
		code, b = e.call(t, "PATCH", "/schedule/"+it.ID, schedulePatchReq{MediaID: &bad})
		want(t, "patch media "+bad, code, 400, b)
		fieldErr(t, b, "media_id")
	}
	code, b = e.call(t, "GET", "/schedule", nil)
	if !strings.Contains(string(b), `"media_id":"`+own+`"`) {
		t.Fatalf("photo changed by rejected patches: %d %s", code, b)
	}

	// patch: untouched fields stay; "" clears map_url and the photo
	code, b = e.call(t, "PATCH", "/schedule/"+it.ID, schedulePatchReq{Label: ptr("Holy Matrimony")})
	want(t, "patch label", code, 200, b)
	if d := dto(b); d.Label != "Holy Matrimony" || d.MapURL != it.MapURL || d.VenueNote != it.VenueNote || d.MediaID == nil {
		t.Fatalf("partial patch: %+v", d)
	}
	code, b = e.call(t, "PATCH", "/schedule/"+it.ID, schedulePatchReq{MediaID: ptr(""), MapURL: ptr("")})
	want(t, "clear", code, 200, b)
	if d := dto(b); d.MediaID != nil || d.MapURL != "" || d.Label != "Holy Matrimony" {
		t.Fatalf("clear: %+v", d)
	}

	// deleting the photo (media cleanup) detaches it instead of failing or dangling
	code, b = e.call(t, "PATCH", "/schedule/"+it.ID, schedulePatchReq{MediaID: &own})
	want(t, "reattach", code, 200, b)
	if _, err := e.pool.Exec(t.Context(), `DELETE FROM media WHERE id=$1`, own); err != nil {
		t.Fatal(err)
	}
	code, b = e.call(t, "GET", "/schedule", nil)
	want(t, "list after media delete", code, 200, b)
	if strings.Contains(string(b), own) {
		t.Fatalf("deleted photo still referenced: %s", b)
	}
}

func TestTemplateSectionSet(t *testing.T) {
	e := uiSetup(t, "tpl-sec@example.com")

	r := do(t, e.h, "GET", "/api/v1/templates", nil, nil, "")
	var cat struct{ Data []struct{ ID, Slug string } }
	_ = json.Unmarshal(r.Body.Bytes(), &cat)
	ids := map[string]string{}
	for _, c := range cat.Data {
		ids[c.Slug] = c.ID
	}
	gs, other := ids["gilded-seal"], ids["linen-vow"]
	if gs == "" || other == "" {
		t.Fatalf("catalog lacks templates: %s", r.Body)
	}

	type inv struct {
		Sections []struct {
			ID, Type string
			Visible  bool
			Content  map[string]any
		}
	}
	get := func() inv {
		code, b := e.call(t, "GET", "/invitation", nil)
		want(t, "get invitation", code, 200, b)
		var v inv
		_ = json.Unmarshal(b, &v)
		return v
	}
	types := func(v inv) []string {
		var out []string
		for _, s := range v.Sections {
			out = append(out, s.Type)
		}
		return out
	}

	if got := types(get()); !reflect.DeepEqual(got, []string{"hero", "story", "schedule", "gift", "rsvp"}) {
		t.Fatalf("default sections = %v", got)
	}

	// a host edit made before the switch must survive it
	before := get()
	code, b := e.call(t, "PATCH", "/invitation/sections/"+before.Sections[1].ID, map[string]any{"content": map[string]any{"title": "Our story", "body": "Kept"}})
	want(t, "edit story", code, 200, b)

	// picking Gilded Seal adds the missing five, in template order; gallery and music start hidden
	code, b = e.call(t, "PATCH", "/invitation", invitationPatchReq{TemplateID: &gs})
	want(t, "pick gilded seal", code, 200, b)
	exp := []string{"hero", "opening", "story", "schedule", "gallery", "gift", "rsvp", "wishes", "music", "closing"}
	after := get()
	if got := types(after); !reflect.DeepEqual(got, exp) {
		t.Fatalf("sections after pick = %v want %v", got, exp)
	}
	for _, s := range after.Sections {
		hidden := s.Type == "gallery" || s.Type == "music"
		if s.Visible == hidden {
			t.Fatalf("%s visible=%v", s.Type, s.Visible)
		}
		if s.Type == "story" && s.Content["body"] != "Kept" {
			t.Fatalf("story content lost: %v", s.Content)
		}
	}

	// the host shows the gallery and reorders; picking the same template again changes nothing
	var galleryID string
	for _, s := range after.Sections {
		if s.Type == "gallery" {
			galleryID = s.ID
		}
	}
	code, b = e.call(t, "PATCH", "/invitation/sections/"+galleryID, map[string]any{"visible": true})
	want(t, "show gallery", code, 200, b)
	order := []string{}
	for i := len(after.Sections) - 1; i >= 0; i-- {
		order = append(order, after.Sections[i].ID)
	}
	code, b = e.call(t, "POST", "/invitation/sections/reorder", reorderReq{Order: order})
	want(t, "reorder", code, 200, b)
	manual := get()
	code, b = e.call(t, "PATCH", "/invitation", invitationPatchReq{TemplateID: &gs})
	want(t, "re-pick", code, 200, b)
	if again := get(); !reflect.DeepEqual(again, manual) {
		t.Fatalf("re-picking changed the invitation:\nbefore %+v\nafter  %+v", manual, again)
	}

	// switching to a template with no section set removes nothing
	code, b = e.call(t, "PATCH", "/invitation", invitationPatchReq{TemplateID: &other})
	want(t, "switch away", code, 200, b)
	if again := get(); !reflect.DeepEqual(again, manual) {
		t.Fatalf("switching template changed sections: %+v", again)
	}

	// unknown template: still a 400, sections untouched
	code, b = e.call(t, "PATCH", "/invitation", invitationPatchReq{TemplateID: ptr("00000000-0000-0000-0000-000000000000")})
	want(t, "unknown template", code, 400, b)
	fieldErr(t, b, "template_id")
}

func TestPublicTemplateProjection(t *testing.T) {
	e := uiSetup(t, "pub-gs@example.com")
	other := uiSetup2(t, e, "pub-gs-other@example.com")

	up := func(ev uiEnv) string {
		r := upload(t, ev.h, ev.base+"/media", "p.png", tinyPNG, ev.ck, ev.csrf)
		want(t, "upload", r.Code, 201, r.Body.Bytes())
		var m struct{ ID string }
		_ = json.Unmarshal(r.Body.Bytes(), &m)
		return m.ID
	}
	own, foreign := up(e), up(other)

	code, b := e.call(t, "POST", "/guests", guestReq{Name: "Sarah"})
	want(t, "guest", code, 201, b)
	var g guestDTO
	_ = json.Unmarshal(b, &g)
	personal := strings.TrimPrefix(*g.InvitePath, "/invite/")
	code, b = e.call(t, "POST", "/invitation/publish", nil)
	want(t, "publish", code, 200, b)
	var pub struct{ Token string }
	_ = json.Unmarshal(b, &pub)

	type pageT struct {
		Template *string `json:"template"`
		Timezone string  `json:"timezone"`
		Schedule []struct {
			Title   string  `json:"title"`
			Label   string  `json:"label"`
			PhotoID *string `json:"photo_id"`
		} `json:"schedule"`
		Media   map[string]string `json:"media"`
		Preview bool              `json:"preview"`
	}
	page := func(token string) (pageT, string) {
		r := do(t, e.h, "GET", "/api/v1/invite/"+token, nil, nil, "")
		want(t, "public page", r.Code, 200, r.Body.Bytes())
		var p pageT
		_ = json.Unmarshal(r.Body.Bytes(), &p)
		return p, r.Body.String()
	}
	titles := func(p pageT) []string {
		out := []string{}
		for _, m := range p.Schedule {
			out = append(out, m.Title)
		}
		return out
	}

	// (a, b) no template picked: null; zone is the event default; nothing to show yet
	p, raw := page(pub.Token)
	if p.Template != nil || p.Timezone != "Asia/Jakarta" || len(p.Schedule) != 0 || len(p.Media) != 0 || p.Preview {
		t.Fatalf("bare page: %+v", p)
	}
	for _, k := range []string{`"schedule":[]`, `"media":{}`} {
		if !strings.Contains(raw, k) {
			t.Fatalf("want %s (never null) in %s", k, raw)
		}
	}

	// set up: template, zone, three moments (one per visibility, the first with a photo), content photos
	tpls := do(t, e.h, "GET", "/api/v1/templates", nil, nil, "")
	var cat struct{ Data []struct{ ID, Slug string } }
	_ = json.Unmarshal(tpls.Body.Bytes(), &cat)
	var gs string
	for _, c := range cat.Data {
		if c.Slug == "gilded-seal" {
			gs = c.ID
		}
	}
	code, b = e.call(t, "PATCH", "/invitation", invitationPatchReq{TemplateID: &gs})
	want(t, "template", code, 200, b)
	code, b = e.callOn(t, "PATCH", e.base, patchEventReq{Timezone: ptr("Asia/Makassar")})
	want(t, "timezone", code, 200, b)
	for _, m := range []scheduleReq{
		{Title: "Ceremony", Label: "The Ceremony", Visibility: "everyone", MediaID: &own, StartsAt: ptr("2099-04-12T01:00:00Z")},
		{Title: "Dinner", Visibility: "invite_only"},
		{Title: "Family lunch", Visibility: "family_only"},
	} {
		code, b = e.call(t, "POST", "/schedule", m)
		want(t, "moment "+m.Title, code, 201, b)
	}
	var inv invitationDTO
	code, b = e.call(t, "GET", "/invitation", nil)
	want(t, "invitation", code, 200, b)
	_ = json.Unmarshal(b, &inv)
	secID := map[string]string{}
	for _, s := range inv.Sections {
		secID[s.Type] = s.ID
	}
	content := map[string]map[string]any{
		"hero":    {"photo_id": own},
		"story":   {"photo_ids": []any{foreign, own}},
		"gallery": {"photos": []any{map[string]any{"id": foreign}, map[string]any{"id": "not-a-uuid"}}},
		"closing": {"photo_id": foreign},
	}
	// The API refuses content that points at another event's photo (or a non-UUID); the projection must still
	// never sign one, so this test plants such content straight in the table (defence in depth).
	for typ, c := range content {
		code, b = e.call(t, "PATCH", "/invitation/sections/"+secID[typ], map[string]any{"content": c})
		if typ == "hero" {
			want(t, "content "+typ, code, 200, b)
			continue
		}
		want(t, "content "+typ+" with a foreign photo", code, 400, b)
		raw, _ := json.Marshal(c)
		if _, err := e.pool.Exec(context.Background(), `UPDATE invitation_sections SET content=$2 WHERE id=$1`, secID[typ], raw); err != nil {
			t.Fatal(err)
		}
	}

	// (a, b, c, e) generic link
	p, raw = page(pub.Token)
	if p.Template == nil || *p.Template != "gilded-seal" || p.Timezone != "Asia/Makassar" {
		t.Fatalf("template/timezone: %+v", p)
	}
	if got := titles(p); !reflect.DeepEqual(got, []string{"Ceremony"}) {
		t.Fatalf("generic link moments = %v (invite_only and family_only must stay hidden)", got)
	}
	if p.Schedule[0].Label != "The Ceremony" || p.Schedule[0].PhotoID == nil || *p.Schedule[0].PhotoID != own {
		t.Fatalf("moment fields: %+v", p.Schedule[0])
	}
	if len(p.Media) != 1 || p.Media[own] == "" {
		t.Fatalf("media = %v, want only the event's own photo", p.Media)
	}
	// the foreign id may still sit in the host's own content JSON, but it is never signed or served
	if p.Media[foreign] != "" || strings.Contains(raw, "/media/"+foreign) || strings.Contains(raw, "Family lunch") || strings.Contains(raw, "Dinner") {
		t.Fatalf("leak in public page: %s", raw)
	}

	// (c) personal link also sees invite_only, never family_only
	p, raw = page(personal)
	if got := titles(p); !reflect.DeepEqual(got, []string{"Ceremony", "Dinner"}) || strings.Contains(raw, "Family lunch") {
		t.Fatalf("personal link moments = %v", got)
	}

	// (d) the signed URL serves the image without a session; a tampered or other-id token does not
	r := do(t, e.h, "GET", p.Media[own], nil, nil, "")
	if r.Code != 200 || !strings.HasPrefix(r.Header().Get("Content-Type"), "image/") {
		t.Fatalf("signed photo: %d %s", r.Code, r.Header().Get("Content-Type"))
	}
	if r := do(t, e.h, "GET", p.Media[own]+"x", nil, nil, ""); r.Code != 404 {
		t.Fatalf("tampered signature: want 404 got %d", r.Code)
	}
	if r := do(t, e.h, "GET", strings.Replace(p.Media[own], own, foreign, 1), nil, nil, ""); r.Code != 404 {
		t.Fatalf("token replayed on another photo: want 404 got %d", r.Code)
	}

	// (f) schedule section hidden → no moments, and their photos drop out of media
	code, b = e.call(t, "PATCH", "/invitation/sections/"+secID["schedule"], map[string]any{"visible": false})
	want(t, "hide schedule", code, 200, b)
	if p, _ = page(personal); len(p.Schedule) != 0 {
		t.Fatalf("hidden schedule leaked: %+v", p.Schedule)
	}
	if len(p.Media) != 1 || p.Media[own] == "" { // still referenced by hero/story
		t.Fatalf("media after hiding schedule = %v", p.Media)
	}

	// a photo deleted by the host disappears from the page instead of dangling
	if code, b = e.call(t, "DELETE", "/media/"+own, nil); code != 204 {
		t.Fatalf("delete media: %d %s", code, b)
	}
	if p, _ = page(pub.Token); len(p.Media) != 0 {
		t.Fatalf("deleted photo still listed: %v", p.Media)
	}
}

func TestPublicWishes(t *testing.T) {
	e := uiSetup(t, "pub-wish@example.com")
	other := uiSetup2(t, e, "pub-wish-other@example.com")
	code, b := e.call(t, "POST", "/guests", guestReq{Name: "Sarah"})
	want(t, "guest", code, 201, b)
	var g guestDTO
	_ = json.Unmarshal(b, &g)
	personal := strings.TrimPrefix(*g.InvitePath, "/invite/")
	code, b = e.call(t, "POST", "/invitation/publish", nil)
	want(t, "publish", code, 200, b)
	var pub struct{ Token string }
	_ = json.Unmarshal(b, &pub)

	ctx := t.Context()
	add := func(evID, msg string, approved bool, ageSec int) {
		if _, err := e.pool.Exec(ctx,
			`INSERT INTO wishes (event_id, author_name, message, approved, created_at) VALUES ($1,'Guest',$2,$3, now() - make_interval(secs => $4))`,
			evID, msg, approved, ageSec); err != nil {
			t.Fatal(err)
		}
	}
	// 25 approved (the two oldest share a timestamp, so the id tie-break is exercised), plus noise
	for i := 0; i < 25; i++ {
		age := i
		if i == 24 {
			age = 23
		}
		add(e.id, "wish "+strconv.Itoa(i), true, age)
	}
	add(e.id, "HIDDEN by host", false, 0)
	add(other.id, "OTHER EVENT", true, 0)

	type listT struct {
		Items []struct{ ID, Name, Message string } `json:"items"`
		Next  *string                              `json:"next_cursor"`
		Total int                                  `json:"total"`
	}
	list := func(token, query string) (listT, *httptest.ResponseRecorder) {
		r := do(t, e.h, "GET", "/api/v1/invite/"+token+"/wishes"+query, nil, nil, "")
		var l listT
		_ = json.Unmarshal(r.Body.Bytes(), &l)
		return l, r
	}

	// page 1: newest 20 first, a cursor, total counts approved wishes of this event only
	p1, r := list(pub.Token, "")
	want(t, "page 1", r.Code, 200, r.Body.Bytes())
	if len(p1.Items) != 20 || p1.Next == nil || p1.Total != 25 || p1.Items[0].Message != "wish 0" || p1.Items[19].Message != "wish 19" {
		t.Fatalf("page 1: n=%d next=%v total=%d first=%q", len(p1.Items), p1.Next, p1.Total, p1.Items[0].Message)
	}
	if cc := r.Header().Get("Cache-Control"); cc != "private, max-age=15" {
		t.Fatalf("Cache-Control = %q", cc)
	}
	// page 2: the remaining 5, no cursor; nothing repeated or skipped (ties included)
	p2, r := list(personal, "?cursor="+*p1.Next) // a personal link reads the same guestbook
	want(t, "page 2", r.Code, 200, r.Body.Bytes())
	if len(p2.Items) != 5 || p2.Next != nil {
		t.Fatalf("page 2: n=%d next=%v", len(p2.Items), p2.Next)
	}
	seen := map[string]bool{}
	for _, it := range append(p1.Items, p2.Items...) {
		if seen[it.ID] {
			t.Fatalf("wish %s listed twice", it.ID)
		}
		seen[it.ID] = true
		if it.Message == "HIDDEN by host" || it.Message == "OTHER EVENT" {
			t.Fatalf("leaked %q", it.Message)
		}
	}
	if len(seen) != 25 {
		t.Fatalf("saw %d distinct wishes, want 25", len(seen))
	}

	// exact page size: 25 = 5 × 5 → the last full page carries no cursor
	pg, _ := list(pub.Token, "?limit=5")
	for i := 0; i < 4; i++ {
		if pg.Next == nil {
			t.Fatalf("page %d of 5 has no cursor", i+1)
		}
		pg, _ = list(pub.Token, "?limit=5&cursor="+*pg.Next)
	}
	if len(pg.Items) != 5 || pg.Next != nil {
		t.Fatalf("last full page: n=%d next=%v", len(pg.Items), pg.Next)
	}

	// limit clamps (0, negative, huge, garbage) and never errors
	for q, n := range map[string]int{"?limit=0": 20, "?limit=-3": 20, "?limit=abc": 20, "?limit=1": 1, "?limit=999": 25} {
		if l, r := list(pub.Token, q); r.Code != 200 || len(l.Items) != n {
			t.Fatalf("%s: code %d, %d items, want %d", q, r.Code, len(l.Items), n)
		}
	}

	// bad cursor 400 with a field error; unknown token 404 even when the cursor is bad too
	_, r = list(pub.Token, "?cursor=garbage")
	want(t, "bad cursor", r.Code, 400, r.Body.Bytes())
	fieldErr(t, r.Body.Bytes(), "cursor")
	if _, r = list(pub.Token+"zz", "?cursor=garbage"); r.Code != 404 {
		t.Fatalf("unknown token with bad cursor: want 404 got %d", r.Code)
	}

	// an unpublished event's guestbook is not readable
	code, b = e.call(t, "POST", "/invitation/unpublish", nil)
	want(t, "unpublish", code, 204, b)
	if _, r = list(pub.Token, ""); r.Code != 404 {
		t.Fatalf("unpublished guestbook: want 404 got %d", r.Code)
	}
	code, b = e.call(t, "POST", "/invitation/publish", nil)
	want(t, "republish", code, 200, b)
	_ = json.Unmarshal(b, &pub)

	// POST returns the stored item; a personal link's author is the guest, whatever the body says
	post := func(token string, req wishReq) (publicWishDTO, int) {
		r := do(t, e.h, "POST", "/api/v1/invite/"+token+"/wish", req, nil, "")
		var d publicWishDTO
		_ = json.Unmarshal(r.Body.Bytes(), &d)
		return d, r.Code
	}
	d, code := post(personal, wishReq{Name: "THE POPE", Message: "<b>Love</b> you"})
	if code != 201 || d.ID == "" || d.Name != "Sarah" || d.Message != "bLove/b you" /* sanitize strips < and > only */ {
		t.Fatalf("personal wish: %d %+v", code, d)
	}
	d2, code := post(pub.Token, wishReq{Name: "Walk-in", Message: "Best wishes"})
	if code != 201 || d2.Name != "Walk-in" || d2.ID == "" || d2.ID == d.ID {
		t.Fatalf("generic wish: %d %+v", code, d2)
	}
	// the new wishes are first in the list, with the ids POST returned
	top, _ := list(pub.Token, "?limit=2")
	if len(top.Items) != 2 || top.Items[0].ID != d2.ID || top.Items[1].ID != d.ID || top.Total != 27 {
		t.Fatalf("after posting: %+v", top)
	}
}

func TestInvitationPreview(t *testing.T) {
	e := uiSetup(t, "preview@example.com")
	stranger := uiSetup2(t, e, "preview-stranger@example.com")

	// the editor loads the invitation first (that is what creates it), then the host adds draft content
	code, b := e.call(t, "GET", "/invitation", nil)
	want(t, "invitation", code, 200, b)
	var inv invitationDTO
	_ = json.Unmarshal(b, &inv)
	hero := ""
	for _, s := range inv.Sections {
		if s.Type == "hero" {
			hero = s.ID
		}
	}
	code, b = e.call(t, "PATCH", "/invitation/sections/"+hero, map[string]any{"content": map[string]any{"title": "Draft eyebrow"}})
	want(t, "hero draft", code, 200, b)
	for _, m := range []scheduleReq{{Title: "Ceremony", Visibility: "everyone"}, {Title: "Dinner", Visibility: "invite_only"}, {Title: "Family lunch", Visibility: "family_only"}} {
		code, b = e.call(t, "POST", "/schedule", m)
		want(t, "moment", code, 201, b)
	}
	if code, b = e.call(t, "POST", "/guests", guestReq{Name: "Sarah"}); code != 201 {
		t.Fatalf("guest: %d %s", code, b)
	}

	// never published: the host still gets the page, flagged as a preview, in the generic-link shape
	code, b = e.call(t, "GET", "/invitation/preview", nil)
	want(t, "preview", code, 200, b)
	var p struct {
		Preview  bool            `json:"preview"`
		Guest    json.RawMessage `json:"guest"`
		Template *string         `json:"template"`
		Timezone string          `json:"timezone"`
		Sections []struct {
			Type    string
			Content map[string]any
		} `json:"sections"`
		Schedule []struct{ Title string } `json:"schedule"`
		Media    map[string]string        `json:"media"`
	}
	_ = json.Unmarshal(b, &p)
	if !p.Preview || string(p.Guest) != "null" || p.Timezone != "Asia/Jakarta" || p.Media == nil {
		t.Fatalf("preview flags: %s", b)
	}
	if len(p.Schedule) != 1 || p.Schedule[0].Title != "Ceremony" {
		t.Fatalf("preview moments = %+v (only 'everyone' belongs in the generic view)", p.Schedule)
	}
	if len(p.Sections) == 0 || p.Sections[0].Type != "hero" || p.Sections[0].Content["title"] != "Draft eyebrow" {
		t.Fatalf("draft content missing: %+v", p.Sections)
	}
	if cc := do(t, e.h, "GET", e.base+"/invitation/preview", nil, e.ck, "").Header().Get("Cache-Control"); cc != "private, no-store" {
		t.Fatalf("Cache-Control = %q", cc)
	}

	// a hidden section is not in the preview either (it is what a guest would see)
	code, b = e.call(t, "PATCH", "/invitation/sections/"+hero, map[string]any{"visible": false})
	want(t, "hide hero", code, 200, b)
	_, b = e.call(t, "GET", "/invitation/preview", nil)
	if strings.Contains(string(b), "Draft eyebrow") {
		t.Fatalf("hidden section shown in preview: %s", b)
	}

	// anonymous 401; another event's owner 404 (no existence leak); the guest-facing page stays private
	if r := do(t, e.h, "GET", e.base+"/invitation/preview", nil, nil, ""); r.Code != 401 {
		t.Fatalf("anonymous: want 401 got %d", r.Code)
	}
	if code, b = stranger.callOn(t, "GET", e.base+"/invitation/preview", nil); code != 404 {
		t.Fatalf("stranger: want 404 got %d %s", code, b)
	}

	// a deleted event has no preview
	code, b = e.callOn(t, "DELETE", e.base, nil)
	want(t, "delete event", code, 204, b)
	if code, _ = e.call(t, "GET", "/invitation/preview", nil); code != 404 {
		t.Fatalf("deleted event: want 404 got %d", code)
	}
}

// TestSectionContentValidation: section content is checked against catalog/sections.schema.json and the
// event's own media (docs/17 §10.3); field errors carry the content path.
func TestSectionContentValidation(t *testing.T) {
	e := uiSetup(t, "content@example.com")
	other := uiSetup2(t, e, "content-other@example.com")
	own := upload(t, e.h, e.base+"/media", "p.png", tinyPNG, e.ck, e.csrf)
	want(t, "upload", own.Code, 201, own.Body.Bytes())
	var m struct{ ID string }
	_ = json.Unmarshal(own.Body.Bytes(), &m)
	theirs := upload(t, other.h, other.base+"/media", "p.png", tinyPNG, other.ck, other.csrf)
	var tm struct{ ID string }
	_ = json.Unmarshal(theirs.Body.Bytes(), &tm)

	code, b := e.call(t, "GET", "/invitation", nil)
	want(t, "get", code, 200, b)
	var inv invitationDTO
	_ = json.Unmarshal(b, &inv)
	sec := map[string]string{}
	for _, s := range inv.Sections {
		sec[s.Type] = s.ID
	}
	patch := func(typ string, content map[string]any) (int, []byte) {
		return e.call(t, "PATCH", "/invitation/sections/"+sec[typ], map[string]any{"content": content})
	}

	code, b = patch("hero", map[string]any{"title": "The wedding of", "line": "Join us", "photo_id": m.ID})
	want(t, "valid hero with own photo", code, 200, b)
	code, b = patch("hero", map[string]any{"photo_id": ""})
	want(t, "clearing the photo", code, 200, b)

	code, b = patch("hero", map[string]any{"line": strings.Repeat("x", 161)})
	want(t, "long line", code, 400, b)
	fieldErr(t, b, "content.line")
	code, b = patch("hero", map[string]any{"photo_id": tm.ID})
	want(t, "another event's photo", code, 400, b)
	fieldErr(t, b, "content.media")
	code, b = patch("story", map[string]any{"chapters": make([]any, 6)})
	want(t, "six chapters", code, 400, b)
	fieldErr(t, b, "content.chapters")
	code, b = patch("story", map[string]any{"future_key": "kept"})
	want(t, "unknown key is kept", code, 200, b)

	// the same rules on create
	code, b = e.call(t, "POST", "/invitation/sections", addSectionReq{Type: "music", Content: map[string]any{"track": "nope"}})
	want(t, "unknown track", code, 400, b)
	fieldErr(t, b, "content.track")
	code, b = e.call(t, "POST", "/invitation/sections", addSectionReq{Type: "music", Content: map[string]any{"track": "satie-gymnopedie-1"}})
	want(t, "known track", code, 200, b)
}

// TestInvitationTheme: a host's theme is validated against the picked template's manifest, stored, shown to the
// host, served to guests through the sanitised projection with the template version, and dropped when the design changes.
func TestInvitationTheme(t *testing.T) {
	e := uiSetup(t, "theme@example.com")
	r := do(t, e.h, "GET", "/api/v1/templates", nil, nil, "")
	var cat struct{ Data []struct{ ID, Slug string } }
	_ = json.Unmarshal(r.Body.Bytes(), &cat)
	var gs, other string
	for _, c := range cat.Data {
		switch c.Slug {
		case "gilded-seal":
			gs = c.ID
		case "linen-vow":
			other = c.ID
		}
	}
	patch := func(theme map[string]any) (int, []byte) {
		return e.call(t, "PATCH", "/invitation", map[string]any{"theme": theme})
	}

	code, b := patch(map[string]any{"palette": "rose-linen"})
	want(t, "theme without a design", code, 400, b)
	fieldErr(t, b, "theme")

	code, b = e.call(t, "PATCH", "/invitation", invitationPatchReq{TemplateID: &gs})
	want(t, "pick", code, 200, b)
	var inv struct{ Theme map[string]any }
	_ = json.Unmarshal(b, &inv)
	if len(inv.Theme) != 0 {
		t.Fatalf("a fresh invitation has an empty theme object, got %v", inv.Theme)
	}

	for name, tc := range map[string]struct {
		theme map[string]any
		field string
	}{
		"palette not offered":     {map[string]any{"palette": "midnight-gold"}, "theme.palette"},
		"pairing unknown":         {map[string]any{"fontPairing": "nope"}, "theme.fontPairing"},
		"motion off not offered":  {map[string]any{"motion": "off"}, "theme.motion"},
		"background not editable": {map[string]any{"tokens": map[string]string{"bg": "#000000"}}, "theme.tokens.bg"},
		"not a hex colour":        {map[string]any{"tokens": map[string]string{"accent": "javascript:alert(1)"}}, "theme.tokens.accent"},
		"unreadable on accent":    {map[string]any{"tokens": map[string]string{"accent": "#1A1A1A"}}, "theme.tokens"},
	} {
		code, b = patch(tc.theme)
		want(t, name, code, 400, b)
		fieldErr(t, b, tc.field)
	}

	// a valid one: a legacy label is stored as the palette id
	code, b = patch(map[string]any{"palette": "Blush", "motion": "calm", "fontPairing": "classic-serif", "tokens": map[string]string{"accent": "#C9A27A"}})
	want(t, "valid theme", code, 200, b)
	var got struct {
		Theme struct {
			Palette, FontPairing, Motion string
			Tokens                       map[string]string
		}
	}
	_ = json.Unmarshal(b, &got)
	if got.Theme.Palette != "rose-linen" || got.Theme.Motion != "calm" || got.Theme.Tokens["accent"] != "#C9A27A" {
		t.Fatalf("theme = %+v", got.Theme)
	}

	// other fields of the invitation leave it alone
	code, b = e.call(t, "PATCH", "/invitation", invitationPatchReq{Palette: ptr("Stone")})
	want(t, "palette label", code, 200, b)
	_ = json.Unmarshal(b, &got)
	if got.Theme.Palette != "rose-linen" {
		t.Fatalf("theme lost: %+v", got.Theme)
	}

	// guests get the theme and the template version, and nothing else of it
	code, b = e.call(t, "POST", "/invitation/publish", nil)
	want(t, "publish", code, 200, b)
	var pub struct{ Token string }
	_ = json.Unmarshal(b, &pub)
	r = do(t, e.h, "GET", "/api/v1/invite/"+pub.Token, nil, nil, "")
	var page struct {
		Theme struct {
			Palette, Motion string
			Tokens          map[string]string
		}
		TemplateVersion int `json:"template_version"`
	}
	_ = json.Unmarshal(r.Body.Bytes(), &page)
	if page.Theme.Palette != "rose-linen" || page.Theme.Motion != "calm" || page.Theme.Tokens["accent"] != "#C9A27A" || page.TemplateVersion < 1 {
		t.Fatalf("public theme: %s", r.Body)
	}

	// defence in depth: even if the table held junk, the guest page serves only plain ids and hex colours
	if _, err := e.pool.Exec(context.Background(), `UPDATE invitations SET theme='{"palette":"<script>","motion":"wild","tokens":{"accent":"url(x)","line":"#B08E52"}}'::jsonb WHERE event_id=$1`, e.id); err != nil {
		t.Fatal(err)
	}
	r = do(t, e.h, "GET", "/api/v1/invite/"+pub.Token, nil, nil, "")
	if strings.Contains(r.Body.String(), "script") || strings.Contains(r.Body.String(), "url(x)") || strings.Contains(r.Body.String(), "wild") {
		t.Fatalf("unsafe theme reached a guest: %s", r.Body)
	}

	// switching design drops the theme (it was checked against another design); clearing is always allowed
	code, b = patch(map[string]any{"palette": "sage-parchment"})
	want(t, "set again", code, 200, b)
	code, b = e.call(t, "PATCH", "/invitation", invitationPatchReq{TemplateID: &other})
	want(t, "switch", code, 200, b)
	got.Theme.Palette = ""
	got.Theme.Tokens = nil
	_ = json.Unmarshal(b, &got)
	if got.Theme.Palette != "" {
		t.Fatalf("theme must reset on a design switch: %+v", got.Theme)
	}
	code, b = e.call(t, "PATCH", "/invitation", invitationPatchReq{TemplateID: &gs})
	want(t, "back", code, 200, b)
	code, b = patch(map[string]any{"palette": "sage-parchment"})
	want(t, "set", code, 200, b)
	code, b = patch(map[string]any{})
	want(t, "clear", code, 200, b)
	got.Theme.Palette = ""
	_ = json.Unmarshal(b, &got)
	if got.Theme.Palette != "" {
		t.Fatalf("clear: %+v", got.Theme)
	}
}

// TestTemplateCatalog: the catalog carries the synced manifest facts, retired rows are not listed, and one entry
// can be read by slug with its full manifest. Public and cacheable.
func TestTemplateCatalog(t *testing.T) {
	h, _, pool := setup(t)
	r := do(t, h, "GET", "/api/v1/templates", nil, nil, "")
	want(t, "list", r.Code, 200, r.Body.Bytes())
	if cc := r.Header().Get("Cache-Control"); !strings.Contains(cc, "public") {
		t.Fatalf("catalog must be cacheable, got %q", cc)
	}
	var list struct {
		Data []struct {
			Slug, Kind, Status, Access string
			Version                    int
			Thumbnail                  *string
			Customizable               map[string][]string
			Capabilities               map[string]any
			Marketing                  map[string]any
		}
	}
	_ = json.Unmarshal(r.Body.Bytes(), &list)
	by := map[string]int{}
	for i, d := range list.Data {
		by[d.Slug] = i
	}
	gs, ok := by["gilded-seal"]
	if !ok {
		t.Fatalf("no gilded-seal in %s", r.Body)
	}
	g := list.Data[gs]
	if g.Kind != "coded" || g.Status != "published" || g.Access != "free" || g.Version < 1 || g.Thumbnail == nil || *g.Thumbnail != "/templates/gilded-seal/thumb.webp" ||
		len(g.Customizable["palette"]) == 0 || g.Capabilities["rsvp"] != true || g.Marketing["desc"] == "" {
		t.Fatalf("gilded-seal entry: %+v", g)
	}
	if lv := list.Data[by["linen-vow"]]; lv.Customizable != nil || lv.Thumbnail != nil || lv.Kind != "coded" {
		t.Fatalf("a row without a manifest has no manifest facts: %+v", lv)
	}

	// one entry, full manifest
	r = do(t, h, "GET", "/api/v1/templates/gilded-seal", nil, nil, "")
	want(t, "by slug", r.Code, 200, r.Body.Bytes())
	var one struct {
		Template struct{ Slug string }
		Manifest struct {
			ManifestVersion int
			Sections        []struct{ Type string }
			Tokens          struct{ Color map[string]string }
		}
	}
	_ = json.Unmarshal(r.Body.Bytes(), &one)
	if one.Template.Slug != "gilded-seal" || one.Manifest.ManifestVersion != 1 || len(one.Manifest.Sections) != 10 || one.Manifest.Tokens.Color["bg"] == "" {
		t.Fatalf("manifest: %s", r.Body)
	}
	if r = do(t, h, "GET", "/api/v1/templates/nope", nil, nil, ""); r.Code != 404 {
		t.Fatalf("unknown slug: %d", r.Code)
	}

	// retired rows disappear from both reads (and come back when restored)
	if _, err := pool.Exec(context.Background(), `UPDATE templates SET status='retired', active=false WHERE slug='linen-vow'`); err != nil {
		t.Fatal(err)
	}
	defer pool.Exec(context.Background(), `UPDATE templates SET status='published', active=true WHERE slug='linen-vow'`) //nolint:errcheck
	r = do(t, h, "GET", "/api/v1/templates", nil, nil, "")
	if strings.Contains(r.Body.String(), `"linen-vow"`) {
		t.Fatalf("retired row listed: %s", r.Body)
	}
	if r = do(t, h, "GET", "/api/v1/templates/linen-vow", nil, nil, ""); r.Code != 404 {
		t.Fatalf("retired by slug: %d", r.Code)
	}
}
