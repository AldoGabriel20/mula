package overview

import (
	"context"
	"testing"
	"time"

	"github.com/mula/mula/internal/domain/event"
)

type fakeRepo struct {
	members   int
	dismissed map[string]bool
}

func (f *fakeRepo) MemberCount(context.Context, string) (int, error)       { return f.members, nil }
func (f *fakeRepo) GuestStats(context.Context, string) (GuestStats, error) { return GuestStats{}, nil }
func (f *fakeRepo) TaskStats(context.Context, string) (TaskStats, error)   { return TaskStats{}, nil }
func (f *fakeRepo) DismissedKeys(context.Context, string, string) (map[string]bool, error) {
	if f.dismissed == nil {
		return map[string]bool{}, nil
	}
	return f.dismissed, nil
}
func (f *fakeRepo) Dismiss(context.Context, string, string, string) error { return nil }

func ptr(s string) *string { return &s }

func TestReadinessAndNotes(t *testing.T) {
	svc := NewService(&fakeRepo{members: 1})
	bare := &event.Event{ID: "e1", Type: "wedding", Status: "draft"}

	ov, err := svc.Compute(context.Background(), bare, "u1")
	if err != nil {
		t.Fatal(err)
	}
	if len(ov.Readiness.Parts) != 9 {
		t.Fatalf("want 9 parts, got %d", len(ov.Readiness.Parts))
	}
	if ov.Readiness.Score != 0 {
		t.Fatalf("bare event score want 0, got %d", ov.Readiness.Score)
	}
	if !hasNote(ov.Notes, "details") || !hasNote(ov.Notes, "team") {
		t.Fatalf("expected details + team notes, got %+v", ov.Notes)
	}

	// details complete → invitation part done (1/9 → 11), publish note appears, details gone
	now := time.Now()
	full := &event.Event{ID: "e1", Type: "wedding", Status: "draft", CoupleA: ptr("A"), CoupleB: ptr("B"), EventDate: &now, Venue: ptr("Hall")}
	ov2, _ := svc.Compute(context.Background(), full, "u1")
	if !partDone(ov2.Readiness.Parts, "invitation") {
		t.Fatal("invitation part should be done when details complete")
	}
	if ov2.Readiness.Score != 11 {
		t.Fatalf("one of nine done → 11, got %d", ov2.Readiness.Score)
	}
	if hasNote(ov2.Notes, "details") || !hasNote(ov2.Notes, "publish") {
		t.Fatalf("expected publish note and no details note, got %+v", ov2.Notes)
	}

	// dismissed publish note is filtered out
	svc2 := NewService(&fakeRepo{members: 2, dismissed: map[string]bool{"publish": true}})
	ov3, _ := svc2.Compute(context.Background(), full, "u1")
	if hasNote(ov3.Notes, "publish") || hasNote(ov3.Notes, "team") {
		t.Fatalf("publish dismissed + team satisfied; got %+v", ov3.Notes)
	}
}

func hasNote(ns []Note, id string) bool {
	for _, n := range ns {
		if n.ID == id {
			return true
		}
	}
	return false
}
func partDone(ps []Part, key string) bool {
	for _, p := range ps {
		if p.Key == key {
			return p.Done
		}
	}
	return false
}
