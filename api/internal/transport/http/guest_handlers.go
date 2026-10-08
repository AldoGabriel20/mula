package http

import (
	"errors"
	"net/http"
	"strings"
	"time"

	eventapp "github.com/mula/mula/internal/application/event"
	guestapp "github.com/mula/mula/internal/application/guest"
	"github.com/mula/mula/internal/domain/guest"
	apperr "github.com/mula/mula/internal/platform/errors"
)

type GuestHandler struct {
	svc    *guestapp.Service
	events *eventapp.Service // event label for the invitation email
}

func NewGuestHandler(svc *guestapp.Service, events *eventapp.Service) *GuestHandler {
	return &GuestHandler{svc: svc, events: events}
}

type guestDTO struct {
	ID         string  `json:"id"`
	Name       string  `json:"name"`
	Email      *string `json:"email"`
	Phone      *string `json:"phone"`
	GroupID    *string `json:"group_id"`
	GroupName  *string `json:"group_name"`
	PlusOnes   int     `json:"plus_ones"`
	VIP        bool    `json:"vip"`
	Opened     bool    `json:"opened"`
	RSVPStatus string  `json:"rsvp_status"`
	PartySize  int     `json:"party_size"`
	// InvitePath is this guest's personal link (host-only; the token is a capability).
	InvitePath *string `json:"invite_path"`
	TableLabel *string `json:"table_label"`
	Notes      string  `json:"notes"`
	InvitedAt  *string `json:"invited_at"`
}

func toGuestDTO(g *guest.Guest) guestDTO {
	var path *string
	if g.Token != nil {
		p := "/invite/" + *g.Token
		path = &p
	}
	return guestDTO{InvitePath: path,
		ID: g.ID, Name: g.Name, Email: g.Email, Phone: g.Phone, GroupID: g.GroupID, GroupName: g.GroupName,
		PlusOnes: g.PlusOnes, VIP: g.VIP, Opened: g.OpenedAt != nil, RSVPStatus: g.RSVPStatus, PartySize: g.PartySize,
		TableLabel: g.TableLabel, Notes: g.Notes, InvitedAt: invitedAt(g.InvitedAt),
	}
}

type guestReq struct {
	Name       string  `json:"name"`
	Email      *string `json:"email"`
	Phone      *string `json:"phone"`
	GroupID    *string `json:"group_id"`
	PlusOnes   int     `json:"plus_ones"`
	VIP        bool    `json:"vip"`
	TableLabel *string `json:"table_label"`
	Notes      string  `json:"notes"`
}
type guestPatchReq struct {
	Name       *string `json:"name"`
	Email      *string `json:"email"`
	Phone      *string `json:"phone"`
	GroupID    *string `json:"group_id"`
	PlusOnes   *int    `json:"plus_ones"`
	VIP        *bool   `json:"vip"`
	RSVPStatus *string `json:"rsvp_status"`
	PartySize  *int    `json:"party_size"`
	TableLabel *string `json:"table_label"`
	Notes      *string `json:"notes"`
}
type importReq struct {
	Guests []guestReq `json:"guests"`
}
type groupReq struct {
	Name string `json:"name"`
}

func invitedAt(t *time.Time) *string { return rfc3339(t) }

// guestFields validates the host-editable fields. The host is authoritative on party_size (the
// public RSVP path is the one capped at 1+plus_ones), so only sane bounds apply here.
func guestFields(notes, table *string, rsvp *string, party *int) map[string]string {
	f := map[string]string{}
	if notes != nil && len([]rune(*notes)) > 1000 {
		f["notes"] = "at most 1000 characters"
	}
	if table != nil && len([]rune(*table)) > 20 {
		f["table_label"] = "at most 20 characters"
	}
	if rsvp != nil && !guest.ValidRSVP(*rsvp) {
		f["rsvp_status"] = "must be pending, yes or no"
	}
	if party != nil && (*party < 0 || *party > 100) {
		f["party_size"] = "must be between 0 and 100"
	}
	return f
}

