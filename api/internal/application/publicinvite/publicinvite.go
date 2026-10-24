// Package publicinvite is the guest-facing side: read a published invitation, record opens,
// submit an RSVP, leave a wish. Everything is capability-token scoped — there is no session.
package publicinvite

import (
	"context"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/mula/mula/internal/domain/invitation"
	"github.com/mula/mula/internal/infrastructure/storage"
)

const (
	maxWishLen = 500
	maxNameLen = 80
	maxNoteLen = 300
	maxMealLen = 80
)

// Resolved is the result of resolving a token: which event, and (for a personal link) which guest.
type Resolved struct {
	EventID      string
	EventDate    *time.Time
	RSVPDeadline *time.Time
	GuestID      string // "" on the generic event link
	GuestName    string
}

type Repo interface {
	// Resolve maps a token (event public_token OR guests.token) to its published event.
	// Unknown/unpublished/deleted → invitation.ErrNotFound.
	Resolve(ctx context.Context, token string) (*Resolved, error)
	// ResolveEvent maps an event id to the same Resolved a link would give, WITHOUT the published
	// predicate (a host previews drafts). Deleted events and events with no invitation yet are
	// invitation.ErrNotFound. The caller must already have authorised access to the event.
	ResolveEvent(ctx context.Context, eventID string) (*Resolved, error)
	Page(ctx context.Context, token string, res *Resolved) (*invitation.PublicPage, error)
	// MarkOpened sets guests.opened_at on the FIRST view only (idempotent).
	MarkOpened(ctx context.Context, guestID string) error
	// SubmitRSVP upserts the guest's reply (party size capped by 1+plus_ones).
	SubmitRSVP(ctx context.Context, guestID string, in invitation.RSVPInput) error
	// AddWish stores the wish and returns its id.
	AddWish(ctx context.Context, eventID string, guestID *string, author, message string) (string, error)
	// ListWishes returns up to limit approved wishes, newest first, strictly after the cursor
	// (nil = from the newest), plus the event's total approved count. A full page is not
	// followed by an empty one: more reports whether anything is left.
	ListWishes(ctx context.Context, eventID string, limit int, after *invitation.WishCursor) (items []invitation.PublicWish, more bool, total int, err error)
}

// PublicMediaTTL is how long a photo URL on the guest page stays valid. Longer than the host's
// 15 minutes: a guest keeps the page (and its lightbox) open for a while.
const PublicMediaTTL = 6 * time.Hour

type Service struct {
	repo   Repo
	signer *storage.Signer // nil = photos are not served (seed, tests)
	now    func() time.Time
}

// NewService: sg signs the photo URLs on the page; it must be the signer the media route verifies with.
func NewService(r Repo, sg *storage.Signer) *Service {
	return &Service{repo: r, signer: sg, now: time.Now}
}

// signMedia fills page.Media with a signed URL per owned photo id (always a non-nil map).
func (s *Service) signMedia(page *invitation.PublicPage) {
	page.Media = make(map[string]string, len(page.MediaIDs))
	if s.signer == nil {
		return
	}
	for _, id := range page.MediaIDs {
		page.Media[id] = "/api/v1/media/" + id + "/file?sig=" + s.signer.Sign(id, PublicMediaTTL)
	}
}

// Get returns the page and, for a personal link, records the open (first view only).
func (s *Service) Get(ctx context.Context, token string) (*invitation.PublicPage, error) {
	if token == "" {
		return nil, invitation.ErrNotFound
	}
	res, err := s.repo.Resolve(ctx, token)
	if err != nil {
		return nil, err
	}
	page, err := s.repo.Page(ctx, token, res)
	if err != nil {
		return nil, err
	}
	s.signMedia(page)
	if res.GuestID != "" {
		// Best-effort: a tracking failure must never break the guest's page.
		_ = s.repo.MarkOpened(ctx, res.GuestID)
	}
	return page, nil
}

// Preview builds the page for an event's member from the current draft: the generic-link view
// (no guest identity, only "everyone" moments), flagged Preview. It records no open. The caller
// (an authorised event member) is responsible for access control; nothing here checks it.
func (s *Service) Preview(ctx context.Context, eventID string) (*invitation.PublicPage, error) {
	res, err := s.repo.ResolveEvent(ctx, eventID)
	if err != nil {
		return nil, err
	}
	page, err := s.repo.Page(ctx, "", res)
	if err != nil {
		return nil, err
	}
	s.signMedia(page)
	page.Preview = true
	return page, nil
}

