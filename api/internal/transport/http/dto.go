package http

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"time"

	"github.com/mula/mula/internal/application/auth"
	"github.com/mula/mula/internal/domain/billing"
	"github.com/mula/mula/internal/domain/event"
	"github.com/mula/mula/internal/domain/gift"
	"github.com/mula/mula/internal/domain/guest"
	"github.com/mula/mula/internal/domain/invitation"
	"github.com/mula/mula/internal/domain/ops"
	"github.com/mula/mula/internal/domain/schedule"
	"github.com/mula/mula/internal/domain/settings"
	"github.com/mula/mula/internal/domain/task"
	"github.com/mula/mula/internal/domain/user"
	apperr "github.com/mula/mula/internal/platform/errors"
	tmw "github.com/mula/mula/internal/transport/http/middleware"
)

// ---- requests ----

type registerReq struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
}
type loginReq struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}
type tokenReq struct {
	Token string `json:"token"`
}
type emailReq struct {
	Email string `json:"email"`
}
type resetReq struct {
	Token    string `json:"token"`
	Password string `json:"password"`
}
type updateMeReq struct {
	Name      string  `json:"name"`
	AvatarURL *string `json:"avatar_url"` // nil = unchanged, "" = clear
	Phone     *string `json:"phone"`      // nil = unchanged, "" = clear
}
type changePasswordReq struct {
	Current string `json:"current"`
	New     string `json:"new"`
}
type createEventReq struct {
	Type      string  `json:"type"`
	CoupleA   *string `json:"couple_a"`
	CoupleB   *string `json:"couple_b"`
	EventDate *string `json:"event_date"`
	Venue     *string `json:"venue"`
	Timezone  *string `json:"timezone"`
}
type patchEventReq struct {
	Type      *string `json:"type"`
	CoupleA   *string `json:"couple_a"`
	CoupleB   *string `json:"couple_b"`
	EventDate *string `json:"event_date"`
	Venue     *string `json:"venue"`
	Timezone  *string `json:"timezone"`
}

// ---- responses ----

type userDTO struct {
	ID        string  `json:"id"`
	Email     string  `json:"email"`
	Name      string  `json:"name"`
	AvatarURL *string `json:"avatar_url"`
	Phone     *string `json:"phone"`
	Verified  bool    `json:"verified"`
	CreatedAt string  `json:"created_at"`
}

func toUserDTO(u *user.User) userDTO {
	return userDTO{
		ID:        u.ID,
		Email:     u.Email,
		Name:      u.Name,
		AvatarURL: u.AvatarURL,
		Phone:     u.Phone,
		Verified:  u.Verified(),
		CreatedAt: u.CreatedAt.UTC().Format(time.RFC3339),
	}
}

type eventDTO struct {
	ID        string  `json:"id"`
	OwnerID   string  `json:"owner_id"`
	Type      string  `json:"type"`
	CoupleA   *string `json:"couple_a"`
	CoupleB   *string `json:"couple_b"`
	EventDate *string `json:"event_date"`
	Venue     *string `json:"venue"`
	Timezone  string  `json:"timezone"`
	Status    string  `json:"status"`
	CreatedAt string  `json:"created_at"`
}

func toEventDTO(e *event.Event) eventDTO {
	var date *string
	if e.EventDate != nil {
		s := e.EventDate.UTC().Format(time.RFC3339)
		date = &s
	}
	return eventDTO{
		ID:        e.ID,
		OwnerID:   e.OwnerID,
		Type:      e.Type,
		CoupleA:   e.CoupleA,
		CoupleB:   e.CoupleB,
		EventDate: date,
		Venue:     e.Venue,
		Timezone:  e.Timezone,
		Status:    e.Status,
		CreatedAt: e.CreatedAt.UTC().Format(time.RFC3339),
	}
}

// ---- helpers ----

func decode(w http.ResponseWriter, r *http.Request, dst any) bool {
	dec := json.NewDecoder(io.LimitReader(r.Body, 1<<20)) // 1MB cap
	dec.DisallowUnknownFields()
	if err := dec.Decode(dst); err != nil {
		writeErr(w, r, apperr.BadRequest("invalid JSON body"))
		return false
	}
	return true
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if body != nil {
		_ = json.NewEncoder(w).Encode(body)
	}
}

func writeErr(w http.ResponseWriter, r *http.Request, err error) {
	apperr.Write(w, tmw.RequestID(r.Context()), mapError(err))
}

