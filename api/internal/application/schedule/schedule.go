// Package schedule orchestrates schedule CRUD, reorder, and .ics export.
package schedule

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/mula/mula/internal/domain/schedule"
)

type Input struct {
	Title       string
	StartsAt    *string // RFC3339
	EndsAt      *string // RFC3339
	Venue       *string
	Address     string
	DressCode   string
	Description string
	Visibility  string // "" = everyone
}
type Patch struct {
	Title       *string
	StartsAt    *string
	EndsAt      *string
	Venue       *string
	Address     *string
	DressCode   *string
	Description *string
	Visibility  *string
}

type Repo interface {
	List(ctx context.Context, eventID string) ([]schedule.Item, error)
	Get(ctx context.Context, id string) (*schedule.Item, error)
	Create(ctx context.Context, eventID string, in Input) (*schedule.Item, error)
	Update(ctx context.Context, id string, p Patch) (*schedule.Item, error)
	Delete(ctx context.Context, id string) error
	Reorder(ctx context.Context, eventID string, ids []string) error
}

type Service struct{ repo Repo }

func NewService(r Repo) *Service { return &Service{repo: r} }

func (s *Service) List(ctx context.Context, e string) ([]schedule.Item, error) {
	return s.repo.List(ctx, e)
}
func (s *Service) Get(ctx context.Context, id string) (*schedule.Item, error) {
	return s.repo.Get(ctx, id)
}
func (s *Service) Create(ctx context.Context, e string, in Input) (*schedule.Item, error) {
	return s.repo.Create(ctx, e, in)
}
func (s *Service) Update(ctx context.Context, id string, p Patch) (*schedule.Item, error) {
	return s.repo.Update(ctx, id, p)
}
func (s *Service) Delete(ctx context.Context, id string) error { return s.repo.Delete(ctx, id) }
func (s *Service) Reorder(ctx context.Context, e string, ids []string) error {
	return s.repo.Reorder(ctx, e, ids)
}

// ICS renders an RFC 5545 calendar of the dated items (hand-rolled, no dependency).
func (s *Service) ICS(ctx context.Context, eventID, eventName string) (string, error) {
	items, err := s.repo.List(ctx, eventID)
	if err != nil {
		return "", err
	}
	var b strings.Builder
	b.WriteString("BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Mula//Schedule//EN\r\nCALSCALE:GREGORIAN\r\n")
	stamp := time.Now().UTC().Format("20060102T150405Z")
	for _, it := range items {
		if it.StartsAt == nil {
			continue
		}
		start := it.StartsAt.UTC()
		b.WriteString("BEGIN:VEVENT\r\n")
		fmt.Fprintf(&b, "UID:%s@mula\r\nDTSTAMP:%s\r\n", it.ID, stamp)
		fmt.Fprintf(&b, "DTSTART:%s\r\nDTEND:%s\r\n", start.Format("20060102T150405Z"), start.Add(time.Hour).Format("20060102T150405Z"))
		fmt.Fprintf(&b, "SUMMARY:%s\r\n", icsEscape(it.Title))
		if it.Venue != nil && *it.Venue != "" {
			fmt.Fprintf(&b, "LOCATION:%s\r\n", icsEscape(*it.Venue))
		}
		b.WriteString("END:VEVENT\r\n")
	}
	b.WriteString("END:VCALENDAR\r\n")
	_ = eventName
	return b.String(), nil
}

func icsEscape(s string) string {
	r := strings.NewReplacer(`\`, `\\`, ";", `\;`, ",", `\,`, "\n", `\n`, "\r", "")
	return r.Replace(s)
}
