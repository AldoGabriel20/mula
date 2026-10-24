package http

import (
	"net/http"
	"strconv"
	"time"

	"github.com/mula/mula/internal/application/publicinvite"
	"github.com/mula/mula/internal/domain/invitation"
)

type PublicHandler struct{ svc *publicinvite.Service }

func NewPublicHandler(svc *publicinvite.Service) *PublicHandler { return &PublicHandler{svc: svc} }

type publicSectionDTO struct {
	Type    string         `json:"type"`
	Content map[string]any `json:"content"`
}
type publicGiftDTO struct {
	Title        string   `json:"title"`
	Description  string   `json:"description"`
	URL          *string  `json:"url"`
	TargetAmount *float64 `json:"target_amount"`
}
type publicMethodDTO struct {
	Type      string `json:"type"`
	Title     string `json:"title"`
	Detail    string `json:"detail"`
	CopyValue string `json:"copy_value"`
}
type publicLiveDTO struct {
	Provider  string  `json:"provider"`
	StreamURL string  `json:"stream_url"`
	Status    string  `json:"status"`
	StartsAt  *string `json:"starts_at"`
}
type publicMomentDTO struct {
	Label       string  `json:"label"`
	Title       string  `json:"title"`
	StartsAt    *string `json:"starts_at"`
	EndsAt      *string `json:"ends_at"`
	Venue       *string `json:"venue"`
	Address     string  `json:"address"`
	MapURL      string  `json:"map_url"`
	VenueNote   string  `json:"venue_note"`
	DressCode   string  `json:"dress_code"`
	Description string  `json:"description"`
	PhotoID     *string `json:"photo_id"`
}
type publicGuestDTO struct {
	Name       string `json:"name"`
	RSVPStatus string `json:"rsvp_status"`
	PartySize  int    `json:"party_size"`
	MaxParty   int    `json:"max_party"`
}
type publicInvitationDTO struct {
	Template        *string            `json:"template"`
	Timezone        string             `json:"timezone"`
	EventType       string             `json:"event_type"`
	CoupleA         *string            `json:"couple_a"`
	CoupleB         *string            `json:"couple_b"`
	EventDate       *string            `json:"event_date"`
	Venue           *string            `json:"venue"`
	Palette         string             `json:"palette"`
	Theme           themeDTO           `json:"theme"`
	TemplateVersion int                `json:"template_version"`
	Language        string             `json:"language"`
	Sections        []publicSectionDTO `json:"sections"`
	Schedule        []publicMomentDTO  `json:"schedule"`
	Media           map[string]string  `json:"media"`
	Preview         bool               `json:"preview"`
	Gifts           []publicGiftDTO    `json:"gifts"`
	Methods         []publicMethodDTO  `json:"gift_methods"`
	Live            *publicLiveDTO     `json:"live"`
	RSVPDeadline    *string            `json:"rsvp_deadline"`
	Guest           *publicGuestDTO    `json:"guest"` // present only on a personal link
}

type rsvpReq struct {
	Status    string  `json:"status"`
	PartySize int     `json:"party_size"`
	Meal      *string `json:"meal"`
	Note      *string `json:"note"`
}
type wishReq struct {
	Name    string `json:"name"`
	Message string `json:"message"`
}

// Get serves the guest-safe page. The token (event link or personal link) is the only
// credential. Responses differ per link, so they must never be shared-cached.
func (h *PublicHandler) Get(w http.ResponseWriter, r *http.Request) {
	page, err := h.svc.Get(r.Context(), r.PathValue("token"))
	if err != nil {
		writeErr(w, r, err)
		return
	}
	writePage(w, page)
}

// Preview serves the host's draft in the guest shape. It runs behind needAuth + member, so the
// event id in ctx is already authorised for the caller.
func (h *PublicHandler) Preview(w http.ResponseWriter, r *http.Request) {
	page, err := h.svc.Preview(r.Context(), eventID(r.Context()))
	if err != nil {
		writeErr(w, r, err)
		return
	}
	writePage(w, page)
}

