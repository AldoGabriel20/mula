package http

import (
	"context"
	"net/http"

	eventapp "github.com/mula/mula/internal/application/event"
	"github.com/mula/mula/internal/domain/event"
	apperr "github.com/mula/mula/internal/platform/errors"
)

const (
	eventIDKey ctxKey = 1
	roleKey    ctxKey = 2
)

func eventID(ctx context.Context) string { s, _ := ctx.Value(eventIDKey).(string); return s }
func eventRole(ctx context.Context) event.Role {
	r, _ := ctx.Value(roleKey).(event.Role)
	return r
}

// requireEventRole resolves the caller's role on the {id} event and enforces
// `allowed`. Unknown event / non-member → 404 (no leak); wrong role → 403.
// Must run after requireAuth (needs CurrentUser). Stores event id + role in ctx.
func requireEventRole(svc *eventapp.Service, allowed func(event.Role) bool) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			u := CurrentUser(r.Context())
			id := r.PathValue("id")
			role, err := svc.RoleFor(r.Context(), id, u.ID)
			if err != nil {
				writeErr(w, r, err) // event.ErrNotFound → 404
				return
			}
			if !allowed(role) {
				writeErr(w, r, apperr.Forbidden())
				return
			}
			ctx := context.WithValue(r.Context(), eventIDKey, id)
			ctx = context.WithValue(ctx, roleKey, role)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func staffOnly(r event.Role) bool  { return r.IsStaff() }
func anyMember(event.Role) bool    { return true }
func editorOnly(r event.Role) bool { return r.IsEditor() }
func ownerOnly(r event.Role) bool  { return r.IsOwner() }
