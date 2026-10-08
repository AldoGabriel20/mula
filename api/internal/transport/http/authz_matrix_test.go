package http

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"regexp"
	"sort"
	"strings"
	"testing"
	"time"
)

// tier is the minimum role class a route requires (mirrors router.go's middleware chain).
type tier int

const (
	tMember tier = iota // any member: owner, cohost, planner, family, usher
	tStaff              // editors + usher (check-in)
	tEditor             // owner, cohost, planner
	tOwner              // owner only
)

func (t tier) allows(role string) bool {
	switch t {
	case tMember:
		return true
	case tStaff:
		return role != "family"
	case tEditor:
		return role == "owner" || role == "cohost" || role == "planner"
	case tOwner:
		return role == "owner"
	}
	return false
}

// policy is the EXPECTED authorization tier for every event-scoped route. It is checked
// against the router's own registrations (see TestAuthzMatrixCoversEveryRoute), so adding a
// route without deciding its tier here fails the build.
var policy = map[string]tier{
	"GET /api/v1/events/{id}":                              tMember,
	"PATCH /api/v1/events/{id}":                            tEditor,
	"DELETE /api/v1/events/{id}":                           tOwner,
	"GET /api/v1/events/{id}/overview":                     tMember,
	"POST /api/v1/events/{id}/notes/{key}/dismiss":         tMember,
	"GET /api/v1/events/{id}/guests":                       tMember,
	"POST /api/v1/events/{id}/guests":                      tEditor,
	"GET /api/v1/events/{id}/guests/segments":              tMember,
	"POST /api/v1/events/{id}/guests/import":               tEditor,
	"GET /api/v1/events/{id}/guests/{gid}":                 tEditor,
	"PATCH /api/v1/events/{id}/guests/{gid}":               tEditor,
	"DELETE /api/v1/events/{id}/guests/{gid}":              tEditor,
	"GET /api/v1/events/{id}/groups":                       tEditor,
	"POST /api/v1/events/{id}/groups":                      tEditor,
	"GET /api/v1/events/{id}/invitation":                   tMember,
	"PATCH /api/v1/events/{id}/invitation":                 tEditor,
	"POST /api/v1/events/{id}/invitation/sections":         tEditor,
	"POST /api/v1/events/{id}/invitation/sections/reorder": tEditor,
	"PATCH /api/v1/events/{id}/invitation/sections/{sid}":  tEditor,
	"DELETE /api/v1/events/{id}/invitation/sections/{sid}": tEditor,
	"POST /api/v1/events/{id}/invitation/publish":          tEditor,
	"POST /api/v1/events/{id}/invitation/unpublish":        tEditor,
	"GET /api/v1/events/{id}/schedule":                     tMember,
	"POST /api/v1/events/{id}/schedule":                    tEditor,
	"POST /api/v1/events/{id}/schedule/reorder":            tEditor,
	"GET /api/v1/events/{id}/schedule.ics":                 tMember,
	"PATCH /api/v1/events/{id}/schedule/{sid}":             tEditor,
	"DELETE /api/v1/events/{id}/schedule/{sid}":            tEditor,
	"GET /api/v1/events/{id}/tasks":                        tMember,
	"POST /api/v1/events/{id}/tasks":                       tEditor,
	"PATCH /api/v1/events/{id}/tasks/{tid}":                tEditor,
	"DELETE /api/v1/events/{id}/tasks/{tid}":               tEditor,
	"GET /api/v1/events/{id}/checkin":                      tStaff,
	"POST /api/v1/events/{id}/checkin":                     tStaff,
	"GET /api/v1/events/{id}/eventday":                     tMember,
	"GET /api/v1/events/{id}/live":                         tEditor,
	"PATCH /api/v1/events/{id}/live":                       tEditor,
	"GET /api/v1/events/{id}/gifts":                        tMember,
	"POST /api/v1/events/{id}/gifts":                       tEditor,
	"PATCH /api/v1/events/{id}/gifts/{gid}":                tEditor,
	"DELETE /api/v1/events/{id}/gifts/{gid}":               tEditor,
	"GET /api/v1/events/{id}/transactions":                 tMember,
	"GET /api/v1/events/{id}/wishes":                       tMember,
	"PATCH /api/v1/events/{id}/wishes/{wid}":               tEditor,
	"GET /api/v1/events/{id}/media":                        tMember,
	"POST /api/v1/events/{id}/media":                       tEditor,
	"GET /api/v1/events/{id}/media/{mid}/file":             tMember,
	"POST /api/v1/events/{id}/guests/{gid}/resend":         tEditor,
	"GET /api/v1/events/{id}/gift-methods":                 tMember,
	"POST /api/v1/events/{id}/gift-methods":                tEditor,
	"POST /api/v1/events/{id}/gift-methods/reorder":        tEditor,
	"PATCH /api/v1/events/{id}/gift-methods/{mid}":         tEditor,
	"DELETE /api/v1/events/{id}/gift-methods/{mid}":        tEditor,
	"GET /api/v1/events/{id}/members":                      tMember,
	"POST /api/v1/events/{id}/members":                     tOwner,
	"PATCH /api/v1/events/{id}/members/{mid}":              tOwner,
	"DELETE /api/v1/events/{id}/members/{mid}":             tOwner,
	"GET /api/v1/events/{id}/activity":                     tMember,
	"DELETE /api/v1/events/{id}/media/{mid}":               tEditor,
}

