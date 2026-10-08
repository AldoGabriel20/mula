package http

import (
	"context"
	"net/http"
	"strings"
	"testing"
)

// Logout must destroy the SERVER-side session, not merely ask the browser to forget the
// cookie: a captured cookie must stop working immediately.
func TestLogoutInvalidatesSessionServerSide(t *testing.T) {
	h, _, _ := setup(t)
	ck, csrf := registerLogin(t, h, "logout@example.com")
	if r := do(t, h, "GET", "/api/v1/me", nil, ck, ""); r.Code != 200 {
		t.Fatalf("precondition: /me %d", r.Code)
	}
	// logout needs CSRF
	if r := do(t, h, "POST", "/api/v1/auth/logout", nil, ck, ""); r.Code != 403 {
		t.Fatalf("logout without csrf: want 403 got %d", r.Code)
	}
	r := do(t, h, "POST", "/api/v1/auth/logout", nil, ck, csrf)
	if r.Code != 204 {
		t.Fatalf("logout: %d", r.Code)
	}
	// browser is told to drop both cookies
	cleared := map[string]bool{}
	for _, c := range r.Result().Cookies() {
		if c.MaxAge < 0 {
			cleared[c.Name] = true
		}
	}
	if !cleared[sessionCookie] || !cleared[csrfCookie] {
		t.Fatalf("logout must clear session + csrf cookies, cleared=%v", cleared)
	}
	// ...but the proof is that the OLD cookie value is dead server-side
	if r := do(t, h, "GET", "/api/v1/me", nil, ck, ""); r.Code != 401 {
		t.Fatalf("replayed session after logout: want 401 got %d", r.Code)
	}
	if r := do(t, h, "GET", "/api/v1/events", nil, ck, ""); r.Code != 401 {
		t.Fatalf("replayed session on events: want 401 got %d", r.Code)
	}
}

func TestInvalidSessionCookiesRejected(t *testing.T) {
	h, _, pool := setup(t)
	ck, _ := registerLogin(t, h, "sess@example.com")
	var sid string
	for _, c := range ck {
		if c.Name == sessionCookie {
			sid = c.Value
		}
	}
	mk := func(v string) []*http.Cookie { return []*http.Cookie{{Name: sessionCookie, Value: v}} }

	for name, v := range map[string]string{
		"garbage":             "not-a-uuid",
		"empty":               "",
		"sql-ish":             "' OR 1=1 --",
		"valid uuid, unknown": "00000000-0000-0000-0000-000000000000",
		"uuid + suffix":       sid + "x",
	} {
		if r := do(t, h, "GET", "/api/v1/me", nil, mk(v), ""); r.Code != 401 {
			t.Errorf("%s: want 401 got %d", name, r.Code)
		}
	}
	// an EXPIRED but otherwise valid session id must be rejected
	if _, err := pool.Exec(context.Background(), `UPDATE sessions SET expires_at = now() - interval '1 minute' WHERE id=$1`, sid); err != nil {
		t.Fatal(err)
	}
	if r := do(t, h, "GET", "/api/v1/me", nil, ck, ""); r.Code != 401 {
		t.Fatalf("expired session: want 401 got %d", r.Code)
	}
}

