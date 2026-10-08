// Package billing holds catalog items, subscriptions and invoices.
package billing

import (
	"errors"
	"time"
)

type Item struct { // package or addon
	ID       string
	Slug     string
	Name     string
	Price    float64
	Currency string
	Features []string
}

type Subscription struct {
	ID               string
	PackageSlug      string
	PackageName      string
	ProviderRef      string
	Status           string // pending | active | canceled
	CurrentPeriodEnd *time.Time
}

type Invoice struct {
	ID          string
	ProviderRef string
	Description string
	Amount      float64
	Currency    string
	Status      string // pending | paid | failed
	IssuedAt    time.Time
}

// Order is one checkout: an optional package plus any number of add-ons, paid in a single invoice.
type Order struct {
	Package     *Item
	Addons      []Item
	Ref         string
	Description string
	Total       float64
	Currency    string
}

// OwnedAddon is an add-on the user bought (status active) or has a payment pending for.
type OwnedAddon struct {
	Slug   string
	Status string // pending | active
}

var (
	ErrAddonNotFound   = errors.New("add-on not found")
	ErrEmptyOrder      = errors.New("nothing to buy")
	ErrPackageNotFound = errors.New("package not found")
	ErrBadSignature    = errors.New("invalid webhook signature")
	ErrBadEvent        = errors.New("invalid webhook event")
)
