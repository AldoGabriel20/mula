package http

import (
	"context"
	"net/http"

	"github.com/mula/mula/internal/application/auth"
	"github.com/mula/mula/internal/domain/user"
)

type ctxKey int

const userKey ctxKey = 0

// CurrentUser returns the authenticated user, or nil.
func CurrentUser(ctx context.Context) *user.User {
	u, _ := ctx.Value(userKey).(*user.User)
	return u
}

// requireAuth resolves the session cookie to a user, 401 otherwise.
func requireAuth(svc *auth.Service) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			c, err := r.Cookie(sessionCookie)
			if err != nil || c.Value == "" {
				writeErr(w, r, auth.ErrSessionInvalid)
				return
			}
			u, err := svc.Authenticate(r.Context(), c.Value)
			if err != nil {
				writeErr(w, r, err)
				return
			}
			ctx := context.WithValue(r.Context(), userKey, u)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// rateKeyUser is the per-user rate-limit key (only valid AFTER requireAuth).
func rateKeyUser(r *http.Request) string {
	if u := CurrentUser(r.Context()); u != nil {
		return "u:" + u.ID
	}
	return "u:anon" // unreachable behind requireAuth; never a shared hot key in practice
}
