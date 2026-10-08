// Package gift orchestrates the gift registry, transactions (read), wishes and media.
package gift

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"io"
	"net/http"
	"time"

	"github.com/mula/mula/internal/domain/gift"
	"github.com/mula/mula/internal/infrastructure/storage"
)

const MaxMediaBytes = 5 << 20 // 5 MiB

// Allowed content types, decided from the file's magic bytes — never the client header.
// WebP is intentionally excluded: every upload is re-encoded to strip EXIF/GPS, and the
// standard library cannot re-encode WebP. Add it back together with a WebP encoder.
var allowedMedia = map[string]string{"image/jpeg": ".jpg", "image/png": ".png"}

// SignedURLTTL is how long a signed media URL stays valid.
const SignedURLTTL = 15 * time.Minute

type GiftInput struct {
	Title        string
	Description  string
	TargetAmount *float64
	URL          *string
	Quantity     int // 0 = 1
}
type GiftPatch struct {
	Title        *string
	Description  *string
	TargetAmount *float64
	URL          *string
	Quantity     *int
	Claimed      *int
}

type MethodInput struct {
	Type      string
	Title     string
	Detail    string
	CopyValue string
}
type MethodPatch struct {
	Type      *string
	Title     *string
	Detail    *string
	CopyValue *string
}

type Repo interface {
	ListGifts(ctx context.Context, eventID string) ([]gift.Gift, error)
	GetGift(ctx context.Context, id string) (*gift.Gift, error)
	CreateGift(ctx context.Context, eventID string, in GiftInput) (*gift.Gift, error)
	UpdateGift(ctx context.Context, id string, p GiftPatch) (*gift.Gift, error)
	DeleteGift(ctx context.Context, id string) error
	ListMethods(ctx context.Context, eventID string) ([]gift.Method, error)
	GetMethod(ctx context.Context, id string) (*gift.Method, error)
	CreateMethod(ctx context.Context, eventID string, in MethodInput) (*gift.Method, error)
	UpdateMethod(ctx context.Context, id string, p MethodPatch) (*gift.Method, error)
	DeleteMethod(ctx context.Context, id string) error
	ReorderMethods(ctx context.Context, eventID string, ids []string) error
	ListTransactions(ctx context.Context, eventID string) ([]gift.Transaction, error)
	ListWishes(ctx context.Context, eventID string) ([]gift.Wish, error)
	SetWishApproved(ctx context.Context, eventID, id string, approved bool) error
	ListMedia(ctx context.Context, eventID string) ([]gift.Media, error)
	GetMedia(ctx context.Context, id string) (*gift.Media, error)
	CreateMedia(ctx context.Context, m gift.Media, uploadedBy string) (*gift.Media, error)
	DeleteMedia(ctx context.Context, id string) error
}

type Service struct {
	repo   Repo
	store  storage.Storage
	signer *storage.Signer
}

func NewService(r Repo, s storage.Storage, sg *storage.Signer) *Service {
	return &Service{repo: r, store: s, signer: sg}
}

// SignMedia returns a short-lived token authorizing a session-less GET of this media.
func (s *Service) SignMedia(m *gift.Media) string { return s.signer.Sign(m.ID, SignedURLTTL) }

// VerifySignedMedia checks a token for mediaID and returns the media row.
func (s *Service) VerifySignedMedia(ctx context.Context, mediaID, token string) (*gift.Media, error) {
	if err := s.signer.Verify(mediaID, token); err != nil {
		return nil, storage.ErrBadSignedURL
	}
	return s.repo.GetMedia(ctx, mediaID)
}

