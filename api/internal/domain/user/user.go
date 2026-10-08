// Package user holds the user entity and its domain errors (no framework imports).
package user

import (
	"errors"
	"time"
)

type User struct {
	ID              string
	Email           string
	PasswordHash    string
	Name            string
	AvatarURL       *string
	Phone           *string
	EmailVerifiedAt *time.Time
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

func (u *User) Verified() bool { return u.EmailVerifiedAt != nil }

// Domain errors — the application layer maps these to HTTP status codes.
var (
	ErrNotFound           = errors.New("user not found")
	ErrEmailTaken         = errors.New("email already registered")
	ErrInvalidCredentials = errors.New("invalid credentials")
)
