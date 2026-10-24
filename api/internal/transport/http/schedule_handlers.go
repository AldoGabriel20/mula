package http

import (
	"errors"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"

	schapp "github.com/mula/mula/internal/application/schedule"
	"github.com/mula/mula/internal/domain/schedule"
	apperr "github.com/mula/mula/internal/platform/errors"
)

type ScheduleHandler struct{ svc *schapp.Service }

func NewScheduleHandler(svc *schapp.Service) *ScheduleHandler { return &ScheduleHandler{svc: svc} }

type scheduleDTO struct {
	ID          string  `json:"id"`
	Title       string  `json:"title"`
	StartsAt    *string `json:"starts_at"`
	EndsAt      *string `json:"ends_at"`
	Venue       *string `json:"venue"`
	Address     string  `json:"address"`
	DressCode   string  `json:"dress_code"`
	Description string  `json:"description"`
	Visibility  string  `json:"visibility"`
	Label       string  `json:"label"`
	MapURL      string  `json:"map_url"`
	VenueNote   string  `json:"venue_note"`
	MediaID     *string `json:"media_id"`
	Position    int     `json:"position"`
}

func rfc3339(t *time.Time) *string {
	if t == nil {
		return nil
	}
	s := t.UTC().Format(time.RFC3339)
	return &s
}

func toScheduleDTO(it *schedule.Item) scheduleDTO {
	return scheduleDTO{ID: it.ID, Title: it.Title, StartsAt: rfc3339(it.StartsAt), EndsAt: rfc3339(it.EndsAt), Venue: it.Venue,
		Address: it.Address, DressCode: it.DressCode, Description: it.Description, Visibility: it.Visibility,
		Label: it.Label, MapURL: it.MapURL, VenueNote: it.VenueNote, MediaID: it.MediaID, Position: it.Position}
}

type scheduleReq struct {
	Title       string  `json:"title"`
	StartsAt    *string `json:"starts_at"`
	EndsAt      *string `json:"ends_at"`
	Venue       *string `json:"venue"`
	Address     string  `json:"address"`
	DressCode   string  `json:"dress_code"`
	Description string  `json:"description"`
	Visibility  string  `json:"visibility"`
	Label       string  `json:"label"`
	MapURL      string  `json:"map_url"`
	VenueNote   string  `json:"venue_note"`
	MediaID     *string `json:"media_id"`
}
type schedulePatchReq struct {
	Title       *string `json:"title"`
	StartsAt    *string `json:"starts_at"`
	EndsAt      *string `json:"ends_at"`
	Venue       *string `json:"venue"`
	Address     *string `json:"address"`
	DressCode   *string `json:"dress_code"`
	Description *string `json:"description"`
	Visibility  *string `json:"visibility"`
	Label       *string `json:"label"`
	MapURL      *string `json:"map_url"`
	VenueNote   *string `json:"venue_note"`
	MediaID     *string `json:"media_id"` // "" clears the photo
}

// scheduleExtras are the template fields validated alongside the base ones.
type scheduleExtras struct{ label, venueNote, mapURL, mediaID *string }

