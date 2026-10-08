package http

import (
	"crypto/rand"
	"encoding/base64"
	"net/http"

	"github.com/mula/mula/internal/application/auth"
	"github.com/mula/mula/internal/platform/clientip"
)

type AuthHandler struct {
	svc    *auth.Service
	secure bool
	ip     *clientip.Resolver
}

func NewAuthHandler(svc *auth.Service, secure bool, ip *clientip.Resolver) *AuthHandler {
	return &AuthHandler{svc: svc, secure: secure, ip: ip}
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req registerReq
	if !decode(w, r, &req) {
		return
	}
	if fields := validateRegister(req); fields != nil {
		writeErr(w, r, validationErr(fields))
		return
	}
	u, err := h.svc.Register(r.Context(), req.Email, req.Password, req.Name)
	if err != nil {
		writeErr(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, toUserDTO(u))
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req loginReq
	if !decode(w, r, &req) {
		return
	}
	u, sess, err := h.svc.Login(r.Context(), req.Email, req.Password, r.UserAgent(), h.ip.IP(r))
	if err != nil {
		writeErr(w, r, err)
		return
	}
	setAuthCookies(w, sess.ID, genCSRF(), sess.ExpiresAt, h.secure)
	writeJSON(w, http.StatusOK, toUserDTO(u))
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	if c, err := r.Cookie(sessionCookie); err == nil && c.Value != "" {
		_ = h.svc.Logout(r.Context(), c.Value)
	}
	clearAuthCookies(w, h.secure)
	w.WriteHeader(http.StatusNoContent)
}

func (h *AuthHandler) Verify(w http.ResponseWriter, r *http.Request) {
	var req tokenReq
	if !decode(w, r, &req) {
		return
	}
	if err := h.svc.VerifyEmail(r.Context(), req.Token); err != nil {
		writeErr(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *AuthHandler) ResendVerification(w http.ResponseWriter, r *http.Request) {
	var req emailReq
	if !decode(w, r, &req) {
		return
	}
	if err := h.svc.ResendVerification(r.Context(), req.Email); err != nil {
		writeErr(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *AuthHandler) Forgot(w http.ResponseWriter, r *http.Request) {
	var req emailReq
	if !decode(w, r, &req) {
		return
	}
	if err := h.svc.ForgotPassword(r.Context(), req.Email); err != nil {
		writeErr(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *AuthHandler) Reset(w http.ResponseWriter, r *http.Request) {
	var req resetReq
	if !decode(w, r, &req) {
		return
	}
	if err := h.svc.ResetPassword(r.Context(), req.Token, req.Password); err != nil {
		writeErr(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func genCSRF() string {
	b := make([]byte, 24)
	_, _ = rand.Read(b)
	return base64.RawURLEncoding.EncodeToString(b)
}