// Exists reports whether the token maps to a published event (any link kind). Handlers call
// it BEFORE parsing a request body so an invalid token is always the same 404, regardless of
// what the body looks like.
func (s *Service) Exists(ctx context.Context, token string) error {
	if token == "" {
		return invitation.ErrNotFound
	}
	_, err := s.repo.Resolve(ctx, token)
	return err
}

// RSVP requires a PERSONAL link (a generic link has no guest identity to attach a reply to).
func (s *Service) RSVP(ctx context.Context, token string, in invitation.RSVPInput) error {
	res, err := s.repo.Resolve(ctx, token)
	if err != nil {
		return err
	}
	if res.GuestID == "" {
		return invitation.ErrRSVPNeedsGuest
	}
	if !invitation.RSVPOpenAt(res.EventDate, res.RSVPDeadline, s.now()) {
		return invitation.ErrRSVPClosed
	}
	in.Status = strings.ToLower(strings.TrimSpace(in.Status))
	if in.Status != "yes" && in.Status != "no" {
		return invitation.ErrBadRSVP
	}
	if in.Status == "no" {
		in.PartySize = 0
	} else if in.PartySize < 1 {
		return invitation.ErrBadRSVP
	}
	in.Meal = clip(in.Meal, maxMealLen)
	in.Note = clip(in.Note, maxNoteLen)
	return s.repo.SubmitRSVP(ctx, res.GuestID, in)
}

// Wish: a personal link attributes it to that guest (name taken from the guest, not the
// request); a generic link needs a name. Text is length-capped and stripped of angle brackets.
func (s *Service) Wish(ctx context.Context, token, name, message string) (*invitation.PublicWish, error) {
	res, err := s.repo.Resolve(ctx, token)
	if err != nil {
		return nil, err
	}
	message = sanitizeText(message)
	if message == "" || utf8.RuneCountInString(message) > maxWishLen {
		return nil, invitation.ErrBadRSVP
	}
	var guestID *string
	author := sanitizeText(name)
	if res.GuestID != "" {
		guestID = &res.GuestID
		author = res.GuestName // never trust a client-supplied name on a personal link
	}
	if author == "" || utf8.RuneCountInString(author) > maxNameLen {
		return nil, invitation.ErrBadRSVP
	}
	id, err := s.repo.AddWish(ctx, res.EventID, guestID, author, message)
	if err != nil {
		return nil, err
	}
	return &invitation.PublicWish{ID: id, Name: author, Message: message}, nil
}

// Wish list page sizes.
const (
	DefaultWishLimit = 20
	MaxWishLimit     = 50
)

// WishPage is one page of the guestbook.
type WishPage struct {
	Items []invitation.PublicWish
	Next  *string // opaque cursor for the next page, nil on the last one
	Total int     // approved wishes of the event
}

// Wishes lists the approved wishes of the token's event, newest first. Both link kinds may read.
// The token is resolved before the cursor is looked at, so a bad token is always the same 404.
func (s *Service) Wishes(ctx context.Context, token string, limit int, cursor string) (*WishPage, error) {
	if token == "" {
		return nil, invitation.ErrNotFound
	}
	res, err := s.repo.Resolve(ctx, token)
	if err != nil {
		return nil, err
	}
	var after *invitation.WishCursor
	if cursor != "" {
		c, err := invitation.ParseWishCursor(cursor)
		if err != nil {
			return nil, err
		}
		after = &c
	}
	if limit <= 0 {
		limit = DefaultWishLimit
	}
	limit = min(limit, MaxWishLimit)
	items, more, total, err := s.repo.ListWishes(ctx, res.EventID, limit, after)
	if err != nil {
		return nil, err
	}
	page := &WishPage{Items: items, Total: total}
	if more && len(items) > 0 {
		last := items[len(items)-1]
		next := invitation.WishCursor{At: last.CreatedAt, ID: last.ID}.String()
		page.Next = &next
	}
	return page, nil
}

func sanitizeText(s string) string {
	return strings.TrimSpace(strings.NewReplacer("<", "", ">", "").Replace(s))
}

func clip(p *string, max int) *string {
	if p == nil {
		return nil
	}
	v := sanitizeText(*p)
	if v == "" {
		return nil
	}
	if r := []rune(v); len(r) > max {
		v = string(r[:max])
	}
	return &v
}
