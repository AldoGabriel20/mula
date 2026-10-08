// Package overview computes the dashboard overview: nine-part readiness, guest
// journey, smart segments, timeline, and rule-based Mula Notes (docs/06, docs/07).
//
// NOTE: readiness parts for guests/rsvp/schedule/gift/seating/checkin/live and the
// journey/segment counts require the guest/invitation/schedule domains, which are
// later BE tasks. Until those tables exist this computes the parts derivable from
// the event + membership and reports the rest as pending (score 0) — deterministic
// and correctly shaped, so no consumer changes when the data lands.
package overview

import (
	"context"

	"github.com/mula/mula/internal/domain/event"
)

type Part struct {
	Key   string `json:"key"`
	Label string `json:"label"`
	Done  bool   `json:"done"`
	Score int    `json:"score"` // 0..100
}
type Readiness struct {
	Score int    `json:"score"`
	Parts []Part `json:"parts"`
}
type JourneyStage struct {
	Stage   string `json:"stage"`
	Count   int    `json:"count"`
	Caption string `json:"caption"`
	Status  string `json:"status"` // done | next | up
}
type Segment struct {
	Key    string `json:"key"`
	Label  string `json:"label"`
	Count  int    `json:"count"`
	Action string `json:"action"`
}
type Milestone struct {
	Key    string `json:"key"`
	Label  string `json:"label"`
	Date   string `json:"date"`
	Status string `json:"status"`
}
type Note struct {
	ID     string `json:"id"`
	Kind   string `json:"kind"`
	Title  string `json:"title"`
	Body   string `json:"body"`
	Action string `json:"action"`
}
type Overview struct {
	Readiness Readiness      `json:"readiness"`
	Journey   []JourneyStage `json:"journey"`
	Segments  []Segment      `json:"segments"`
	Timeline  []Milestone    `json:"timeline"`
	Notes     []Note         `json:"notes"`
}

// GuestStats are the guest/RSVP aggregates the overview reads (from the guest domain).
type GuestStats struct {
	Total, Opened, Responded                    int
	NotOpened, NoReply, VIP, PlusOnes, FollowUp int
}

// TaskStats are the host-checklist counts (tasks domain).
type TaskStats struct{ Total, Done int }

type Repo interface {
	MemberCount(ctx context.Context, eventID string) (int, error)
	TaskStats(ctx context.Context, eventID string) (TaskStats, error)
	GuestStats(ctx context.Context, eventID string) (GuestStats, error)
	DismissedKeys(ctx context.Context, eventID, userID string) (map[string]bool, error)
	Dismiss(ctx context.Context, eventID, userID, key string) error
}

// ActivityItem is one line of the recent-activity feed (overview + notification panel).
type ActivityItem struct {
	Kind  string `json:"kind"` // rsvp | open | wish | checkin | task | guest | team
	Actor string `json:"actor"`
	Text  string `json:"text"`
	At    string `json:"at"` // RFC 3339
}

// ActivityRepo is read-only and separate from Repo so the dashboard maths stays testable with a small fake.
type ActivityRepo interface {
	Activity(ctx context.Context, eventID string, limit int) ([]ActivityItem, error)
}

type Service struct {
	repo     Repo
	activity ActivityRepo
}

func NewService(r Repo) *Service { return &Service{repo: r} }

// WithActivity enables the feed.
func (s *Service) WithActivity(a ActivityRepo) *Service {
	s.activity = a
	return s
}

// Activity returns the newest events first. limit is clamped to 1..50 (default 12).
func (s *Service) Activity(ctx context.Context, eventID string, limit int) ([]ActivityItem, error) {
	if limit <= 0 {
		limit = 12
	}
	if limit > 50 {
		limit = 50
	}
	if s.activity == nil {
		return []ActivityItem{}, nil
	}
	return s.activity.Activity(ctx, eventID, limit)
}

func stageStatus(n int) string {
	if n > 0 {
		return "done"
	}
	return "up"
}

func nonEmpty(p *string) bool { return p != nil && *p != "" }
func detailsComplete(e *event.Event) bool {
	return nonEmpty(e.CoupleA) && nonEmpty(e.CoupleB) && e.EventDate != nil && nonEmpty(e.Venue)
}

