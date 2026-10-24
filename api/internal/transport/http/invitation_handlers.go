package http

import (
	"errors"
	"net/http"
	"strings"
	"time"

	invapp "github.com/mula/mula/internal/application/invitation"
	"github.com/mula/mula/internal/domain/invitation"
	apperr "github.com/mula/mula/internal/platform/errors"
)

type InvitationHandler struct{ svc *invapp.Service }

func NewInvitationHandler(svc *invapp.Service) *InvitationHandler {
	return &InvitationHandler{svc: svc}
}

type sectionDTO struct {
	ID       string         `json:"id"`
	Type     string         `json:"type"`
	Position int            `json:"position"`
	Visible  bool           `json:"visible"`
	Content  map[string]any `json:"content"`
}
type invitationDTO struct {
	ID              string       `json:"id"`
	Palette         string       `json:"palette"`
	ContentLanguage string       `json:"content_language"`
	TemplateID      *string      `json:"template_id"`
	RSVPDeadline    *string      `json:"rsvp_deadline"`
	Theme           themeDTO     `json:"theme"`
	Published       bool         `json:"published"`
	Sections        []sectionDTO `json:"sections"`
}

// themeDTO is the theme object on the wire: always present, {} when the host changed nothing.
type themeDTO struct {
	Palette     string            `json:"palette,omitempty"`
	FontPairing string            `json:"fontPairing,omitempty"`
	Motion      string            `json:"motion,omitempty"`
	Tokens      map[string]string `json:"tokens,omitempty"`
}

func toThemeDTO(t invitation.Theme) themeDTO {
	return themeDTO{Palette: t.Palette, FontPairing: t.FontPairing, Motion: t.Motion, Tokens: t.Tokens}
}

func toInvitationDTO(i *invitation.Invitation) invitationDTO {
	secs := make([]sectionDTO, 0, len(i.Sections))
	for _, s := range i.Sections {
		secs = append(secs, sectionDTO{ID: s.ID, Type: s.Type, Position: s.Position, Visible: s.Visible, Content: s.Content})
	}
	return invitationDTO{
		ID: i.ID, Palette: i.Palette, ContentLanguage: i.ContentLanguage, TemplateID: i.TemplateID, RSVPDeadline: rfc3339(i.RSVPDeadline),
		Theme: toThemeDTO(i.Theme), Published: i.Published(), Sections: secs,
	}
}

type invitationPatchReq struct {
	Palette         *string   `json:"palette"`
	ContentLanguage *string   `json:"content_language"`
	TemplateID      *string   `json:"template_id"`
	RSVPDeadline    *string   `json:"rsvp_deadline"`
	Theme           *themeDTO `json:"theme"`
}
type addSectionReq struct {
	Type    string         `json:"type"`
	Content map[string]any `json:"content"`
}
type sectionPatchReq struct {
	Type    *string        `json:"type"`
	Visible *bool          `json:"visible"`
	Content map[string]any `json:"content"`
}
type reorderReq struct {
	Order []string `json:"order"`
}

