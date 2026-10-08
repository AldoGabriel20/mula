package http

import (
	"net/http"
	"time"
)

const (
	sessionCookie = "session"
	csrfCookie    = "csrf_token"
)

// setAuthCookies writes the httpOnly session cookie and the (JS-readable) CSRF
// cookie used for double-submit. `secure` is off in dev (plain HTTP).
func setAuthCookies(w http.ResponseWriter, sessionID, csrf string, expires time.Time, secure bool) {
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookie,
		Value:    sessionID,
		Path:     "/",
		Expires:  expires,
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteLaxMode,
	})
	http.SetCookie(w, &http.Cookie{
		Name:     csrfCookie,
		Value:    csrf,
		Path:     "/",
		Expires:  expires,
		HttpOnly: false, // frontend reads it to echo as X-CSRF-Token
		Secure:   secure,
		SameSite: http.SameSiteLaxMode,
	})
}

func clearAuthCookies(w http.ResponseWriter, secure bool) {
	for _, name := range []string{sessionCookie, csrfCookie} {
		http.SetCookie(w, &http.Cookie{
			Name: name, Value: "", Path: "/", MaxAge: -1,
			HttpOnly: name == sessionCookie, Secure: secure, SameSite: http.SameSiteLaxMode,
		})
	}
}
