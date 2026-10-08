package middleware

import (
	"crypto/subtle"
	"net/http"
)

// CSRF enforces double-submit on mutating, cookie-authenticated requests: the
// X-CSRF-Token header must equal the csrf_token cookie. Safe methods pass through.
func CSRF(cookieName, headerName string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			switch r.Method {
			case http.MethodGet, http.MethodHead, http.MethodOptions:
				next.ServeHTTP(w, r)
				return
			}
			c, err := r.Cookie(cookieName)
			header := r.Header.Get(headerName)
			if err != nil || c.Value == "" || header == "" || subtle.ConstantTimeCompare([]byte(c.Value), []byte(header)) != 1 {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusForbidden)
				_, _ = w.Write([]byte(`{"error":{"code":"csrf_failed","message":"CSRF token missing or invalid"}}`))
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
