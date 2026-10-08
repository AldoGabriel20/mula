package postgres

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	appgift "github.com/mula/mula/internal/application/gift"
	"github.com/mula/mula/internal/domain/gift"
)

type GiftRepo struct{ pool *pgxpool.Pool }

func NewGiftRepo(pool *pgxpool.Pool) *GiftRepo { return &GiftRepo{pool: pool} }

const giftCols = `id, event_id, title, description, target_amount, url, position, quantity, claimed`

func scanGift(row pgx.Row) (*gift.Gift, error) {
	var g gift.Gift
	if err := row.Scan(&g.ID, &g.EventID, &g.Title, &g.Description, &g.TargetAmount, &g.URL, &g.Position, &g.Quantity, &g.Claimed); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, gift.ErrGiftNotFound
		}
		return nil, err
	}
	return &g, nil
}

func (r *GiftRepo) ListGifts(ctx context.Context, eventID string) ([]gift.Gift, error) {
	rows, err := r.pool.Query(ctx, `SELECT `+giftCols+` FROM gifts WHERE event_id=$1 ORDER BY position`, eventID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []gift.Gift{}
	for rows.Next() {
		var g gift.Gift
		if err := rows.Scan(&g.ID, &g.EventID, &g.Title, &g.Description, &g.TargetAmount, &g.URL, &g.Position, &g.Quantity, &g.Claimed); err != nil {
			return nil, err
		}
		out = append(out, g)
	}
	return out, rows.Err()
}

func (r *GiftRepo) GetGift(ctx context.Context, id string) (*gift.Gift, error) {
	return scanGift(r.pool.QueryRow(ctx, `SELECT `+giftCols+` FROM gifts WHERE id=$1`, id))
}

func (r *GiftRepo) CreateGift(ctx context.Context, eventID string, in appgift.GiftInput) (*gift.Gift, error) {
	return scanGift(r.pool.QueryRow(ctx,
		`INSERT INTO gifts (event_id, title, description, target_amount, url, quantity, position)
		 VALUES ($1,$2,$3,$4,$5,GREATEST($6,1),(SELECT COALESCE(MAX(position),-1)+1 FROM gifts WHERE event_id=$1))
		 RETURNING `+giftCols, eventID, in.Title, in.Description, in.TargetAmount, in.URL, in.Quantity))
}

func (r *GiftRepo) UpdateGift(ctx context.Context, id string, p appgift.GiftPatch) (*gift.Gift, error) {
	return scanGift(r.pool.QueryRow(ctx,
		`UPDATE gifts SET title=COALESCE($2,title), description=COALESCE($3,description),
		   target_amount=COALESCE($4,target_amount), url=COALESCE($5,url),
		   quantity=COALESCE($6,quantity), claimed=COALESCE($7,claimed), updated_at=now()
		 WHERE id=$1 RETURNING `+giftCols, id, p.Title, p.Description, p.TargetAmount, p.URL, p.Quantity, p.Claimed))
}

func (r *GiftRepo) DeleteGift(ctx context.Context, id string) error {
	ct, err := r.pool.Exec(ctx, `DELETE FROM gifts WHERE id=$1`, id)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return gift.ErrGiftNotFound
	}
	return nil
}

func (r *GiftRepo) ListTransactions(ctx context.Context, eventID string) ([]gift.Transaction, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, gift_id, provider_ref, amount::float8, currency, from_name, status, created_at
		 FROM transactions WHERE event_id=$1 ORDER BY created_at DESC`, eventID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []gift.Transaction{}
	for rows.Next() {
		var t gift.Transaction
		if err := rows.Scan(&t.ID, &t.GiftID, &t.ProviderRef, &t.Amount, &t.Currency, &t.FromName, &t.Status, &t.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

func (r *GiftRepo) ListWishes(ctx context.Context, eventID string) ([]gift.Wish, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, event_id, author_name, message, phase, approved, created_at
		 FROM wishes WHERE event_id=$1 ORDER BY created_at DESC`, eventID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []gift.Wish{}
	for rows.Next() {
		var w gift.Wish
		if err := rows.Scan(&w.ID, &w.EventID, &w.AuthorName, &w.Message, &w.Phase, &w.Approved, &w.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, w)
	}
	return out, rows.Err()
}

func (r *GiftRepo) SetWishApproved(ctx context.Context, eventID, id string, approved bool) error {
	ct, err := r.pool.Exec(ctx, `UPDATE wishes SET approved=$3 WHERE id=$1 AND event_id=$2`, id, eventID, approved)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return gift.ErrWishNotFound
	}
	return nil
}

const mediaCols = `id, event_id, kind, storage_key, content_type, size_bytes, created_at`

