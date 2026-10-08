package http

import (
	"io"
	"net/http"
	"strings"
	"time"

	giftapp "github.com/mula/mula/internal/application/gift"
	"github.com/mula/mula/internal/domain/gift"
	apperr "github.com/mula/mula/internal/platform/errors"
)

type GiftHandler struct{ svc *giftapp.Service }

func NewGiftHandler(svc *giftapp.Service) *GiftHandler { return &GiftHandler{svc: svc} }

type giftDTO struct {
	ID           string   `json:"id"`
	Title        string   `json:"title"`
	Description  string   `json:"description"`
	TargetAmount *float64 `json:"target_amount"`
	URL          *string  `json:"url"`
	Quantity     int      `json:"quantity"`
	Claimed      int      `json:"claimed"`
}
type giftReq struct {
	Title        string   `json:"title"`
	Description  string   `json:"description"`
	TargetAmount *float64 `json:"target_amount"`
	URL          *string  `json:"url"`
	Quantity     int      `json:"quantity"`
}
type giftPatchReq struct {
	Title        *string  `json:"title"`
	Description  *string  `json:"description"`
	TargetAmount *float64 `json:"target_amount"`
	URL          *string  `json:"url"`
	Quantity     *int     `json:"quantity"`
	Claimed      *int     `json:"claimed"`
}
type wishApproveReq struct {
	Approved bool `json:"approved"`
}

func toGiftDTO(g *gift.Gift) giftDTO {
	return giftDTO{ID: g.ID, Title: g.Title, Description: g.Description, TargetAmount: g.TargetAmount, URL: g.URL, Quantity: g.Quantity, Claimed: g.Claimed}
}

// validURL allows only http(s) links (gift URLs render as hrefs → block javascript: etc.).
func validURL(u *string) bool {
	if u == nil || *u == "" {
		return true
	}
	return strings.HasPrefix(*u, "https://") || strings.HasPrefix(*u, "http://")
}

