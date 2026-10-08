package http

import (
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/mula/mula/internal/application/auth"
	apperr "github.com/mula/mula/internal/platform/errors"
)

type MeHandler struct {
	svc    *auth.Service
	secure bool
}

func NewMeHandler(svc *auth.Service, secure bool) *MeHandler {
	return &MeHandler{svc: svc, secure: secure}
}

// phoneRe: digits with optional + - ( ) and spaces, at most 32 characters.
var phoneRe = regexp.MustCompile(`^[0-9+()\-\s]{3,32}$`)

func (h *MeHandler) Get(w http.ResponseWriter, r *http.Request) {
	u := CurrentUser(r.Context())
	writeJSON(w, http.StatusOK, toUserDTO(u))
}

func (h *MeHandler) Update(w http.ResponseWriter, r *http.Request) {
	var req updateMeReq
	if !decode(w, r, &req) {
		return
	}
	if strings.TrimSpace(req.Name) == "" {
		writeErr(w, r, validationErr(map[string]string{"name": "required"}))
		return
	}
	u := CurrentUser(r.Context())
	if req.Phone != nil && !phoneRe.MatchString(*req.Phone) && *req.Phone != "" {
		writeErr(w, r, validationErr(map[string]string{"phone": "digits, spaces, + - ( ) only, up to 32 characters"}))
		return
	}
	updated, err := h.svc.UpdateProfile(r.Context(), u.ID, req.Name, req.AvatarURL, req.Phone)
	if err != nil {
		writeErr(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, toUserDTO(updated))
}

func (h *MeHandler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	var req changePasswordReq
	if !decode(w, r, &req) {
		return
	}
	u := CurrentUser(r.Context())
	if err := h.svc.ChangePassword(r.Context(), u.ID, req.Current, req.New, sessionID(r)); err != nil {
		writeErr(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// sessionID is the caller's session cookie value (valid: requireAuth already resolved it).
func sessionID(r *http.Request) string {
	c, _ := r.Cookie(sessionCookie)
	if c == nil {
		return ""
	}
	return c.Value
}

type sessionDTO struct {
	ID        string `json:"id"`
	UserAgent string `json:"user_agent"`
	IP        string `json:"ip"`
	CreatedAt string `json:"created_at"`
	Current   bool   `json:"current"`
}

// Sessions lists the caller's own signed-in devices; the one making this request is flagged.
func (h *MeHandler) Sessions(w http.ResponseWriter, r *http.Request) {
	u := CurrentUser(r.Context())
	ss, err := h.svc.Sessions(r.Context(), u.ID)
	if err != nil {
		writeErr(w, r, err)
		return
	}
	cur := sessionID(r)
	data := make([]sessionDTO, 0, len(ss))
	for _, s := range ss {
		data = append(data, sessionDTO{ID: s.ID, UserAgent: s.UserAgent, IP: s.IP, CreatedAt: s.CreatedAt.UTC().Format(time.RFC3339), Current: s.ID == cur})
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": data})
}

// RevokeSession signs out one of the caller's devices. Another user's session id is a plain 404.
// Revoking the current session clears the cookie like logout does.
func (h *MeHandler) RevokeSession(w http.ResponseWriter, r *http.Request) {
	u := CurrentUser(r.Context())
	id := r.PathValue("sid")
	ok, err := h.svc.RevokeSession(r.Context(), u.ID, id)
	if err != nil {
		writeErr(w, r, err)
		return
	}
	if !ok {
		writeErr(w, r, apperr.NotFound())
		return
	}
	if id == sessionID(r) {
		clearAuthCookies(w, h.secure)
	}
	w.WriteHeader(http.StatusNoContent)
}