func (h *InvitationHandler) write(w http.ResponseWriter, r *http.Request, inv *invitation.Invitation, err error) {
	if err != nil {
		writeErr(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, toInvitationDTO(inv))
}

func (h *InvitationHandler) Get(w http.ResponseWriter, r *http.Request) {
	inv, err := h.svc.Get(r.Context(), eventID(r.Context()))
	h.write(w, r, inv, err)
}

func (h *InvitationHandler) Update(w http.ResponseWriter, r *http.Request) {
	var req invitationPatchReq
	if !decode(w, r, &req) {
		return
	}
	if req.RSVPDeadline != nil && *req.RSVPDeadline != "" {
		if _, err := time.Parse(time.RFC3339, *req.RSVPDeadline); err != nil {
			writeErr(w, r, validationErr(map[string]string{"rsvp_deadline": "must be RFC3339 (or empty to clear)"}))
			return
		}
	}
	patch := invapp.UpdatePatch{Palette: req.Palette, ContentLanguage: req.ContentLanguage, TemplateID: req.TemplateID, RSVPDeadline: req.RSVPDeadline}
	if req.Theme != nil {
		patch.Theme = &invitation.Theme{Palette: req.Theme.Palette, FontPairing: req.Theme.FontPairing, Motion: req.Theme.Motion, Tokens: req.Theme.Tokens}
	}
	inv, err := h.svc.Update(r.Context(), eventID(r.Context()), patch)
	h.write(w, r, inv, err)
}

func (h *InvitationHandler) AddSection(w http.ResponseWriter, r *http.Request) {
	var req addSectionReq
	if !decode(w, r, &req) {
		return
	}
	if strings.TrimSpace(req.Type) == "" {
		writeErr(w, r, validationErr(map[string]string{"type": "required"}))
		return
	}
	inv, err := h.svc.AddSection(r.Context(), eventID(r.Context()), req.Type, req.Content)
	h.write(w, r, inv, err)
}

func (h *InvitationHandler) UpdateSection(w http.ResponseWriter, r *http.Request) {
	var req sectionPatchReq
	if !decode(w, r, &req) {
		return
	}
	inv, err := h.svc.UpdateSection(r.Context(), eventID(r.Context()), r.PathValue("sid"),
		invapp.SectionPatch{Type: req.Type, Visible: req.Visible, Content: req.Content})
	h.write(w, r, inv, err)
}

func (h *InvitationHandler) DeleteSection(w http.ResponseWriter, r *http.Request) {
	inv, err := h.svc.DeleteSection(r.Context(), eventID(r.Context()), r.PathValue("sid"))
	h.write(w, r, inv, err)
}

func (h *InvitationHandler) Reorder(w http.ResponseWriter, r *http.Request) {
	var req reorderReq
	if !decode(w, r, &req) {
		return
	}
	inv, err := h.svc.Reorder(r.Context(), eventID(r.Context()), req.Order)
	h.write(w, r, inv, err)
}

func (h *InvitationHandler) Publish(w http.ResponseWriter, r *http.Request) {
	token, err := h.svc.Publish(r.Context(), eventID(r.Context()), CurrentUser(r.Context()).Verified())
	if err != nil {
		writeErr(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"token": token, "url": "/invite/" + token})
}

func (h *InvitationHandler) Unpublish(w http.ResponseWriter, r *http.Request) {
	if err := h.svc.Unpublish(r.Context(), eventID(r.Context())); err != nil {
		writeErr(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// templateDTO is a catalog entry. The first six fields are what the admin picker has always read; the rest come
// from the synced manifest and are absent for a row that has none yet.
type templateDTO struct {
	ID              string   `json:"id"`
	Slug            string   `json:"slug"`
	Name            string   `json:"name"`
	Category        string   `json:"category"`
	Tags            []string `json:"tags"`
	Palette         string   `json:"palette"`
	Kind            string   `json:"kind"`
	Status          string   `json:"status"`
	Access          string   `json:"access"`
	Version         int      `json:"version"`
	Thumbnail       *string  `json:"thumbnail"`
	ThumbnailMobile *string  `json:"thumbnail_mobile"`
	Customizable    any      `json:"customizable"`
	Capabilities    any      `json:"capabilities"`
	Marketing       any      `json:"marketing"`
}

func toTemplateDTO(t invitation.Template) templateDTO {
	tags := []string{}
	for _, x := range strings.Split(t.Tags, "·") {
		if x = strings.TrimSpace(x); x != "" {
			tags = append(tags, x)
		}
	}
	d := templateDTO{ID: t.ID, Slug: t.Slug, Name: t.Name, Category: t.Category, Tags: tags, Palette: t.Palette, Kind: t.Kind, Status: t.Status, Access: t.Access, Version: t.Version,
		Customizable: t.Manifest["customizable"], Capabilities: t.Manifest["capabilities"], Marketing: t.Manifest["marketing"]}
	if th, _ := t.Manifest["thumbnail"].(string); th != "" {
		u := "/templates/" + t.Slug + "/" + th // served by the web app (public/templates/<slug>/)
		d.Thumbnail = &u
	}
	if th, _ := t.Manifest["thumbnailMobile"].(string); th != "" {
		u := "/templates/" + t.Slug + "/" + th
		d.ThumbnailMobile = &u
	}
	return d
}

// Templates lists the design catalog. Public and cacheable: it holds no per-user data.
func (h *InvitationHandler) Templates(w http.ResponseWriter, r *http.Request) {
	ts, err := h.svc.Templates(r.Context())
	if err != nil {
		writeErr(w, r, err)
		return
	}
	data := make([]templateDTO, 0, len(ts))
	for _, t := range ts {
		data = append(data, toTemplateDTO(t))
	}
	w.Header().Set("Cache-Control", "public, max-age=300")
	writeJSON(w, http.StatusOK, map[string]any{"data": data})
}

// Template returns one entry with its full manifest (the generic editor and the landing detail page read it).
func (h *InvitationHandler) Template(w http.ResponseWriter, r *http.Request) {
	t, err := h.svc.Template(r.Context(), r.PathValue("slug"))
	if err != nil {
		if errors.Is(err, invitation.ErrBadTemplate) {
			writeErr(w, r, apperr.NotFound())
			return
		}
		writeErr(w, r, err)
		return
	}
	w.Header().Set("Cache-Control", "public, max-age=300")
	writeJSON(w, http.StatusOK, map[string]any{"template": toTemplateDTO(*t), "manifest": t.Manifest})
}
