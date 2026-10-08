package http

import (
	"net/http"
	"strconv"

	eventapp "github.com/mula/mula/internal/application/event"
	"github.com/mula/mula/internal/application/overview"
)

type OverviewHandler struct {
	events *eventapp.Service
	ov     *overview.Service
}

func NewOverviewHandler(events *eventapp.Service, ov *overview.Service) *OverviewHandler {
	return &OverviewHandler{events: events, ov: ov}
}

// Get runs behind requireEventRole(member): the {id} event is already authorized.
func (h *OverviewHandler) Get(w http.ResponseWriter, r *http.Request) {
	e, err := h.events.Get(r.Context(), eventID(r.Context()))
	if err != nil {
		writeErr(w, r, err)
		return
	}
	data, err := h.ov.Compute(r.Context(), e, CurrentUser(r.Context()).ID)
	if err != nil {
		writeErr(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, data)
}

func (h *OverviewHandler) DismissNote(w http.ResponseWriter, r *http.Request) {
	if err := h.ov.DismissNote(r.Context(), eventID(r.Context()), CurrentUser(r.Context()).ID, r.PathValue("key")); err != nil {
		writeErr(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// Activity serves the recent-activity feed (member tier: it only shows what the dashboard already shows).
func (h *OverviewHandler) Activity(w http.ResponseWriter, r *http.Request) {
	limit := 0
	if q := r.URL.Query().Get("limit"); q != "" {
		n, err := strconv.Atoi(q)
		if err != nil || n < 1 {
			writeErr(w, r, validationErr(map[string]string{"limit": "must be a positive integer"}))
			return
		}
		limit = n
	}
	items, err := h.ov.Activity(r.Context(), eventID(r.Context()), limit)
	if err != nil {
		writeErr(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": items})
}