// mapError turns domain/service errors into the HTTP error envelope.
func mapError(err error) error {
	var incomplete *invitation.IncompleteError
	var badContent *invitation.ContentError
	switch {
	case errors.As(err, &badContent):
		return apperr.Validation(badContent.Fields)
	case errors.As(err, &incomplete):
		e := apperr.New(http.StatusUnprocessableEntity, "invitation_incomplete", "add and show the required sections before publishing")
		e.Fields = map[string]string{}
		for _, m := range incomplete.Missing {
			e.Fields[m] = "required section is missing or hidden"
		}
		return e
	case errors.Is(err, invitation.ErrRSVPNeedsGuest):
		return apperr.New(http.StatusForbidden, "personal_link_required", "open your own invitation link to reply")
	case errors.Is(err, invitation.ErrRSVPClosed):
		return apperr.New(http.StatusUnprocessableEntity, "rsvp_closed", "replies are closed for this event")
	case errors.Is(err, invitation.ErrBadRSVP):
		return apperr.Validation(map[string]string{"request": "invalid reply"})
	case errors.Is(err, invitation.ErrBadCursor):
		return apperr.Validation(map[string]string{"cursor": "invalid cursor"})
	case errors.Is(err, invitation.ErrNotVerified):
		return apperr.New(http.StatusUnprocessableEntity, "email_not_verified", "verify your email before publishing")
	case errors.Is(err, invitation.ErrBadTemplate):
		return apperr.Validation(map[string]string{"template_id": "unknown template"})
	case errors.Is(err, event.ErrMemberNotFound):
		return apperr.NotFound()
	case errors.Is(err, event.ErrMemberExists):
		return apperr.Conflict("member_exists", "that email is already on the team")
	case errors.Is(err, event.ErrOwnerImmutable):
		return apperr.New(http.StatusUnprocessableEntity, "owner_immutable", "the owner's membership cannot be changed or removed")
	case errors.Is(err, event.ErrBadRole):
		return apperr.Validation(map[string]string{"role": "must be cohost, planner, family or usher"})
	case errors.Is(err, user.ErrEmailTaken):
		return apperr.Conflict("email_taken", "email already registered")
	case errors.Is(err, user.ErrInvalidCredentials):
		return apperr.Unauthorized()
	case errors.Is(err, user.ErrNotFound):
		return apperr.NotFound()
	case errors.Is(err, event.ErrNotFound):
		return apperr.NotFound()
	case errors.Is(err, guest.ErrNotFound):
		return apperr.NotFound()
	case errors.Is(err, invitation.ErrNotFound), errors.Is(err, invitation.ErrSectionNotFound):
		return apperr.NotFound()
	case errors.Is(err, schedule.ErrNotFound), errors.Is(err, task.ErrNotFound), errors.Is(err, ops.ErrGuestNotFound):
		return apperr.NotFound()
	case errors.Is(err, gift.ErrGiftNotFound), errors.Is(err, gift.ErrMethodNotFound), errors.Is(err, gift.ErrWishNotFound), errors.Is(err, gift.ErrMediaNotFound):
		return apperr.NotFound()
	case errors.Is(err, settings.ErrInvalid):
		return apperr.Validation(map[string]string{"preferences": "locale must be id|my|en and theme light|dark|system"})
	case errors.Is(err, billing.ErrAddonNotFound):
		return apperr.Validation(map[string]string{"addons": "unknown add-on"})
	case errors.Is(err, billing.ErrEmptyOrder):
		return apperr.Validation(map[string]string{"package": "choose a package or at least one add-on"})
	case errors.Is(err, billing.ErrPackageNotFound):
		return apperr.NotFound()
	case errors.Is(err, billing.ErrBadSignature):
		return apperr.New(http.StatusUnauthorized, "bad_signature", "invalid webhook signature")
	case errors.Is(err, billing.ErrBadEvent):
		return apperr.BadRequest("invalid webhook event")
	case errors.Is(err, gift.ErrBadMedia):
		return apperr.New(http.StatusUnsupportedMediaType, "unsupported_media", "only JPEG, PNG or WebP images are allowed")
	case errors.Is(err, gift.ErrMediaTooLarge):
		return apperr.New(http.StatusRequestEntityTooLarge, "media_too_large", "image must be 5 MB or smaller")
	case errors.Is(err, ops.ErrBadStatus):
		return apperr.Validation(map[string]string{"status": "must be offline, scheduled or live"})
	case errors.Is(err, auth.ErrTokenInvalid):
		return apperr.BadRequest("token invalid or expired")
	case errors.Is(err, auth.ErrWeakPassword):
		return apperr.Validation(map[string]string{"password": "must be at least 8 characters"})
	case errors.Is(err, auth.ErrSessionInvalid):
		return apperr.Unauthorized()
	default:
		return err // → 500 via apperr.Write
	}
}
