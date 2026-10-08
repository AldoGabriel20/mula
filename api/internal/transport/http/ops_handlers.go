package http

import (
	"net/http"
	"strings"
	"time"

	opsapp "github.com/mula/mula/internal/application/ops"
	"github.com/mula/mula/internal/domain/ops"
)

type OpsHandler struct{ svc *opsapp.Service }

func NewOpsHandler(svc *opsapp.Service) *OpsHandler { return &OpsHandler{svc: svc} }

type arrivalDTO struct {
	GuestID     string  `json:"guest_id"`
	GuestName   string  `json:"guest_name"`
	GroupName   *string `json:"group_name"`
	PartySize   int     `json:"party_size"`
	CheckedInAt string  `json:"checked_in_at"`
}
type checkinReq struct {
	GuestID string `json:"guest_id"`
}
type livePatchReq struct {
	Provider         *string `json:"provider"`
	StreamURL        *string `json:"stream_url"`
	Status           *string `json:"status"`
	StartsAt         *string `json:"starts_at"`
	ShowOnInvitation *bool   `json:"show_on_invitation"`
}

func (h *OpsHandler) Arrivals(w http.ResponseWriter, r *http.Request) {
	as, err := h.svc.Arrivals(r.Context(), eventID(r.Context()))
	if err != nil {
		writeErr(w, r, err)
		return
	}
	data := make([]arrivalDTO, 0, len(as))
	for _, a := range as {
		data = append(data, arrivalDTO{a.GuestID, a.GuestName, a.GroupName, a.PartySize, a.CheckedInAt.UTC().Format(time.RFC3339)})
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": data})
}

func (h *OpsHandler) CheckIn(w http.ResponseWriter, r *http.Request) {
	var req checkinReq
	if !decode(w, r, &req) {
		return
	}
	if strings.TrimSpace(req.GuestID) == "" {
		writeErr(w, r, validationErr(map[string]string{"guest_id": "required"}))
		return
	}
	if err := h.svc.CheckIn(r.Context(), eventID(r.Context()), req.GuestID, CurrentUser(r.Context()).ID); err != nil {
		writeErr(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *OpsHandler) EventDay(w http.ResponseWriter, r *http.Request) {
	ed, err := h.svc.EventDay(r.Context(), eventID(r.Context()))
	if err != nil {
		writeErr(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, ed)
}

func (h *OpsHandler) GetLive(w http.ResponseWriter, r *http.Request) {
	c, err := h.svc.GetLive(r.Context(), eventID(r.Context()))
	if err != nil {
		writeErr(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, liveDTO(c))
}

func (h *OpsHandler) PatchLive(w http.ResponseWriter, r *http.Request) {
	var req livePatchReq
	if !decode(w, r, &req) {
		return
	}
	f := map[string]string{}
	if !validURL(req.StreamURL) {
		f["stream_url"] = "must start with http:// or https://"
	}
	if req.StartsAt != nil && *req.StartsAt != "" {
		if _, err := time.Parse(time.RFC3339, *req.StartsAt); err != nil {
			f["starts_at"] = "must be RFC3339 (or empty to clear)"
		}
	}
	if req.Provider != nil && len([]rune(*req.Provider)) > 60 {
		f["provider"] = "at most 60 characters"
	}
	if len(f) > 0 {
		writeErr(w, r, validationErr(f))
		return
	}
	c, err := h.svc.UpdateLive(r.Context(), eventID(r.Context()), opsapp.LivePatch{Provider: req.Provider, StreamURL: req.StreamURL, Status: req.Status, StartsAt: req.StartsAt, ShowOnInvitation: req.ShowOnInvitation})
	if err != nil {
		writeErr(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, liveDTO(c))
}

// liveDTO is the wire shape of the live-stream config (ops.LiveConfig carries the json tags).
func liveDTO(c ops.LiveConfig) ops.LiveConfig { return c }
