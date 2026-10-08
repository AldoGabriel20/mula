// Package gift holds the gift registry, transactions, wishes and media entities.
package gift

import (
	"errors"
	"time"
)

type Gift struct {
	ID           string
	EventID      string
	Title        string
	Description  string
	TargetAmount *float64
	URL          *string
	Position     int
	Quantity     int // how many the hosts would like
	Claimed      int // how many are already gifted (host-maintained)
}

// Method is a "way to give": a bank account, e-wallet or a physical gift address.
type Method struct {
	ID        string
	EventID   string
	Type      string // bank | wallet | physical
	Title     string
	Detail    string
	CopyValue string // the number/address guests copy in one tap
	Position  int
}

// ValidMethodType reports whether t is a known method type.
func ValidMethodType(t string) bool { return t == "bank" || t == "wallet" || t == "physical" }

type Transaction struct {
	ID          string
	GiftID      *string
	ProviderRef string
	Amount      float64
	Currency    string
	FromName    string
	Status      string
	CreatedAt   time.Time
}

type Wish struct {
	ID         string
	EventID    string
	AuthorName string
	Message    string
	Phase      string
	Approved   bool
	CreatedAt  time.Time
}

type Media struct {
	ID          string
	EventID     string
	Kind        string
	StorageKey  string
	ContentType string
	SizeBytes   int64
	CreatedAt   time.Time
}

var (
	ErrGiftNotFound   = errors.New("gift not found")
	ErrMethodNotFound = errors.New("gift method not found")
	ErrWishNotFound   = errors.New("wish not found")
	ErrMediaNotFound  = errors.New("media not found")
	ErrBadMedia       = errors.New("unsupported or invalid media")
	ErrMediaTooLarge  = errors.New("media too large")
)