// routeRe finds event-scoped registrations in router.go.
var routeRe = regexp.MustCompile(`"((?:GET|POST|PATCH|PUT|DELETE) /api/v1/events/\{id\}[^"]*)"`)

// TestAuthzMatrixCoversEveryRoute: the router and the policy table must list exactly the
// same event-scoped routes. A new route (or a removed one) fails until the table is updated
// — so no event-scoped endpoint can ship without an explicit authorization decision.
func TestAuthzMatrixCoversEveryRoute(t *testing.T) {
	src, err := os.ReadFile("router.go")
	if err != nil {
		t.Fatal(err)
	}
	inRouter := map[string]bool{}
	for _, m := range routeRe.FindAllStringSubmatch(string(src), -1) {
		inRouter[m[1]] = true
	}
	var missing, stale []string
	for r := range inRouter {
		if _, ok := policy[r]; !ok {
			missing = append(missing, r)
		}
	}
	for r := range policy {
		if !inRouter[r] {
			stale = append(stale, r)
		}
	}
	sort.Strings(missing)
	sort.Strings(stale)
	if len(missing) > 0 {
		t.Errorf("routes registered in router.go but missing from the authz policy table (decide their tier!):\n  %s", strings.Join(missing, "\n  "))
	}
	if len(stale) > 0 {
		t.Errorf("policy table lists routes the router no longer registers:\n  %s", strings.Join(stale, "\n  "))
	}
	if len(inRouter) < 40 {
		t.Fatalf("route regexp found only %d routes — parser broken", len(inRouter))
	}
}