func writePage(w http.ResponseWriter, page *invitation.PublicPage) {
	v := page.View
	var date *string
	if v.EventDate != nil {
		d := v.EventDate.UTC().Format(time.RFC3339)
		date = &d
	}
	secs := make([]publicSectionDTO, 0, len(v.Sections))
	for _, s := range v.Sections {
		secs = append(secs, publicSectionDTO{Type: s.Type, Content: s.Content})
	}
	gifts := make([]publicGiftDTO, 0, len(page.Gifts))
	for _, g := range page.Gifts {
		gifts = append(gifts, publicGiftDTO{g.Title, g.Description, g.URL, g.TargetAmount})
	}
	methods := make([]publicMethodDTO, 0, len(page.Methods))
	for _, m := range page.Methods {
		methods = append(methods, publicMethodDTO{m.Type, m.Title, m.Detail, m.CopyValue})
	}
	moments := make([]publicMomentDTO, 0, len(page.Schedule))
	for _, m := range page.Schedule {
		moments = append(moments, publicMomentDTO{Label: m.Label, Title: m.Title, StartsAt: rfc3339(m.StartsAt), EndsAt: rfc3339(m.EndsAt),
			Venue: m.Venue, Address: m.Address, MapURL: m.MapURL, VenueNote: m.VenueNote, DressCode: m.DressCode, Description: m.Description, PhotoID: m.PhotoID})
	}
	out := publicInvitationDTO{
		Template: v.Template, Timezone: v.Timezone, Schedule: moments, Media: page.Media, Preview: page.Preview,
		EventType: v.EventType, CoupleA: v.CoupleA, CoupleB: v.CoupleB, EventDate: date, Venue: v.Venue,
		Palette: v.Palette, Theme: toThemeDTO(v.Theme), TemplateVersion: v.TemplateVersion, Language: v.Language, Sections: secs, Gifts: gifts, Methods: methods, RSVPDeadline: rfc3339(page.RSVPDeadline),
	}
	if page.Live != nil {
		out.Live = &publicLiveDTO{page.Live.Provider, page.Live.StreamURL, page.Live.Status, rfc3339(page.Live.StartsAt)}
	}
	if page.Guest != nil {
		out.Guest = &publicGuestDTO{page.Guest.Name, page.Guest.RSVPStatus, page.Guest.PartySize, page.Guest.MaxParty}
	}
	// A personal link reveals a guest's own name/RSVP and records an open: never cache it.
	w.Header().Set("Cache-Control", "private, no-store")
	writeJSON(w, http.StatusOK, out)
}

func (h *PublicHandler) RSVP(w http.ResponseWriter, r *http.Request) {
	if err := h.svc.Exists(r.Context(), r.PathValue("token")); err != nil {
		writeErr(w, r, err) // bad token → uniform 404 before the body is even read
		return
	}
	var req rsvpReq
	if !decode(w, r, &req) {
		return
	}
	err := h.svc.RSVP(r.Context(), r.PathValue("token"), invitation.RSVPInput{
		Status: req.Status, PartySize: req.PartySize, Meal: req.Meal, Note: req.Note,
	})
	if err != nil {
		writeErr(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *PublicHandler) Wish(w http.ResponseWriter, r *http.Request) {
	if err := h.svc.Exists(r.Context(), r.PathValue("token")); err != nil {
		writeErr(w, r, err)
		return
	}
	var req wishReq
	if !decode(w, r, &req) {
		return
	}
	wish, err := h.svc.Wish(r.Context(), r.PathValue("token"), req.Name, req.Message)
	if err != nil {
		writeErr(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, publicWishDTO{ID: wish.ID, Name: wish.Name, Message: wish.Message})
}

type publicWishDTO struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Message string `json:"message"`
}

// Wishes serves the guestbook: approved wishes, newest first, keyset-paginated. Any valid link
// (event or personal) may read it. A garbage ?limit falls back to the default; ?limit is clamped.
func (h *PublicHandler) Wishes(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	page, err := h.svc.Wishes(r.Context(), r.PathValue("token"), limit, r.URL.Query().Get("cursor"))
	if err != nil {
		writeErr(w, r, err)
		return
	}
	items := make([]publicWishDTO, 0, len(page.Items))
	for _, x := range page.Items {
		items = append(items, publicWishDTO{ID: x.ID, Name: x.Name, Message: x.Message})
	}
	w.Header().Set("Cache-Control", "private, max-age=15")
	writeJSON(w, http.StatusOK, map[string]any{"items": items, "next_cursor": page.Next, "total": page.Total})
}