func scanMedia(row pgx.Row) (*gift.Media, error) {
	var m gift.Media
	if err := row.Scan(&m.ID, &m.EventID, &m.Kind, &m.StorageKey, &m.ContentType, &m.SizeBytes, &m.CreatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, gift.ErrMediaNotFound
		}
		return nil, err
	}
	return &m, nil
}

func (r *GiftRepo) ListMedia(ctx context.Context, eventID string) ([]gift.Media, error) {
	rows, err := r.pool.Query(ctx, `SELECT `+mediaCols+` FROM media WHERE event_id=$1 ORDER BY created_at DESC`, eventID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []gift.Media{}
	for rows.Next() {
		var m gift.Media
		if err := rows.Scan(&m.ID, &m.EventID, &m.Kind, &m.StorageKey, &m.ContentType, &m.SizeBytes, &m.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, m)
	}
	return out, rows.Err()
}

func (r *GiftRepo) GetMedia(ctx context.Context, id string) (*gift.Media, error) {
	return scanMedia(r.pool.QueryRow(ctx, `SELECT `+mediaCols+` FROM media WHERE id=$1`, id))
}

func (r *GiftRepo) CreateMedia(ctx context.Context, m gift.Media, uploadedBy string) (*gift.Media, error) {
	// url is the authenticated serve path (no public blob URL) — filled after we know the id via the same insert.
	return scanMedia(r.pool.QueryRow(ctx,
		`INSERT INTO media (event_id, kind, storage_key, url, content_type, size_bytes, uploaded_by)
		 VALUES ($1,$2,$3,'',$4,$5,$6) RETURNING `+mediaCols,
		m.EventID, m.Kind, m.StorageKey, m.ContentType, m.SizeBytes, uploadedBy))
}

func (r *GiftRepo) DeleteMedia(ctx context.Context, id string) error {
	ct, err := r.pool.Exec(ctx, `DELETE FROM media WHERE id=$1`, id)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return gift.ErrMediaNotFound
	}
	return nil
}

// ---- ways to give ----------------------------------------------------------------------------

const methodCols = `id, event_id, type, title, detail, copy_value, position`

func scanMethod(row pgx.Row) (*gift.Method, error) {
	var m gift.Method
	if err := row.Scan(&m.ID, &m.EventID, &m.Type, &m.Title, &m.Detail, &m.CopyValue, &m.Position); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, gift.ErrMethodNotFound
		}
		return nil, err
	}
	return &m, nil
}

func (r *GiftRepo) ListMethods(ctx context.Context, eventID string) ([]gift.Method, error) {
	rows, err := r.pool.Query(ctx, `SELECT `+methodCols+` FROM gift_methods WHERE event_id=$1 ORDER BY position`, eventID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []gift.Method{}
	for rows.Next() {
		var m gift.Method
		if err := rows.Scan(&m.ID, &m.EventID, &m.Type, &m.Title, &m.Detail, &m.CopyValue, &m.Position); err != nil {
			return nil, err
		}
		out = append(out, m)
	}
	return out, rows.Err()
}

func (r *GiftRepo) GetMethod(ctx context.Context, id string) (*gift.Method, error) {
	return scanMethod(r.pool.QueryRow(ctx, `SELECT `+methodCols+` FROM gift_methods WHERE id=$1`, id))
}

func (r *GiftRepo) CreateMethod(ctx context.Context, eventID string, in appgift.MethodInput) (*gift.Method, error) {
	return scanMethod(r.pool.QueryRow(ctx,
		`INSERT INTO gift_methods (event_id, type, title, detail, copy_value, position)
		 VALUES ($1,$2,$3,$4,$5,(SELECT COALESCE(MAX(position),-1)+1 FROM gift_methods WHERE event_id=$1))
		 RETURNING `+methodCols, eventID, in.Type, in.Title, in.Detail, in.CopyValue))
}

func (r *GiftRepo) UpdateMethod(ctx context.Context, id string, p appgift.MethodPatch) (*gift.Method, error) {
	return scanMethod(r.pool.QueryRow(ctx,
		`UPDATE gift_methods SET type=COALESCE($2,type), title=COALESCE($3,title), detail=COALESCE($4,detail),
		   copy_value=COALESCE($5,copy_value), updated_at=now() WHERE id=$1 RETURNING `+methodCols,
		id, p.Type, p.Title, p.Detail, p.CopyValue))
}

func (r *GiftRepo) DeleteMethod(ctx context.Context, id string) error {
	ct, err := r.pool.Exec(ctx, `DELETE FROM gift_methods WHERE id=$1`, id)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return gift.ErrMethodNotFound
	}
	return nil
}

func (r *GiftRepo) ReorderMethods(ctx context.Context, eventID string, ids []string) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx) //nolint:errcheck
	for i, id := range ids {
		if _, err := tx.Exec(ctx, `UPDATE gift_methods SET position=$3, updated_at=now() WHERE id=$1 AND event_id=$2`, id, eventID, i); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}
