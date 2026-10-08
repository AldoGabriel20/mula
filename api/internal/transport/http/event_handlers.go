package http

import (
	"net/http"
	"strings"

	eventapp "github.com/mula/mula/internal/application/event"
)

type EventHandler struct{ svc *eventapp.Service }

func NewEventHandler(svc *eventapp.Service) *EventHandler { return &EventHandler{svc: svc} }

func (h *EventHandler) List(w http.ResponseWriter, r *http.Request) {
	u := CurrentUser(r.Context())
	if u.Verified() { // pending team invites addressed to this verified email become memberships
		if err := h.svc.AcceptInvites(r.Context(), u.ID, u.Email); err != nil {
			writeErr(w, r, err)
			return
		}
	}
	events, err := h.svc.List(r.Context(), u.ID)
	if err != nil {
		writeErr(w, r, err)
		return
	}
	data := make([]eventDTO, 0, len(events))
	for i := range events {
		data = append(data, toEventDTO(&events[i]))
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": data})
}

func (h *EventHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req createEventReq
	if !decode(w, r, &req) {
		return
	}
	if strings.TrimSpace(req.Type) == "" {
		writeErr(w, r, validationErr(map[string]string{"type": "required"}))
		return
	}
	u := CurrentUser(r.Context())
	e, err := h.svc.Create(r.Context(), u.ID, u.Email, eventapp.CreateInput{
		Type: req.Type, CoupleA: req.CoupleA, CoupleB: req.CoupleB, EventDate: req.EventDate, Venue: req.Venue,
	})
	if err != nil {
		writeErr(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, toEventDTO(e))
}

// Get / Patch / Delete run behind requireEventRole, so the event id in ctx is
// already authorized for this caller.
func (h *EventHandler) Get(w http.ResponseWriter, r *http.Request) {
	e, err := h.svc.Get(r.Context(), eventID(r.Context()))
	if err != nil {
		writeErr(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, toEventDTO(e))
}

func (h *EventHandler) Patch(w http.ResponseWriter, r *http.Request) {
	var req patchEventReq
	if !decode(w, r, &req) {
		return
	}
	e, err := h.svc.Update(r.Context(), eventID(r.Context()), eventapp.Patch{
		Type: req.Type, CoupleA: req.CoupleA, CoupleB: req.CoupleB, EventDate: req.EventDate, Venue: req.Venue,
	})
	if err != nil {
		writeErr(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, toEventDTO(e))
}

func (h *EventHandler) Delete(w http.ResponseWriter, r *http.Request) {
	if err := h.svc.Delete(r.Context(), eventID(r.Context())); err != nil {
		writeErr(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