func (h *GiftHandler) ListGifts(w http.ResponseWriter, r *http.Request) {
	gs, err := h.svc.ListGifts(r.Context(), eventID(r.Context()))
	if err != nil {
		writeErr(w, r, err)
		return
	}
	data := make([]giftDTO, 0, len(gs))
	for i := range gs {
		data = append(data, toGiftDTO(&gs[i]))
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": data})
}

func (h *GiftHandler) CreateGift(w http.ResponseWriter, r *http.Request) {
	var req giftReq
	if !decode(w, r, &req) {
		return
	}
	f := map[string]string{}
	if strings.TrimSpace(req.Title) == "" {
		f["title"] = "required"
	}
	if !validURL(req.URL) {
		f["url"] = "must start with http:// or https://"
	}
	if req.Quantity < 0 {
		f["quantity"] = "must be 1 or more"
	}
	if req.TargetAmount != nil && *req.TargetAmount < 0 {
		f["target_amount"] = "must not be negative"
	}
	if len(f) > 0 {
		writeErr(w, r, validationErr(f))
		return
	}
	g, err := h.svc.CreateGift(r.Context(), eventID(r.Context()), giftapp.GiftInput{Title: req.Title, Description: req.Description, TargetAmount: req.TargetAmount, URL: req.URL, Quantity: req.Quantity})
	if err != nil {
		writeErr(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, toGiftDTO(g))
}

func (h *GiftHandler) scopedGift(w http.ResponseWriter, r *http.Request) *gift.Gift {
	g, err := h.svc.GetGift(r.Context(), r.PathValue("gid"))
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

func (h *GiftHandler) PatchGift(w http.ResponseWriter, r *http.Request) {
	cur := h.scopedGift(w, r)
	if cur == nil {
		return
	}
	var req giftPatchReq
	if !decode(w, r, &req) {
		return
	}
	f := map[string]string{}
	if !validURL(req.URL) {
		f["url"] = "must start with http:// or https://"
	}
	qty, claimed := cur.Quantity, cur.Claimed
	if req.Quantity != nil {
		if *req.Quantity < 1 {
			f["quantity"] = "must be 1 or more"
		}
		qty = *req.Quantity
	}
	if req.Claimed != nil {
		claimed = *req.Claimed
	}
	if claimed < 0 || claimed > qty {
		f["claimed"] = "must be between 0 and the quantity"
	}
	if len(f) > 0 {
		writeErr(w, r, validationErr(f))
		return
	}
	g, err := h.svc.UpdateGift(r.Context(), r.PathValue("gid"), giftapp.GiftPatch{Title: req.Title, Description: req.Description, TargetAmount: req.TargetAmount, URL: req.URL, Quantity: req.Quantity, Claimed: req.Claimed})
	if err != nil {
		writeErr(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, toGiftDTO(g))
}

func (h *GiftHandler) DeleteGift(w http.ResponseWriter, r *http.Request) {
	if h.scopedGift(w, r) == nil {
		return
	}
	if err := h.svc.DeleteGift(r.Context(), r.PathValue("gid")); err != nil {
		writeErr(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *GiftHandler) ListTransactions(w http.ResponseWriter, r *http.Request) {
	ts, err := h.svc.ListTransactions(r.Context(), eventID(r.Context()))
	if err != nil {
		writeErr(w, r, err)
		return
	}
	type tx struct {
		ID       string  `json:"id"`
		Amount   float64 `json:"amount"`
		Currency string  `json:"currency"`
		FromName string  `json:"from_name"`
		Status   string  `json:"status"`
		At       string  `json:"created_at"`
	}
	data := make([]tx, 0, len(ts))
	for _, t := range ts {
		data = append(data, tx{t.ID, t.Amount, t.Currency, t.FromName, t.Status, t.CreatedAt.UTC().Format(time.RFC3339)})
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": data})
}

func (h *GiftHandler) ListWishes(w http.ResponseWriter, r *http.Request) {
	ws, err := h.svc.ListWishes(r.Context(), eventID(r.Context()))
	if err != nil {
		writeErr(w, r, err)
		return
	}
	type wish struct {
		ID         string `json:"id"`
		AuthorName string `json:"author_name"`
		Message    string `json:"message"`
		Phase      string `json:"phase"`
		Approved   bool   `json:"approved"`
		At         string `json:"created_at"`
	}
	data := make([]wish, 0, len(ws))
	for _, x := range ws {
		data = append(data, wish{x.ID, x.AuthorName, x.Message, x.Phase, x.Approved, x.CreatedAt.UTC().Format(time.RFC3339)})
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": data})
}

func (h *GiftHandler) ApproveWish(w http.ResponseWriter, r *http.Request) {
	var req wishApproveReq
	if !decode(w, r, &req) {
		return
	}
	if err := h.svc.SetWishApproved(r.Context(), eventID(r.Context()), r.PathValue("wid"), req.Approved); err != nil {
		writeErr(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

type mediaDTO struct {
	ID          string `json:"id"`
	Kind        string `json:"kind"`
	ContentType string `json:"content_type"`
	SizeBytes   int64  `json:"size_bytes"`
	URL         string `json:"url"` // authenticated serve path
}

func (h *GiftHandler) mediaDTO(m *gift.Media) mediaDTO {
	// Signed, expiring, session-less URL (works in <img> and on public pages). The token is
	// scoped to this media id; the list endpoint re-signs on every fetch.
	return mediaDTO{ID: m.ID, Kind: m.Kind, ContentType: m.ContentType, SizeBytes: m.SizeBytes,
		URL: "/api/v1/media/" + m.ID + "/file?sig=" + h.svc.SignMedia(m)}
}

func (h *GiftHandler) ListMedia(w http.ResponseWriter, r *http.Request) {
	ms, err := h.svc.ListMedia(r.Context(), eventID(r.Context()))
	if err != nil {
		writeErr(w, r, err)
		return
	}
	data := make([]mediaDTO, 0, len(ms))
	for i := range ms {
		data = append(data, h.mediaDTO(&ms[i]))
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": data})
}

// UploadMedia accepts multipart/form-data: field "file" (+ optional "kind").
func (h *GiftHandler) UploadMedia(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, giftapp.MaxMediaBytes+(1<<20)) // body cap > file cap (form overhead)
	if err := r.ParseMultipartForm(1 << 20); err != nil {
		writeErr(w, r, validationErr(map[string]string{"file": "invalid multipart upload or too large"}))
		return
	}
	f, _, err := r.FormFile("file")
	if err != nil {
		writeErr(w, r, validationErr(map[string]string{"file": "required"}))
		return
	}
	defer f.Close()
	m, err := h.svc.UploadMedia(r.Context(), eventID(r.Context()), r.FormValue("kind"), CurrentUser(r.Context()).ID, f)
	if err != nil {
		writeErr(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, h.mediaDTO(m))
}

func (h *GiftHandler) scopedMedia(w http.ResponseWriter, r *http.Request) *gift.Media {
	m, err := h.svc.GetMedia(r.Context(), r.PathValue("mid"))
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

// streamMedia writes the blob with hardened headers. The cache max-age is capped below
// the signed-URL TTL so a cached copy can't outlive the authorization that produced it.
func (h *GiftHandler) streamMedia(w http.ResponseWriter, r *http.Request, m *gift.Media) {
	rc, err := h.svc.OpenMedia(r.Context(), m)
	if err != nil {
		writeErr(w, r, apperr.NotFound())
		return
	}
	defer rc.Close()
	w.Header().Set("Content-Type", m.ContentType)
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("Content-Security-Policy", "default-src 'none'; sandbox")
	w.Header().Set("Cache-Control", "private, max-age=300")
	_, _ = io.Copy(w, rc)
}

// ServeMedia streams the blob to an authorized event member (session route).
func (h *GiftHandler) ServeMedia(w http.ResponseWriter, r *http.Request) {
	if m := h.scopedMedia(w, r); m != nil {
		h.streamMedia(w, r, m)
	}
}

// ServeSignedMedia needs no session: the HMAC token in ?sig= (scoped to this media id,
// expiring) is the authorization. Bad/expired/other-resource tokens all look like 404
// so the endpoint can't be used to probe which media ids exist.
func (h *GiftHandler) ServeSignedMedia(w http.ResponseWriter, r *http.Request) {
	m, err := h.svc.VerifySignedMedia(r.Context(), r.PathValue("mid"), r.URL.Query().Get("sig"))
	if err != nil {
		writeErr(w, r, apperr.NotFound())
		return
	}
	h.streamMedia(w, r, m)
}

func (h *GiftHandler) DeleteMedia(w http.ResponseWriter, r *http.Request) {
	m := h.scopedMedia(w, r)
	if m == nil {
		return
	}
	if err := h.svc.DeleteMedia(r.Context(), m); err != nil {
		writeErr(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ---- ways to give ------------------------------------------------------------------------------

type methodDTO struct {
	ID        string `json:"id"`
	Type      string `json:"type"`
	Title     string `json:"title"`
	Detail    string `json:"detail"`
	CopyValue string `json:"copy_value"`
	Position  int    `json:"position"`
}
type methodReq struct {
	Type      string `json:"type"`
	Title     string `json:"title"`
	Detail    string `json:"detail"`
	CopyValue string `json:"copy_value"`
}
type methodPatchReq struct {
	Type      *string `json:"type"`
	Title     *string `json:"title"`
	Detail    *string `json:"detail"`
	CopyValue *string `json:"copy_value"`
}

func toMethodDTO(m *gift.Method) methodDTO {
	return methodDTO{ID: m.ID, Type: m.Type, Title: m.Title, Detail: m.Detail, CopyValue: m.CopyValue, Position: m.Position}
}

func methodFields(typ, title, detail, copyValue *string, requireTitle bool) map[string]string {
	f := map[string]string{}
	too := func(p *string, n int) bool { return p != nil && len([]rune(*p)) > n }
	if typ != nil && !gift.ValidMethodType(*typ) {
		f["type"] = "must be bank, wallet or physical"
	}
	if requireTitle && (title == nil || strings.TrimSpace(*title) == "") {
		f["title"] = "required"
	}
	if title != nil && !requireTitle && strings.TrimSpace(*title) == "" {
		f["title"] = "required"
	}
	if too(title, 120) {
		f["title"] = "at most 120 characters"
	}
	if too(detail, 300) {
		f["detail"] = "at most 300 characters"
	}
	if too(copyValue, 300) {
		f["copy_value"] = "at most 300 characters"
	}
	return f
}

func (h *GiftHandler) ListMethods(w http.ResponseWriter, r *http.Request) {
	ms, err := h.svc.ListMethods(r.Context(), eventID(r.Context()))
	if err != nil {
		writeErr(w, r, err)
		return
	}
	data := make([]methodDTO, 0, len(ms))
	for i := range ms {
		data = append(data, toMethodDTO(&ms[i]))
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": data})
}

func (h *GiftHandler) CreateMethod(w http.ResponseWriter, r *http.Request) {
	var req methodReq
	if !decode(w, r, &req) {
		return
	}
	if f := methodFields(&req.Type, &req.Title, &req.Detail, &req.CopyValue, true); len(f) > 0 {
		writeErr(w, r, validationErr(f))
		return
	}
	m, err := h.svc.CreateMethod(r.Context(), eventID(r.Context()), giftapp.MethodInput{Type: req.Type, Title: strings.TrimSpace(req.Title), Detail: req.Detail, CopyValue: req.CopyValue})
	if err != nil {
		writeErr(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, toMethodDTO(m))
}

func (h *GiftHandler) scopedMethod(w http.ResponseWriter, r *http.Request) *gift.Method {
	m, err := h.svc.GetMethod(r.Context(), r.PathValue("mid"))
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

func (h *GiftHandler) PatchMethod(w http.ResponseWriter, r *http.Request) {
	if h.scopedMethod(w, r) == nil {
		return
	}
	var req methodPatchReq
	if !decode(w, r, &req) {
		return
	}
	if f := methodFields(req.Type, req.Title, req.Detail, req.CopyValue, false); len(f) > 0 {
		writeErr(w, r, validationErr(f))
		return
	}
	m, err := h.svc.UpdateMethod(r.Context(), r.PathValue("mid"), giftapp.MethodPatch{Type: req.Type, Title: req.Title, Detail: req.Detail, CopyValue: req.CopyValue})
	if err != nil {
		writeErr(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, toMethodDTO(m))
}

func (h *GiftHandler) DeleteMethod(w http.ResponseWriter, r *http.Request) {
	if h.scopedMethod(w, r) == nil {
		return
	}
	if err := h.svc.DeleteMethod(r.Context(), r.PathValue("mid")); err != nil {
		writeErr(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *GiftHandler) ReorderMethods(w http.ResponseWriter, r *http.Request) {
	var req reorderReq
	if !decode(w, r, &req) {
		return
	}
	if err := h.svc.ReorderMethods(r.Context(), eventID(r.Context()), req.Order); err != nil {
		writeErr(w, r, err)
		return
	}
	h.ListMethods(w, r)
}