var uuidRe = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$`)

// httpsURL: absolute https link with a host (blocks javascript:, data:, http:).
func httpsURL(s string) bool {
	u, err := url.Parse(s)
	return err == nil && u.Scheme == "https" && u.Host != ""
}

// scheduleFields validates the free-text bounds shared by create and patch.
func scheduleFields(address, dress, desc, vis, starts, ends *string, x scheduleExtras) map[string]string {
	f := map[string]string{}
	over := func(p *string, n int) bool { return p != nil && len([]rune(*p)) > n }
	if over(address, 300) {
		f["address"] = "at most 300 characters"
	}
	if over(dress, 120) {
		f["dress_code"] = "at most 120 characters"
	}
	if over(desc, 1000) {
		f["description"] = "at most 1000 characters"
	}
	for k, p := range map[string]*string{"starts_at": starts, "ends_at": ends} {
		if p != nil && *p != "" {
			if _, err := time.Parse(time.RFC3339, *p); err != nil {
				f[k] = "must be RFC3339"
			}
		}
	}
	if over(x.label, 40) {
		f["label"] = "at most 40 characters"
	}
	if over(x.venueNote, 160) {
		f["venue_note"] = "at most 160 characters"
	}
	if m := x.mapURL; m != nil && *m != "" && (len(*m) > 500 || !httpsURL(*m)) {
		f["map_url"] = "must be an https:// link of at most 500 characters"
	}
	if m := x.mediaID; m != nil && *m != "" && !uuidRe.MatchString(*m) {
		f["media_id"] = "must be a photo id"
	}
	if vis != nil && *vis != "" && !schedule.ValidVisibility(*vis) {
		f["visibility"] = "must be everyone, invite_only or family_only"
	}
	return f
}

func (h *ScheduleHandler) List(w http.ResponseWriter, r *http.Request) {
	items, err := h.svc.List(r.Context(), eventID(r.Context()))
	if err != nil {
		writeErr(w, r, err)
		return
	}
	data := make([]scheduleDTO, 0, len(items))
	for i := range items {
		data = append(data, toScheduleDTO(&items[i]))
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": data})
}

func (h *ScheduleHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req scheduleReq
	if !decode(w, r, &req) {
		return
	}
	if strings.TrimSpace(req.Title) == "" {
		writeErr(w, r, validationErr(map[string]string{"title": "required"}))
		return
	}
	if f := scheduleFields(&req.Address, &req.DressCode, &req.Description, &req.Visibility, req.StartsAt, req.EndsAt,
		scheduleExtras{&req.Label, &req.VenueNote, &req.MapURL, req.MediaID}); len(f) > 0 {
		writeErr(w, r, validationErr(f))
		return
	}
	it, err := h.svc.Create(r.Context(), eventID(r.Context()), schapp.Input{Title: req.Title, StartsAt: req.StartsAt, EndsAt: req.EndsAt, Venue: req.Venue,
		Address: req.Address, DressCode: req.DressCode, Description: req.Description, Visibility: req.Visibility,
		Label: req.Label, MapURL: req.MapURL, VenueNote: req.VenueNote, MediaID: req.MediaID})
	if err != nil {
		writeErr(w, r, mapTimeErr(err))
		return
	}
	writeJSON(w, http.StatusCreated, toScheduleDTO(it))
}

// scoped confirms the item belongs to the path event (no cross-event IDOR).
func (h *ScheduleHandler) scoped(w http.ResponseWriter, r *http.Request) *schedule.Item {
	it, err := h.svc.Get(r.Context(), r.PathValue("sid"))
	if err != nil {
		writeErr(w, r, err)
		return nil
	}
	if it.EventID != eventID(r.Context()) {
		writeErr(w, r, apperr.NotFound())
		return nil
	}
	return it
}

func (h *ScheduleHandler) Patch(w http.ResponseWriter, r *http.Request) {
	if h.scoped(w, r) == nil {
		return
	}
	var req schedulePatchReq
	if !decode(w, r, &req) {
		return
	}
	if f := scheduleFields(req.Address, req.DressCode, req.Description, req.Visibility, req.StartsAt, req.EndsAt,
		scheduleExtras{req.Label, req.VenueNote, req.MapURL, req.MediaID}); len(f) > 0 {
		writeErr(w, r, validationErr(f))
		return
	}
	it, err := h.svc.Update(r.Context(), r.PathValue("sid"), schapp.Patch{Title: req.Title, StartsAt: req.StartsAt, EndsAt: req.EndsAt, Venue: req.Venue,
		Address: req.Address, DressCode: req.DressCode, Description: req.Description, Visibility: req.Visibility,
		Label: req.Label, MapURL: req.MapURL, VenueNote: req.VenueNote, MediaID: req.MediaID})
	if err != nil {
		writeErr(w, r, mapTimeErr(err))
		return
	}
	writeJSON(w, http.StatusOK, toScheduleDTO(it))
}

func (h *ScheduleHandler) Delete(w http.ResponseWriter, r *http.Request) {
	if h.scoped(w, r) == nil {
		return
	}
	if err := h.svc.Delete(r.Context(), r.PathValue("sid")); err != nil {
		writeErr(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *ScheduleHandler) Reorder(w http.ResponseWriter, r *http.Request) {
	var req reorderReq
	if !decode(w, r, &req) {
		return
	}
	if err := h.svc.Reorder(r.Context(), eventID(r.Context()), req.Order); err != nil {
		writeErr(w, r, err)
		return
	}
	h.List(w, r)
}

// ICS downloads the dated schedule as a calendar file.
func (h *ScheduleHandler) ICS(w http.ResponseWriter, r *http.Request) {
	body, err := h.svc.ICS(r.Context(), eventID(r.Context()), "")
	if err != nil {
		writeErr(w, r, err)
		return
	}
	w.Header().Set("Content-Type", "text/calendar; charset=utf-8")
	w.Header().Set("Content-Disposition", `attachment; filename="schedule.ics"`)
	_, _ = w.Write([]byte(body))
}

// mapTimeErr turns a time-parse failure into a 400 validation error.
func mapTimeErr(err error) error {
	if _, ok := err.(*time.ParseError); ok {
		return validationErr(map[string]string{"starts_at": "must be RFC3339"})
	}
	if errors.Is(err, schedule.ErrBadMedia) {
		return validationErr(map[string]string{"media_id": "unknown photo"})
	}
	if errors.Is(err, schedule.ErrBadRange) {
		return validationErr(map[string]string{"ends_at": "must not be before starts_at"})
	}
	return err
}