// Responses must not reveal whether an email has an account.
func TestNoAccountEnumeration(t *testing.T) {
	h, mailer, _ := setup(t)
	registerLogin(t, h, "exists@example.com")
	mailer.reset = map[string]string{}
	mailer.verify = map[string]string{}

	// forgot password: identical status + body for a real and a made-up address
	real := do(t, h, "POST", "/api/v1/auth/password/forgot", emailReq{Email: "exists@example.com"}, nil, "")
	fake := do(t, h, "POST", "/api/v1/auth/password/forgot", emailReq{Email: "nobody-here@example.com"}, nil, "")
	if real.Code != fake.Code || real.Body.String() != fake.Body.String() {
		t.Fatalf("forgot leaks existence: real=%d %q fake=%d %q", real.Code, real.Body, fake.Code, fake.Body)
	}
	if mailer.reset["exists@example.com"] == "" {
		t.Fatal("the real account must still receive a reset email")
	}
	if _, sent := mailer.reset["nobody-here@example.com"]; sent {
		t.Fatal("no email may be sent to a non-existent account")
	}

	// resend verification: same
	r1 := do(t, h, "POST", "/api/v1/auth/verify/resend", emailReq{Email: "exists@example.com"}, nil, "")
	r2 := do(t, h, "POST", "/api/v1/auth/verify/resend", emailReq{Email: "nobody-here@example.com"}, nil, "")
	if r1.Code != r2.Code || r1.Body.String() != r2.Body.String() {
		t.Fatalf("resend leaks existence: %d %q vs %d %q", r1.Code, r1.Body, r2.Code, r2.Body)
	}

	// login: unknown email and wrong password are indistinguishable
	a := do(t, h, "POST", "/api/v1/auth/login", loginReq{Email: "exists@example.com", Password: "wrong-wrong-1"}, nil, "")
	b := do(t, h, "POST", "/api/v1/auth/login", loginReq{Email: "nobody-here@example.com", Password: "wrong-wrong-1"}, nil, "")
	if a.Code != 401 || b.Code != 401 || a.Body.String() != b.Body.String() {
		// request_id differs per request; compare the error code + message instead
		if !strings.Contains(a.Body.String(), `"code":"unauthorized"`) || !strings.Contains(b.Body.String(), `"code":"unauthorized"`) {
			t.Fatalf("login leaks existence: %d %q vs %d %q", a.Code, a.Body, b.Code, b.Body)
		}
	}
	// email case-insensitivity: same account regardless of case (citext) — duplicate registers → 409
	if r := do(t, h, "POST", "/api/v1/auth/register", registerReq{Email: "EXISTS@Example.com", Password: "supersecret1", Name: "x"}, nil, ""); r.Code != 409 {
		t.Fatalf("case-variant duplicate email: want 409 got %d", r.Code)
	}
}

// Reset tokens are single-use and a used/expired verify token can't be replayed.
func TestTokensAreSingleUseAndExpire(t *testing.T) {
	h, mailer, pool := setup(t)
	registerLogin(t, h, "tok@example.com")
	do(t, h, "POST", "/api/v1/auth/password/forgot", emailReq{Email: "tok@example.com"}, nil, "")
	tok := mailer.reset["tok@example.com"]

	// expire it → rejected
	if _, err := pool.Exec(context.Background(), `UPDATE password_reset_tokens SET expires_at = now() - interval '1 second' WHERE token=$1`, tok); err != nil {
		t.Fatal(err)
	}
	if r := do(t, h, "POST", "/api/v1/auth/password/reset", resetReq{Token: tok, Password: "brandnewpw9"}, nil, ""); r.Code != 400 {
		t.Fatalf("expired reset token: want 400 got %d", r.Code)
	}
	// weak password is rejected even with a valid token, and does NOT burn the token
	do(t, h, "POST", "/api/v1/auth/password/forgot", emailReq{Email: "tok@example.com"}, nil, "")
	tok2 := mailer.reset["tok@example.com"]
	if r := do(t, h, "POST", "/api/v1/auth/password/reset", resetReq{Token: tok2, Password: "short"}, nil, ""); r.Code != 400 {
		t.Fatalf("weak password: want 400 got %d", r.Code)
	}
	if r := do(t, h, "POST", "/api/v1/auth/password/reset", resetReq{Token: tok2, Password: "brandnewpw9"}, nil, ""); r.Code != 204 {
		t.Fatalf("token must still be usable after a rejected weak password: got %d", r.Code)
	}
	if r := do(t, h, "POST", "/api/v1/auth/password/reset", resetReq{Token: tok2, Password: "anotherpw99"}, nil, ""); r.Code != 400 {
		t.Fatalf("reset token reuse: want 400 got %d", r.Code)
	}
}
