// Package task holds the host checklist task entity.
package task

import (
	"errors"
	"time"
)

type Task struct {
	ID       string
	EventID  string
	Title    string
	Priority string
	Done     bool
	DueAt    *time.Time
	Position int
	Category string // free-form chip: Invitation, Design, Guests, … ('' = none)
}

var ErrNotFound = errors.New("task not found")

// ValidPriority reports whether p is a known priority.
func ValidPriority(p string) bool { return p == "low" || p == "normal" || p == "high" }
