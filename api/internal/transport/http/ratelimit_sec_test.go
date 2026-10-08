package http

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/mula/mula/internal/platform/clientip"
)

// loginFrom posts a bad login with a chosen TCP peer and X-Forwarded-For.
func loginFrom(h http.Handler, peer, xff string) int {
	b, _ := json.Marshal(loginReq{Email: "nobody@example.com", Password: "wrong-wrong"})
	r := httptest.NewRequest("POST", "/api/v1/auth/login", bytes.NewReader(b))
	r.RemoteAddr = peer + ":5555"
	if xff != "" {
		r.Header.Set("X-Forwarded-For", xff)
	}
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, r)
	return rr.Code
}

func exhaust(h http.Handler, peer, xff string) {
	for i := 0; i < 30; i++ {
		if loginFrom(h, peer, xff) == 429 {
			return
		}
	}
}

// Behind a trusted proxy (Next /api rewrite) one abusive client must not lock out everyone else.
func TestRateLimitIsPerClientBehindTrustedProxy(t *testing.T) {
	ipr, _ := clientip.Parse("10.0.0.0/8")
	h, _, _ := setupWith(t, func(d *Deps) { d.AuthRatePerMin, d.AuthRateBurst, d.ClientIP = 0, 0, ipr })
	exhaust(h, "10.0.0.1", "203.0.113.1")
	if c := loginFrom(h, "10.0.0.1", "203.0.113.1"); c != 429 {
		t.Fatalf("client A should be limited, got %d", c)
	}
	if c := loginFrom(h, "10.0.0.1", "203.0.113.2"); c == 429 {
		t.Fatal("client B behind the same proxy was rate-limited by client A")
	}
}

// A forged X-Forwarded-For from an untrusted peer must not buy a fresh bucket.
func TestForgedXFFIgnoredFromUntrustedPeer(t *testing.T) {
	ipr, _ := clientip.Parse("10.0.0.0/8")
	h, _, _ := setupWith(t, func(d *Deps) { d.AuthRatePerMin, d.AuthRateBurst, d.ClientIP = 0, 0, ipr })
	exhaust(h, "198.51.100.9", "")
	if c := loginFrom(h, "198.51.100.9", "1.2.3.4"); c != 429 {
		t.Fatalf("forged XFF evaded the limiter, got %d", c)
	}
}

// Heavy endpoints (password change) get a tight per-user limit.
func TestHeavyRouteRateLimited(t *testing.T) {
	h, _, _ := setupWith(t, func(d *Deps) { d.AuthRatePerMin, d.AuthRateBurst = 0, 0 })
	// registerLogin hits the (default, per-IP) auth limiter only a couple of times.
	ck, csrf := registerLogin(t, h, "heavy@example.com")
	got429 := -1
	for i := 0; i < 10; i++ {
		rr := do(t, h, "POST", "/api/v1/me/password", changePasswordReq{Current: "wrong-wrong-1", New: "another-pass-123"}, ck, csrf)
		if rr.Code == 429 {
			got429 = i
			break
		}
	}
	if got429 != 5 { // heavy burst is 5
		t.Fatalf("expected 6th attempt (index 5) limited, got %d", got429)
	}
}

// Every authenticated write passes the per-user write limiter (burst 60).
func TestWriteRoutesAreRateLimited(t *testing.T) {
	h, _, pool := setupWith(t, func(d *Deps) { d.AuthRatePerMin, d.AuthRateBurst = 0, 0 })
	ck, csrf := registerLogin(t, h, "writes@example.com")
	verifyUser(t, h, pool, "writes@example.com")
	limited := false
	for i := 0; i < 80 && !limited; i++ {
		limited = do(t, h, "PATCH", "/api/v1/me", map[string]string{"name": "X"}, ck, csrf).Code == 429
	}
	if !limited {
		t.Fatal("write limiter never tripped")
	}
}

func TestSecurityHeadersAndHSTS(t *testing.T) {
	for _, secure := range []bool{false, true} {
		h, _, _ := setupWith(t, func(d *Deps) { d.Secure = secure })
		rr := do(t, h, "GET", "/healthz", nil, nil, "")
		for _, k := range []string{"X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy"} {
			if rr.Header().Get(k) == "" {
				t.Fatalf("secure=%v missing %s", secure, k)
			}
		}
		if got := rr.Header().Get("Strict-Transport-Security") != ""; got != secure {
			t.Fatalf("HSTS present=%v want %v", got, secure)
		}
	}
}

// Changing or resetting a password must kill other sessions (stolen-cookie recovery).
func TestPasswordChangeRevokesOtherSessions(t *testing.T) {
	h, _, _ := setupWith(t, func(d *Deps) {})
	a, csrfA := registerLogin(t, h, "rev@example.com")
	login := do(t, h, "POST", "/api/v1/auth/login", loginReq{Email: "rev@example.com", Password: "supersecret1"}, nil, "")
	b := login.Result().Cookies() // second device
	if do(t, h, "GET", "/api/v1/me", nil, b, "").Code != 200 {
		t.Fatalf("second session should work, login=%d", login.Code)
	}
	rr := do(t, h, "POST", "/api/v1/me/password", changePasswordReq{Current: "supersecret1", New: "brand-new-pass-2"}, a, csrfA)
	if rr.Code != 204 {
		t.Fatalf("change password: %d %s", rr.Code, rr.Body)
	}
	if c := do(t, h, "GET", "/api/v1/me", nil, a, "").Code; c != 200 {
		t.Fatalf("current session must survive, got %d", c)
	}
	if c := do(t, h, "GET", "/api/v1/me", nil, b, "").Code; c != 401 {
		t.Fatalf("other session must be revoked, got %d", c)
	}
}

func TestPasswordResetRevokesAllSessions(t *testing.T) {
	h, mailer, _ := setupWith(t, func(d *Deps) {})
	a, _ := registerLogin(t, h, "rst@example.com")
	do(t, h, "POST", "/api/v1/auth/password/forgot", emailReq{Email: "rst@example.com"}, nil, "")
	tok := mailer.reset["rst@example.com"]
	if rr := do(t, h, "POST", "/api/v1/auth/password/reset", resetReq{Token: tok, Password: "brandnewpw9"}, nil, ""); rr.Code != 204 {
		t.Fatalf("reset: %d %s", rr.Code, rr.Body)
	}
	if c := do(t, h, "GET", "/api/v1/me", nil, a, "").Code; c != 401 {
		t.Fatalf("old session must die after reset, got %d", c)
	}
}