// the nine readiness parts, in display order (docs/07)
var partDefs = []struct{ key, label string }{
	{"invitation", "Invitation"},
	{"guests", "Guests"},
	{"rsvp", "RSVP"},
	{"schedule", "Schedule"},
	{"gift", "Gifts"},
	{"seating", "Seating"},
	{"checkin", "Check-in"},
	{"live", "Live stream"},
	{"final", "Final checks"},
}

func (s *Service) Compute(ctx context.Context, e *event.Event, userID string) (*Overview, error) {
	members, err := s.repo.MemberCount(ctx, e.ID)
	if err != nil {
		return nil, err
	}
	gs, err := s.repo.GuestStats(ctx, e.ID)
	if err != nil {
		return nil, err
	}
	ts, err := s.repo.TaskStats(ctx, e.ID)
	if err != nil {
		return nil, err
	}
	dismissed, err := s.repo.DismissedKeys(ctx, e.ID, userID)
	if err != nil {
		return nil, err
	}

	details := detailsComplete(e)
	published := e.Status == "published"
	done := map[string]bool{
		"invitation": details,
		"guests":     gs.Total > 0,
		"rsvp":       gs.Responded > 0,
		"final":      published && ts.Total > 0 && ts.Done == ts.Total,
	}

	parts := make([]Part, 0, len(partDefs))
	doneCount := 0
	for _, d := range partDefs {
		p := Part{Key: d.key, Label: d.label, Done: done[d.key]}
		if p.Done {
			p.Score = 100
			doneCount++
		}
		parts = append(parts, p)
	}
	score := (doneCount * 100) / len(partDefs)

	journey := []JourneyStage{
		{"Sent", gs.Total, "Guests on the list", stageStatus(gs.Total)},
		{"Opened", gs.Opened, "", stageStatus(gs.Opened)},
		{"Replied", gs.Responded, "", stageStatus(gs.Responded)},
		{"Reminder", 0, "", "up"},
		{"Event day", 0, "", "up"},
		{"Thank you", 0, "", "up"},
	}
	segments := []Segment{
		{"not_opened", "Not opened", gs.NotOpened, "Send reminder"},
		{"no_reply", "Opened · no reply", gs.NoReply, "Nudge"},
		{"vip", "VIP", gs.VIP, "View"},
		{"plus_ones", "Plus-ones", gs.PlusOnes, "View"},
		{"follow_up", "Needs follow-up", gs.FollowUp, "Follow up"},
	}

	timeline := []Milestone{{"today", "Today", "", "now"}}
	if e.EventDate != nil {
		timeline = append(timeline, Milestone{"event_day", "Event day", e.EventDate.UTC().Format("2006-01-02"), "up"})
	}

	notes := s.notes(e, members, details, published, ts, dismissed)

	return &Overview{
		Readiness: Readiness{Score: score, Parts: parts},
		Journey:   journey,
		Segments:  segments,
		Timeline:  timeline,
		Notes:     notes,
	}, nil
}

func (s *Service) notes(e *event.Event, members int, details, published bool, ts TaskStats, dismissed map[string]bool) []Note {
	var all []Note
	if open := ts.Total - ts.Done; open > 0 {
		all = append(all, Note{"tasks", "To do", "You have open tasks", "Finish your checklist to be fully ready for the day.", "View tasks"})
	}
	if !details {
		all = append(all, Note{"details", "Next up", "Add your event details", "Names, date and venue power your invitation and your readiness score.", "Edit details"})
	}
	if members <= 1 {
		all = append(all, Note{"team", "Team", "Invite your co-hosts", "Share the work — add cohosts, planners or family to your celebration.", "Invite team"})
	}
	if details && !published {
		all = append(all, Note{"publish", "Ready", "Publish your invitation", "Your details look set. Publish to start sharing with guests.", "Publish"})
	}
	out := make([]Note, 0, len(all))
	for _, n := range all {
		if !dismissed[n.ID] {
			out = append(out, n)
		}
	}
	return out
}

func (s *Service) DismissNote(ctx context.Context, eventID, userID, key string) error {
	return s.repo.Dismiss(ctx, eventID, userID, key)
}
