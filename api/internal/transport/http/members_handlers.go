package http

import (
	"net/http"
	"strings"
	"time"

	eventapp "github.com/mula/mula/internal/application/event"
	"github.com/mula/mula/internal/domain/event"
	apperr "github.com/mula/mula/internal/platform/errors"
)

// MembersHandler is the team: who can see and edit an event. Reads are open to every member
// (the dashboard shows who is on the team); writes are owner-only (router.go).
type MembersHandler struct{ svc *eventapp.Service }

func NewMembersHandler(svc *eventapp.Service) *MembersHandler { return &MembersHandler{svc: svc} }

type memberDTO struct {
	ID        string  `json:"id"`
	UserID    *string `json:"user_id"`
	Name      string  `json:"name"`
	Email     string  `json:"email"`
	Role      string  `json:"role"`
	Status    string  `json:"status"` // active | invited
	InvitedAt string  `json:"invited_at"`
}

func toMemberDTO(m *event.Member) memberDTO {
	status := "invited"
	if m.AcceptedAt != nil {
		status = "active"
	}
	return memberDTO{ID: m.ID, UserID: m.UserID, Name: m.Name, Email: m.Email, Role: string(m.Role), Status: status, InvitedAt: m.InvitedAt.UTC().Format(time.RFC3339)}
}

type memberReq struct {
	Email string `json:"email"`
	Role  string `json:"role"`
}
type memberPatchReq struct {
	Role string `json:"role"`
}

func (h *MembersHandler) List(w http.ResponseWriter, r *http.Request) {
	ms, err := h.svc.Members(r.Context(), eventID(r.Context()))
	if err != nil {
		writeErr(w, r, err)
		return
	}
	data := make([]memberDTO, 0, len(ms))
	for i := range ms {
		data = append(data, toMemberDTO(&ms[i]))
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": data})
}

func (h *MembersHandler) Invite(w http.ResponseWriter, r *http.Request) {
	var req memberReq
	if !decode(w, r, &req) {
		return
	}
	f := map[string]string{}
	email := strings.TrimSpace(req.Email)
	if !emailRe.MatchString(email) || len(email) > 254 {
		f["email"] = "must be a valid email"
	}
	if !event.Role(req.Role).Invitable() {
		f["role"] = "must be cohost, planner, family or usher"
	}
	if len(f) > 0 {
		writeErr(w, r, validationErr(f))
		return
	}
	label := ""
	if ev, err := h.svc.Get(r.Context(), eventID(r.Context())); err == nil && ev != nil {
		label = eventLabel(ev.CoupleA, ev.CoupleB, ev.Type)
	}
	m, err := h.svc.Invite(r.Context(), eventID(r.Context()), email, event.Role(req.Role), label)
	if err != nil {
		writeErr(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, toMemberDTO(m))
}

// scopedMember confirms the member row belongs to the path event (no cross-event IDOR).
func (h *MembersHandler) scopedMember(w http.ResponseWriter, r *http.Request) *event.Member {
	m, err := h.svc.Member(r.Context(), r.PathValue("mid"))
	if err != nil {
		writeErr(w, r, err)
		return nil
	}
	if m.EventID != eventID(r.Context()) {
		writeErr(w, r, apperr.NotFound())
		return nil
	}
	return m
}

func (h *MembersHandler) Patch(w http.ResponseWriter, r *http.Request) {
	m := h.scopedMember(w, r)
	if m == nil {
		return
	}
	var req memberPatchReq
	if !decode(w, r, &req) {
		return
	}
	updated, err := h.svc.ChangeRole(r.Context(), m, event.Role(req.Role))
	if err != nil {
		writeErr(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, toMemberDTO(updated))
}

func (h *MembersHandler) Delete(w http.ResponseWriter, r *http.Request) {
	m := h.scopedMember(w, r)
	if m == nil {
		return
	}
	if err := h.svc.RemoveMember(r.Context(), m); err != nil {
		writeErr(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