func (h *GuestHandler) List(w http.ResponseWriter, r *http.Request) {
	gs, err := h.svc.List(r.Context(), eventID(r.Context()))
	if err != nil {
		writeErr(w, r, err)
		return
	}
	data := make([]guestDTO, 0, len(gs))
	for i := range gs {
		data = append(data, toGuestDTO(&gs[i]))
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": data})
}

func (h *GuestHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req guestReq
	if !decode(w, r, &req) {
		return
	}
	if strings.TrimSpace(req.Name) == "" {
		writeErr(w, r, validationErr(map[string]string{"name": "required"}))
		return
	}
	if req.PlusOnes < 0 {
		writeErr(w, r, validationErr(map[string]string{"plus_ones": "must be 0 or more"}))
		return
	}
	if f := guestFields(&req.Notes, req.TableLabel, nil, nil); len(f) > 0 {
		writeErr(w, r, validationErr(f))
		return
	}
	g, err := h.svc.Create(r.Context(), eventID(r.Context()), guestapp.GuestInput{
		Name: req.Name, Email: req.Email, Phone: req.Phone, GroupID: req.GroupID, PlusOnes: req.PlusOnes, VIP: req.VIP,
		TableLabel: req.TableLabel, Notes: req.Notes,
	})
	if err != nil {
		writeErr(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, toGuestDTO(g))
}

// loadScoped fetches the guest and confirms it belongs to the path event (no IDOR
// across events). Returns nil + writes 404 on mismatch.
func (h *GuestHandler) loadScoped(w http.ResponseWriter, r *http.Request) *guest.Guest {
	g, err := h.svc.Get(r.Context(), r.PathValue("gid"))
	if err != nil {
		writeErr(w, r, err)
		return nil
	}
	if g.EventID != eventID(r.Context()) {
		writeErr(w, r, apperr.NotFound())
		return nil
	}
	return g
}

func (h *GuestHandler) Get(w http.ResponseWriter, r *http.Request) {
	if g := h.loadScoped(w, r); g != nil {
		writeJSON(w, http.StatusOK, toGuestDTO(g))
	}
}

func (h *GuestHandler) Patch(w http.ResponseWriter, r *http.Request) {
	if h.loadScoped(w, r) == nil {
		return
	}
	var req guestPatchReq
	if !decode(w, r, &req) {
		return
	}
	if req.PlusOnes != nil && *req.PlusOnes < 0 {
		writeErr(w, r, validationErr(map[string]string{"plus_ones": "must be 0 or more"}))
		return
	}
	if f := guestFields(req.Notes, req.TableLabel, req.RSVPStatus, req.PartySize); len(f) > 0 {
		writeErr(w, r, validationErr(f))
		return
	}
	g, err := h.svc.Update(r.Context(), r.PathValue("gid"), guestapp.GuestPatch{
		Name: req.Name, Email: req.Email, Phone: req.Phone, GroupID: req.GroupID,
		PlusOnes: req.PlusOnes, VIP: req.VIP, RSVPStatus: req.RSVPStatus, PartySize: req.PartySize,
		TableLabel: req.TableLabel, Notes: req.Notes,
	})
	if err != nil {
		writeErr(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, toGuestDTO(g))
}

func (h *GuestHandler) Delete(w http.ResponseWriter, r *http.Request) {
	if h.loadScoped(w, r) == nil {
		return
	}
	if err := h.svc.Delete(r.Context(), r.PathValue("gid")); err != nil {
		writeErr(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *GuestHandler) Import(w http.ResponseWriter, r *http.Request) {
	var req importReq
	if !decode(w, r, &req) {
		return
	}
	in := make([]guestapp.GuestInput, 0, len(req.Guests))
	for _, g := range req.Guests {
		in = append(in, guestapp.GuestInput{Name: g.Name, Email: g.Email, Phone: g.Phone, GroupID: g.GroupID, PlusOnes: g.PlusOnes, VIP: g.VIP, TableLabel: g.TableLabel, Notes: g.Notes})
	}
	n, err := h.svc.Import(r.Context(), eventID(r.Context()), in)
	if err != nil {
		writeErr(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"inserted": n})
}

func (h *GuestHandler) Segments(w http.ResponseWriter, r *http.Request) {
	seg, err := h.svc.Segments(r.Context(), eventID(r.Context()))
	if err != nil {
		writeErr(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, seg)
}

func (h *GuestHandler) ListGroups(w http.ResponseWriter, r *http.Request) {
	gs, err := h.svc.ListGroups(r.Context(), eventID(r.Context()))
	if err != nil {
		writeErr(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": gs})
}

func (h *GuestHandler) CreateGroup(w http.ResponseWriter, r *http.Request) {
	var req groupReq
	if !decode(w, r, &req) {
		return
	}
	if strings.TrimSpace(req.Name) == "" {
		writeErr(w, r, validationErr(map[string]string{"name": "required"}))
		return
	}
	g, err := h.svc.CreateGroup(r.Context(), eventID(r.Context()), req.Name)
	if err != nil {
		writeErr(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, g)
}

// Resend emails the guest their personal link (no email on file → 422 no_email).
func (h *GuestHandler) Resend(w http.ResponseWriter, r *http.Request) {
	g := h.loadScoped(w, r)
	if g == nil {
		return
	}
	label := ""
	if h.events != nil {
		if ev, err := h.events.Get(r.Context(), eventID(r.Context())); err == nil && ev != nil {
			label = eventLabel(ev.CoupleA, ev.CoupleB, ev.Type)
		}
	}
	if err := h.svc.Resend(r.Context(), g, label); err != nil {
		if errors.Is(err, guest.ErrNoEmail) {
			writeErr(w, r, apperr.New(http.StatusUnprocessableEntity, "no_email", "add an email address for this guest first"))
			return
		}
		writeErr(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func eventLabel(a, b *string, typ string) string {
	switch {
	case a != nil && b != nil && *a != "" && *b != "":
		return *a + " & " + *b
	case a != nil && *a != "":
		return *a
	case b != nil && *b != "":
		return *b
	}
	return strings.ReplaceAll(typ, "-", " ")
}