// TestAuthzMatrix exercises every event-scoped route as: anonymous, a stranger (valid user,
// not a member), and each of the five member roles — asserting the exact allow/deny result.
func TestAuthzMatrix(t *testing.T) {
	h, _, pool := setup(t)

	// ---- fixtures: one event owned by `owner`, with real child resources ----
	ownerCk, ownerCsrf := registerLogin(t, h, "mx-owner@example.com")
	verifyUser(t, h, pool, "mx-owner@example.com")
	rr := do(t, h, "POST", "/api/v1/events", createEventReq{Type: "wedding", CoupleA: ptr("A"), CoupleB: ptr("B")}, ownerCk, ownerCsrf)
	var ev eventDTO
	_ = json.Unmarshal(rr.Body.Bytes(), &ev)
	base := "/api/v1/events/" + ev.ID

	mustID := func(r interface{ Bytes() []byte }, what string) string {
		var v struct {
			ID string `json:"id"`
		}
		if err := json.Unmarshal(r.Bytes(), &v); err != nil || v.ID == "" {
			t.Fatalf("fixture %s: no id in %s", what, r.Bytes())
		}
		return v.ID
	}
	gid := mustID(do(t, h, "POST", base+"/guests", guestReq{Name: "G"}, ownerCk, ownerCsrf).Body, "guest")
	var wid string
	if err := pool.QueryRow(context.Background(), `INSERT INTO wishes (event_id, author_name, message) VALUES ($1,'W','m') RETURNING id`, ev.ID).Scan(&wid); err != nil {
		t.Fatal(err)
	}

	type actor struct {
		name string
		ck   []*http.Cookie
		csrf string
	}
	actors := []actor{{"owner", ownerCk, ownerCsrf}}
	for _, role := range []string{"cohost", "planner", "family", "usher"} {
		email := "mx-" + role + "@example.com"
		ck, cs := registerLogin(t, h, email)
		addMember(t, pool, ev.ID, userID(t, pool, email), email, role)
		actors = append(actors, actor{role, ck, cs})
	}
	strangerCk, strangerCsrf := registerLogin(t, h, "mx-stranger@example.com")

	memberSeq := 0
	// fresh creates a brand-new sub-resource (as the owner) so destructive routes (DELETE) and
	// state-changing ones never starve later checks of their fixture. Returns its id.
	fresh := func(route string) string {
		switch {
		case strings.Contains(route, "/guests/{gid}"):
			return mustID(do(t, h, "POST", base+"/guests", guestReq{Name: "tmp"}, ownerCk, ownerCsrf).Body, "tmp guest")
		case strings.Contains(route, "/tasks/{tid}"):
			return mustID(do(t, h, "POST", base+"/tasks", taskReq{Title: "tmp"}, ownerCk, ownerCsrf).Body, "tmp task")
		case strings.Contains(route, "/schedule/{sid}"):
			return mustID(do(t, h, "POST", base+"/schedule", scheduleReq{Title: "tmp"}, ownerCk, ownerCsrf).Body, "tmp schedule")
		case strings.Contains(route, "/gifts/{gid}"):
			return mustID(do(t, h, "POST", base+"/gifts", giftReq{Title: "tmp"}, ownerCk, ownerCsrf).Body, "tmp gift")
		case strings.Contains(route, "/invitation/sections/{sid}"):
			var inv invitationDTO
			_ = json.Unmarshal(do(t, h, "POST", base+"/invitation/sections", addSectionReq{Type: "story"}, ownerCk, ownerCsrf).Body.Bytes(), &inv)
			return inv.Sections[len(inv.Sections)-1].ID
		case strings.Contains(route, "/gift-methods/{mid}"):
			return mustID(do(t, h, "POST", base+"/gift-methods", methodReq{Type: "bank", Title: "tmp"}, ownerCk, ownerCsrf).Body, "tmp gift method")
		case strings.Contains(route, "/members/{mid}"):
			memberSeq++
			return mustID(do(t, h, "POST", base+"/members", memberReq{Email: fmt.Sprintf("mx-tmp-%d@example.com", memberSeq), Role: "family"}, ownerCk, ownerCsrf).Body, "tmp member")
		case strings.Contains(route, "/media/{mid}"):
			return mustID(upload(t, h, base+"/media", "p.png", tinyPNG, ownerCk, ownerCsrf).Body, "tmp media")
		}
		return ""
	}
	fill := func(route string) (method, path string) {
		method, path, _ = strings.Cut(route, " ")
		id := fresh(route) // "" for routes without a sub-resource id
		r := strings.NewReplacer("{id}", ev.ID, "{wid}", wid, "{key}", "details")
		path = r.Replace(path)
		for _, ph := range []string{"{gid}", "{tid}", "{sid}", "{mid}"} {
			if strings.Contains(path, ph) {
				path = strings.Replace(path, ph, id, 1)
			}
		}
		return
	}
	// body that is valid enough to reach (and pass) validation, so an ALLOWED actor does
	// not trip a 400 before authz is even the question. Allowed ⇒ anything except 401/403.
	bodyFor := func(method, route string) any {
		if method == "GET" || method == "DELETE" {
			return nil
		}
		switch {
		case strings.HasSuffix(route, "/guests"):
			return guestReq{Name: "X"}
		case strings.HasSuffix(route, "/guests/import"):
			return importReq{Guests: []guestReq{{Name: "I"}}}
		case strings.HasSuffix(route, "/groups"):
			return groupReq{Name: "Grp"}
		case strings.HasSuffix(route, "/tasks"):
			return taskReq{Title: "X"}
		case strings.HasSuffix(route, "/schedule"):
			return scheduleReq{Title: "X"}
		case strings.HasSuffix(route, "/gifts"):
			return giftReq{Title: "X"}
		case strings.HasSuffix(route, "/gift-methods"):
			return methodReq{Type: "wallet", Title: "X"}
		case strings.HasSuffix(route, "/members"):
			return memberReq{Email: fmt.Sprintf("mx-new-%d@example.com", time.Now().UnixNano()), Role: "usher"}
		case strings.HasSuffix(route, "/members/{mid}"):
			return memberPatchReq{Role: "planner"}
		case strings.HasSuffix(route, "/checkin"):
			return checkinReq{GuestID: gid}
		case strings.HasSuffix(route, "/invitation/sections"):
			return addSectionReq{Type: "story"}
		case strings.HasSuffix(route, "/reorder"):
			return reorderReq{Order: []string{}}
		case strings.HasSuffix(route, "/wishes/{wid}"):
			return wishApproveReq{Approved: true}
		case strings.HasSuffix(route, "/live"):
			return livePatchReq{Status: ptr("offline")}
		}
		return map[string]any{} // PATCH with no fields is a valid no-op for these resources
	}

	// DELETE /events/{id} and unpublish/publish mutate shared fixtures → run destructive last
	// and only for allowed actors where order matters; the matrix itself is stateless enough
	// (allowed = "not 401/403") but deleting the event would turn later checks into 404s.
	var routes []string
	for r := range policy {
		routes = append(routes, r)
	}
	sort.Strings(routes)
	destructiveLast := func(r string) int {
		if r == "DELETE /api/v1/events/{id}" {
			return 1
		}
		return 0
	}
	sort.SliceStable(routes, func(i, j int) bool { return destructiveLast(routes[i]) < destructiveLast(routes[j]) })

	for _, route := range routes {
		method, _ := fill(route) // (path is rebuilt per request below so each gets its own resource)
		need := policy[route]
		isWrite := method != "GET"
		body := bodyFor(method, route)

		// 1) anonymous → 401 (never a data/shape leak)
		_, path := fill(route)
		if r := do(t, h, method, path, body, nil, ""); r.Code != 401 {
			t.Errorf("%-62s anonymous: want 401 got %d", route, r.Code)
		}
		// 2) stranger (authenticated, NOT a member) → 404 for every route (IDOR: no existence leak).
		//    Writes carry a valid CSRF token so CSRF isn't what produces the status.
		csrfTok := ""
		if isWrite {
			csrfTok = strangerCsrf
		}
		_, path = fill(route)
		if r := do(t, h, method, path, body, strangerCk, csrfTok); r.Code != 404 {
			t.Errorf("%-62s stranger:   want 404 got %d (%s)", route, r.Code, strings.TrimSpace(r.Body.String()))
		}
		// 3) each member role: allowed ⇒ not 401/403/csrf; denied ⇒ exactly 403
		if route == "DELETE /api/v1/events/{id}" {
			continue // handled below, after every other route has been checked
		}
		for _, a := range actors {
			csrfTok := ""
			if isWrite {
				csrfTok = a.csrf
			}
			_, path = fill(route) // own resource: a successful DELETE must not starve the next actor
			r := do(t, h, method, path, body, a.ck, csrfTok)
			if need.allows(a.name) {
				if r.Code == 401 || r.Code == 403 || r.Code == 404 {
					t.Errorf("%-62s %-7s: should be ALLOWED, got %d (%s)", route, a.name, r.Code, strings.TrimSpace(r.Body.String()))
				}
			} else if r.Code != 403 {
				t.Errorf("%-62s %-7s: should be DENIED 403, got %d", route, a.name, r.Code)
			}
		}
	}

	// DELETE /events/{id}: every non-owner role gets 403, then the owner may delete.
	for _, a := range actors {
		if a.name == "owner" {
			continue
		}
		if r := do(t, h, "DELETE", base, nil, a.ck, a.csrf); r.Code != 403 {
			t.Errorf("DELETE event as %s: want 403 got %d", a.name, r.Code)
		}
	}
	if r := do(t, h, "DELETE", base, nil, ownerCk, ownerCsrf); r.Code != 204 {
		t.Errorf("DELETE event as owner: want 204 got %d", r.Code)
	}
}

