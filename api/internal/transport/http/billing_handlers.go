package http

import (
	"io"
	"net/http"
	"strings"
	"time"

	billapp "github.com/mula/mula/internal/application/billing"
	"github.com/mula/mula/internal/domain/billing"
	apperr "github.com/mula/mula/internal/platform/errors"
)

type BillingHandler struct{ svc *billapp.Service }

func NewBillingHandler(svc *billapp.Service) *BillingHandler { return &BillingHandler{svc: svc} }

type itemDTO struct {
	Slug     string   `json:"slug"`
	Name     string   `json:"name"`
	Price    float64  `json:"price"`
	Currency string   `json:"currency"`
	Features []string `json:"features"`
}

func toItems(its []billing.Item) []itemDTO {
	out := make([]itemDTO, 0, len(its))
	for _, i := range its {
		f := i.Features
		if f == nil {
			f = []string{}
		}
		out = append(out, itemDTO{i.Slug, i.Name, i.Price, i.Currency, f})
	}
	return out
}

func (h *BillingHandler) Packages(w http.ResponseWriter, r *http.Request) {
	its, err := h.svc.Packages(r.Context())
	if err != nil {
		writeErr(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": toItems(its)})
}

func (h *BillingHandler) Addons(w http.ResponseWriter, r *http.Request) {
	its, err := h.svc.Addons(r.Context())
	if err != nil {
		writeErr(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": toItems(its)})
}

func (h *BillingHandler) Subscription(w http.ResponseWriter, r *http.Request) {
	s, err := h.svc.Subscription(r.Context(), CurrentUser(r.Context()).ID)
	if err != nil {
		writeErr(w, r, err)
		return
	}
	owned, err := h.svc.OwnedAddons(r.Context(), CurrentUser(r.Context()).ID)
	if err != nil {
		writeErr(w, r, err)
		return
	}
	type ownedDTO struct {
		Slug   string `json:"slug"`
		Status string `json:"status"`
	}
	addons := make([]ownedDTO, 0, len(owned))
	for _, o := range owned {
		addons = append(addons, ownedDTO{o.Slug, o.Status})
	}
	if s == nil {
		writeJSON(w, http.StatusOK, map[string]any{"subscription": nil, "addons": addons})
		return
	}
	var end *string
	if s.CurrentPeriodEnd != nil {
		e := s.CurrentPeriodEnd.UTC().Format(time.RFC3339)
		end = &e
	}
	writeJSON(w, http.StatusOK, map[string]any{"subscription": map[string]any{
		"package": s.PackageSlug, "package_name": s.PackageName, "status": s.Status, "current_period_end": end,
	}, "addons": addons})
}

func (h *BillingHandler) Invoices(w http.ResponseWriter, r *http.Request) {
	is, err := h.svc.Invoices(r.Context(), CurrentUser(r.Context()).ID)
	if err != nil {
		writeErr(w, r, err)
		return
	}
	type inv struct {
		ID          string  `json:"id"`
		Description string  `json:"description"`
		Amount      float64 `json:"amount"`
		Currency    string  `json:"currency"`
		Status      string  `json:"status"`
		IssuedAt    string  `json:"issued_at"`
	}
	data := make([]inv, 0, len(is))
	for _, i := range is {
		data = append(data, inv{i.ID, i.Description, i.Amount, i.Currency, i.Status, i.IssuedAt.UTC().Format(time.RFC3339)})
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": data})
}

type checkoutReq struct {
	Package string   `json:"package"`
	Addons  []string `json:"addons"`
}

// Checkout: price is looked up server-side from the slug — the client never sends an amount.
func (h *BillingHandler) Checkout(w http.ResponseWriter, r *http.Request) {
	var req checkoutReq
	if !decode(w, r, &req) {
		return
	}
	if strings.TrimSpace(req.Package) == "" && len(req.Addons) == 0 {
		writeErr(w, r, validationErr(map[string]string{"package": "choose a package or at least one add-on"}))
		return
	}
	if len(req.Addons) > 20 {
		writeErr(w, r, validationErr(map[string]string{"addons": "at most 20"}))
		return
	}
	co, err := h.svc.Checkout(r.Context(), CurrentUser(r.Context()).ID, strings.TrimSpace(req.Package), req.Addons)
	if err != nil {
		writeErr(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]string{"ref": co.Ref, "url": co.URL})
}

// Webhook is authenticated by the provider's signature, not a session/CSRF.
func (h *BillingHandler) Webhook(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(io.LimitReader(r.Body, 64<<10)) // 64KB cap
	if err != nil {
		writeErr(w, r, apperr.BadRequest("unreadable body"))
		return
	}
	if err := h.svc.HandleWebhook(r.Context(), body, r.Header.Get("X-Signature"), r.Header.Get("X-Timestamp")); err != nil {
		writeErr(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
