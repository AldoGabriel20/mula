package http

import (
	"net/http"

	setapp "github.com/mula/mula/internal/application/settings"
	"github.com/mula/mula/internal/domain/settings"
)

type SettingsHandler struct{ svc *setapp.Service }

func NewSettingsHandler(svc *setapp.Service) *SettingsHandler { return &SettingsHandler{svc: svc} }

type prefsDTO struct {
	Locale        string          `json:"locale"`
	Theme         string          `json:"theme"`
	Notifications map[string]bool `json:"notifications"`
}
type prefsPatchReq struct {
	Locale        *string         `json:"locale"`
	Theme         *string         `json:"theme"`
	Notifications map[string]bool `json:"notifications"`
}

func toPrefsDTO(p settings.Preferences) prefsDTO {
	return prefsDTO{Locale: p.Locale, Theme: p.Theme, Notifications: p.Notifications}
}

func (h *SettingsHandler) GetPrefs(w http.ResponseWriter, r *http.Request) {
	p, err := h.svc.Prefs(r.Context(), CurrentUser(r.Context()).ID)
	if err != nil {
		writeErr(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, toPrefsDTO(p))
}

func (h *SettingsHandler) PatchPrefs(w http.ResponseWriter, r *http.Request) {
	var req prefsPatchReq
	if !decode(w, r, &req) {
		return
	}
	p, err := h.svc.UpdatePrefs(r.Context(), CurrentUser(r.Context()).ID, setapp.PrefPatch{Locale: req.Locale, Theme: req.Theme, Notifications: req.Notifications})
	if err != nil {
		writeErr(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, toPrefsDTO(p))
}

func (h *SettingsHandler) Referral(w http.ResponseWriter, r *http.Request) {
	ref, err := h.svc.Referral(r.Context(), CurrentUser(r.Context()).ID)
	if err != nil {
		writeErr(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"code": ref.Code, "signups": ref.Signups, "published": ref.Published, "credit_idr": ref.CreditIDR,
	})
}
