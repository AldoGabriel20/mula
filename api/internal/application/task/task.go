// Package task orchestrates task CRUD and the open/done counter.
package task

import (
	"context"

	"github.com/mula/mula/internal/domain/task"
)

type Input struct {
	Title    string
	Priority string
	DueAt    *string // RFC3339
	Category string
}
type Patch struct {
	Title    *string
	Priority *string
	Done     *bool
	DueAt    *string
	Category *string
}
type Counts struct {
	Total int `json:"total"`
	Done  int `json:"done"`
	Open  int `json:"open"`
}

type Repo interface {
	List(ctx context.Context, eventID string) ([]task.Task, error)
	Get(ctx context.Context, id string) (*task.Task, error)
	Create(ctx context.Context, eventID string, in Input) (*task.Task, error)
	Update(ctx context.Context, id string, p Patch) (*task.Task, error)
	Delete(ctx context.Context, id string) error
}

type Service struct{ repo Repo }

func NewService(r Repo) *Service { return &Service{repo: r} }

func (s *Service) List(ctx context.Context, e string) ([]task.Task, error) {
	return s.repo.List(ctx, e)
}
func (s *Service) Get(ctx context.Context, id string) (*task.Task, error) { return s.repo.Get(ctx, id) }
func (s *Service) Create(ctx context.Context, e string, in Input) (*task.Task, error) {
	if in.Priority == "" {
		in.Priority = "normal"
	}
	return s.repo.Create(ctx, e, in)
}
func (s *Service) Update(ctx context.Context, id string, p Patch) (*task.Task, error) {
	return s.repo.Update(ctx, id, p)
}
func (s *Service) Delete(ctx context.Context, id string) error { return s.repo.Delete(ctx, id) }

func CountOf(ts []task.Task) Counts {
	c := Counts{Total: len(ts)}
	for _, t := range ts {
		if t.Done {
			c.Done++
		}
	}
	c.Open = c.Total - c.Done
	return c
}