// TestCSRFRequiredOnEveryWrite: every non-GET event route must reject a cookie-authenticated
// request that lacks the CSRF header (403 csrf_failed), even for the owner.
func TestCSRFRequiredOnEveryWrite(t *testing.T) {
	h, _, _ := setup(t)
	ck, csrf := registerLogin(t, h, "csrf-owner@example.com")
	rr := do(t, h, "POST", "/api/v1/events", createEventReq{Type: "wedding"}, ck, csrf)
	var ev eventDTO
	_ = json.Unmarshal(rr.Body.Bytes(), &ev)
	z := "00000000-0000-0000-0000-000000000000"
	r := strings.NewReplacer("{id}", ev.ID, "{gid}", z, "{tid}", z, "{sid}", z, "{wid}", z, "{mid}", z, "{key}", "details")
	n := 0
	for route := range policy {
		method, path, _ := strings.Cut(route, " ")
		if method == "GET" {
			continue
		}
		n++
		resp := do(t, h, method, r.Replace(path), map[string]any{}, ck, "") // no X-CSRF-Token
		if resp.Code != 403 || !strings.Contains(resp.Body.String(), "csrf_failed") {
			t.Errorf("%s without CSRF: want 403 csrf_failed, got %d %s", route, resp.Code, strings.TrimSpace(resp.Body.String()))
		}
	}
	if n < 20 {
		t.Fatalf("only %d write routes checked", n)
	}
}
