// Package billing orchestrates the catalog, checkout, and webhook-driven subscription state.
package billing

import (
	"context"
	"strings"

	"github.com/mula/mula/internal/domain/billing"
	"github.com/mula/mula/internal/infrastructure/payment"
)

type Repo interface {
	ListPackages(ctx context.Context) ([]billing.Item, error)
	ListAddons(ctx context.Context) ([]billing.Item, error)
	PackageBySlug(ctx context.Context, slug string) (*billing.Item, error) // ErrPackageNotFound
	// AddonsBySlug returns the ACTIVE add-ons among slugs (callers compare counts to detect unknown ones).
	AddonsBySlug(ctx context.Context, slugs []string) ([]billing.Item, error)
	// CreateOrder atomically records the pending invoice, the pending subscription (if a package is
	// part of the order) and one pending user_addons row per add-on.
	CreateOrder(ctx context.Context, userID string, o billing.Order) error
	OwnedAddons(ctx context.Context, userID string) ([]billing.OwnedAddon, error)
	// Settle applies a provider outcome idempotently. Returns false if the ref is
	// unknown or was already in a final state (replayed webhook = no-op).
	Settle(ctx context.Context, ref, status string) (applied bool, err error)
	Subscription(ctx context.Context, userID string) (*billing.Subscription, error) // nil if none
	Invoices(ctx context.Context, userID string) ([]billing.Invoice, error)
}

type Service struct {
	repo Repo
	pay  payment.Provider
}

func NewService(r Repo, p payment.Provider) *Service { return &Service{repo: r, pay: p} }

func (s *Service) Packages(ctx context.Context) ([]billing.Item, error) {
	return s.repo.ListPackages(ctx)
}
func (s *Service) Addons(ctx context.Context) ([]billing.Item, error) { return s.repo.ListAddons(ctx) }
func (s *Service) Subscription(ctx context.Context, userID string) (*billing.Subscription, error) {
	return s.repo.Subscription(ctx, userID)
}
func (s *Service) Invoices(ctx context.Context, userID string) ([]billing.Invoice, error) {
	return s.repo.Invoices(ctx, userID)
}

func (s *Service) OwnedAddons(ctx context.Context, userID string) ([]billing.OwnedAddon, error) {
	return s.repo.OwnedAddons(ctx, userID)
}

// Checkout validates the order server-side (every price comes from the DB, never the client),
// starts ONE provider payment for the sum, and records the pending state. A package slug, add-on
// slugs, or both; at least one.
func (s *Service) Checkout(ctx context.Context, userID, pkgSlug string, addonSlugs []string) (payment.Checkout, error) {
	var o billing.Order
	var names []string
	if pkgSlug != "" {
		pkg, err := s.repo.PackageBySlug(ctx, pkgSlug)
		if err != nil {
			return payment.Checkout{}, err
		}
		o.Package, o.Total, o.Currency = pkg, pkg.Price, pkg.Currency
		names = append(names, pkg.Name)
	}
	if len(addonSlugs) > 0 {
		seen := map[string]bool{}
		uniq := make([]string, 0, len(addonSlugs))
		for _, sl := range addonSlugs {
			if !seen[sl] {
				seen[sl] = true
				uniq = append(uniq, sl)
			}
		}
		ads, err := s.repo.AddonsBySlug(ctx, uniq)
		if err != nil {
			return payment.Checkout{}, err
		}
		if len(ads) != len(uniq) {
			return payment.Checkout{}, billing.ErrAddonNotFound
		}
		for _, a := range ads {
			if o.Currency != "" && a.Currency != o.Currency {
				return payment.Checkout{}, billing.ErrAddonNotFound // mixed currencies are not one payment
			}
			o.Currency = a.Currency
			o.Total += a.Price
			names = append(names, a.Name)
		}
		o.Addons = ads
	}
	if o.Package == nil && len(o.Addons) == 0 {
		return payment.Checkout{}, billing.ErrEmptyOrder
	}
	o.Description = strings.Join(names, " + ")
	co, err := s.pay.CreateCheckout(ctx, o.Total, o.Currency, o.Description)
	if err != nil {
		return payment.Checkout{}, err
	}
	o.Ref = co.Ref
	if err := s.repo.CreateOrder(ctx, userID, o); err != nil {
		return payment.Checkout{}, err
	}
	return co, nil
}

// HandleWebhook verifies the signature, then settles idempotently.
func (s *Service) HandleWebhook(ctx context.Context, body []byte, signature, timestamp string) error {
	ev, err := s.pay.VerifyWebhook(body, signature, timestamp)
	if err != nil {
		return billing.ErrBadSignature
	}
	if ev.Ref == "" || (ev.Status != "paid" && ev.Status != "failed") {
		return billing.ErrBadEvent
	}
	_, err = s.repo.Settle(ctx, ev.Ref, ev.Status)
	return err
}
