package postgres

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/mula/mula/internal/domain/billing"
)

type BillingRepo struct{ pool *pgxpool.Pool }

func NewBillingRepo(pool *pgxpool.Pool) *BillingRepo { return &BillingRepo{pool: pool} }

func (r *BillingRepo) list(ctx context.Context, table string) ([]billing.Item, error) {
	// table is one of two internal constants (never user input)
	rows, err := r.pool.Query(ctx, `SELECT id, slug, name, price::float8, currency, features FROM `+table+` WHERE active ORDER BY price`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []billing.Item{}
	for rows.Next() {
		var it billing.Item
		var raw []byte
		if err := rows.Scan(&it.ID, &it.Slug, &it.Name, &it.Price, &it.Currency, &raw); err != nil {
			return nil, err
		}
		_ = json.Unmarshal(raw, &it.Features)
		out = append(out, it)
	}
	return out, rows.Err()
}

func (r *BillingRepo) ListPackages(ctx context.Context) ([]billing.Item, error) {
	return r.list(ctx, "packages")
}
func (r *BillingRepo) ListAddons(ctx context.Context) ([]billing.Item, error) {
	return r.list(ctx, "addons")
}

func (r *BillingRepo) PackageBySlug(ctx context.Context, slug string) (*billing.Item, error) {
	var it billing.Item
	var raw []byte
	err := r.pool.QueryRow(ctx,
		`SELECT id, slug, name, price::float8, currency, features FROM packages WHERE slug=$1 AND active`, slug).
		Scan(&it.ID, &it.Slug, &it.Name, &it.Price, &it.Currency, &raw)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, billing.ErrPackageNotFound
	}
	if err != nil {
		return nil, err
	}
	_ = json.Unmarshal(raw, &it.Features)
	return &it, nil
}

func (r *BillingRepo) AddonsBySlug(ctx context.Context, slugs []string) ([]billing.Item, error) {
	rows, err := r.pool.Query(ctx, `SELECT id, slug, name, price::float8, currency, features FROM addons WHERE active AND slug = ANY($1) ORDER BY price`, slugs)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []billing.Item{}
	for rows.Next() {
		var it billing.Item
		var raw []byte
		if err := rows.Scan(&it.ID, &it.Slug, &it.Name, &it.Price, &it.Currency, &raw); err != nil {
			return nil, err
		}
		_ = json.Unmarshal(raw, &it.Features)
		out = append(out, it)
	}
	return out, rows.Err()
}

// CreateOrder writes the invoice (the idempotency anchor for Settle), the optional pending
// subscription and the pending add-on rows in ONE transaction.
func (r *BillingRepo) CreateOrder(ctx context.Context, userID string, o billing.Order) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx) //nolint:errcheck
	if _, err := tx.Exec(ctx,
		`INSERT INTO invoices (user_id, provider_ref, description, amount, currency, status) VALUES ($1,$2,$3,$4,$5,'pending')`,
		userID, o.Ref, o.Description, o.Total, o.Currency); err != nil {
		return err
	}
	if o.Package != nil {
		if _, err := tx.Exec(ctx,
			`INSERT INTO subscriptions (user_id, package_id, provider_ref, status) VALUES ($1,$2,$3,'pending')`,
			userID, o.Package.ID, o.Ref); err != nil {
			return err
		}
	}
	for _, a := range o.Addons {
		if _, err := tx.Exec(ctx,
			`INSERT INTO user_addons (user_id, addon_id, provider_ref, status) VALUES ($1,$2,$3,'pending')`,
			userID, a.ID, o.Ref); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

// Settle moves a pending order to paid/failed exactly once. The invoice's `status='pending'`
// guard is the single idempotency point: a replayed or unknown ref changes nothing (applied=false).
func (r *BillingRepo) Settle(ctx context.Context, ref, status string) (bool, error) {
	subStatus, periodExpr, addonStatus := "canceled", "NULL", "failed"
	if status == "paid" {
		subStatus, periodExpr, addonStatus = "active", "now() + interval '1 year'", "active"
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return false, err
	}
	defer tx.Rollback(ctx) //nolint:errcheck
	ct, err := tx.Exec(ctx, `UPDATE invoices SET status=$2 WHERE provider_ref=$1 AND status='pending'`, ref, status)
	if err != nil {
		return false, err
	}
	if ct.RowsAffected() == 0 {
		return false, nil // unknown ref or already settled
	}
	if _, err := tx.Exec(ctx,
		`UPDATE subscriptions SET status=$2, current_period_end=`+periodExpr+`, updated_at=now()
		 WHERE provider_ref=$1 AND status='pending'`, ref, subStatus); err != nil {
		return false, err
	}
	if _, err := tx.Exec(ctx,
		`UPDATE user_addons SET status=$2, updated_at=now() WHERE provider_ref=$1 AND status='pending'`, ref, addonStatus); err != nil {
		return false, err
	}
	return true, tx.Commit(ctx)
}

func (r *BillingRepo) OwnedAddons(ctx context.Context, userID string) ([]billing.OwnedAddon, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT a.slug, CASE WHEN bool_or(ua.status='active') THEN 'active' ELSE 'pending' END
		   FROM user_addons ua JOIN addons a ON a.id=ua.addon_id
		  WHERE ua.user_id=$1 AND ua.status IN ('active','pending') GROUP BY a.slug ORDER BY a.slug`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []billing.OwnedAddon{}
	for rows.Next() {
		var o billing.OwnedAddon
		if err := rows.Scan(&o.Slug, &o.Status); err != nil {
			return nil, err
		}
		out = append(out, o)
	}
	return out, rows.Err()
}

func (r *BillingRepo) Subscription(ctx context.Context, userID string) (*billing.Subscription, error) {
	var s billing.Subscription
	err := r.pool.QueryRow(ctx,
		`SELECT s.id, p.slug, p.name, s.provider_ref, s.status, s.current_period_end
		 FROM subscriptions s JOIN packages p ON p.id=s.package_id
		 WHERE s.user_id=$1
		 ORDER BY (s.status='active') DESC, s.created_at DESC LIMIT 1`, userID).
		Scan(&s.ID, &s.PackageSlug, &s.PackageName, &s.ProviderRef, &s.Status, &s.CurrentPeriodEnd)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *BillingRepo) Invoices(ctx context.Context, userID string) ([]billing.Invoice, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, provider_ref, description, amount::float8, currency, status, issued_at
		 FROM invoices WHERE user_id=$1 ORDER BY issued_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []billing.Invoice{}
	for rows.Next() {
		var i billing.Invoice
		if err := rows.Scan(&i.ID, &i.ProviderRef, &i.Description, &i.Amount, &i.Currency, &i.Status, &i.IssuedAt); err != nil {
			return nil, err
		}
		out = append(out, i)
	}
	return out, rows.Err()
}