func (s *Service) ListGifts(ctx context.Context, e string) ([]gift.Gift, error) {
	return s.repo.ListGifts(ctx, e)
}
func (s *Service) GetGift(ctx context.Context, id string) (*gift.Gift, error) {
	return s.repo.GetGift(ctx, id)
}
func (s *Service) CreateGift(ctx context.Context, e string, in GiftInput) (*gift.Gift, error) {
	return s.repo.CreateGift(ctx, e, in)
}
func (s *Service) UpdateGift(ctx context.Context, id string, p GiftPatch) (*gift.Gift, error) {
	return s.repo.UpdateGift(ctx, id, p)
}
func (s *Service) DeleteGift(ctx context.Context, id string) error { return s.repo.DeleteGift(ctx, id) }
func (s *Service) ListMethods(ctx context.Context, e string) ([]gift.Method, error) {
	return s.repo.ListMethods(ctx, e)
}
func (s *Service) GetMethod(ctx context.Context, id string) (*gift.Method, error) {
	return s.repo.GetMethod(ctx, id)
}
func (s *Service) CreateMethod(ctx context.Context, e string, in MethodInput) (*gift.Method, error) {
	return s.repo.CreateMethod(ctx, e, in)
}
func (s *Service) UpdateMethod(ctx context.Context, id string, p MethodPatch) (*gift.Method, error) {
	return s.repo.UpdateMethod(ctx, id, p)
}
func (s *Service) DeleteMethod(ctx context.Context, id string) error {
	return s.repo.DeleteMethod(ctx, id)
}
func (s *Service) ReorderMethods(ctx context.Context, e string, ids []string) error {
	return s.repo.ReorderMethods(ctx, e, ids)
}
func (s *Service) ListTransactions(ctx context.Context, e string) ([]gift.Transaction, error) {
	return s.repo.ListTransactions(ctx, e)
}
func (s *Service) ListWishes(ctx context.Context, e string) ([]gift.Wish, error) {
	return s.repo.ListWishes(ctx, e)
}
func (s *Service) SetWishApproved(ctx context.Context, e, id string, ok bool) error {
	return s.repo.SetWishApproved(ctx, e, id, ok)
}
func (s *Service) ListMedia(ctx context.Context, e string) ([]gift.Media, error) {
	return s.repo.ListMedia(ctx, e)
}
func (s *Service) GetMedia(ctx context.Context, id string) (*gift.Media, error) {
	return s.repo.GetMedia(ctx, id)
}

// UploadMedia validates the bytes (size cap + magic-byte type sniff + allowlist),
// re-encodes the image to strip EXIF/GPS and other metadata, stores the clean bytes
// under a random key, and records the row.
func (s *Service) UploadMedia(ctx context.Context, eventID, kind, uploadedBy string, r io.Reader) (*gift.Media, error) {
	data, err := io.ReadAll(io.LimitReader(r, MaxMediaBytes+1))
	if err != nil {
		return nil, err
	}
	if len(data) > MaxMediaBytes {
		return nil, gift.ErrMediaTooLarge
	}
	ct := http.DetectContentType(data)
	ext, ok := allowedMedia[ct]
	if !ok {
		return nil, gift.ErrBadMedia
	}
	// Sniffed as an image by header, but it must also fully decode — this rejects
	// truncated/polyglot files — and the re-encode drops all metadata.
	data, err = storage.StripMetadata(data, ct)
	if err != nil {
		return nil, gift.ErrBadMedia
	}
	if kind != "image" && kind != "photo" && kind != "cover" {
		kind = "photo"
	}
	key := randomKey() + ext
	if err := s.store.Put(ctx, key, data); err != nil {
		return nil, err
	}
	m, err := s.repo.CreateMedia(ctx, gift.Media{EventID: eventID, Kind: kind, StorageKey: key, ContentType: ct, SizeBytes: int64(len(data))}, uploadedBy)
	if err != nil {
		_ = s.store.Delete(ctx, key) // don't orphan the blob
		return nil, err
	}
	return m, nil
}

func (s *Service) OpenMedia(ctx context.Context, m *gift.Media) (io.ReadCloser, error) {
	return s.store.Open(ctx, m.StorageKey)
}

func (s *Service) DeleteMedia(ctx context.Context, m *gift.Media) error {
	if err := s.repo.DeleteMedia(ctx, m.ID); err != nil {
		return err
	}
	return s.store.Delete(ctx, m.StorageKey)
}

func randomKey() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
