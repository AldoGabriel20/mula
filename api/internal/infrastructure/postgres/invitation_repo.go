package postgres

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	appinv "github.com/mula/mula/internal/application/invitation"
	"github.com/mula/mula/internal/domain/invitation"
)

type InvitationRepo struct{ pool *pgxpool.Pool }

func NewInvitationRepo(pool *pgxpool.Pool) *InvitationRepo { return &InvitationRepo{pool: pool} }

func (r *InvitationRepo) GetByEvent(ctx context.Context, eventID string) (*invitation.Invitation, error) {
	var inv invitation.Invitation
	var rawTheme []byte
	err := r.pool.QueryRow(ctx,
		`SELECT id, event_id, template_id, palette, content_language, published_at, rsvp_deadline, theme
		 FROM invitations WHERE event_id=$1`, eventID).
		Scan(&inv.ID, &inv.EventID, &inv.TemplateID, &inv.Palette, &inv.ContentLanguage, &inv.PublishedAt, &inv.RSVPDeadline, &rawTheme)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, invitation.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	_ = json.Unmarshal(rawTheme, &inv.Theme) // a malformed stored theme reads as none
	secs, err := r.sections(ctx, inv.ID)
	if err != nil {
		return nil, err
	}
	inv.Sections = secs
	return &inv, nil
}

func (r *InvitationRepo) sections(ctx context.Context, invID string) ([]invitation.Section, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, type, position, visible, content FROM invitation_sections WHERE invitation_id=$1 ORDER BY position`, invID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []invitation.Section{}
	for rows.Next() {
		var s invitation.Section
		var raw []byte
		if err := rows.Scan(&s.ID, &s.Type, &s.Position, &s.Visible, &raw); err != nil {
			return nil, err
		}
		s.Content = map[string]any{}
		if len(raw) > 0 {
			_ = json.Unmarshal(raw, &s.Content)
		}
		out = append(out, s)
	}
	return out, rows.Err()
}

func (r *InvitationRepo) Create(ctx context.Context, eventID string, sectionTypes []string) (*invitation.Invitation, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx) //nolint:errcheck
	var invID string
	if err := tx.QueryRow(ctx, `INSERT INTO invitations (event_id) VALUES ($1) RETURNING id`, eventID).Scan(&invID); err != nil {
		return nil, err
	}
	for i, typ := range sectionTypes {
		if _, err := tx.Exec(ctx,
			`INSERT INTO invitation_sections (invitation_id, type, position) VALUES ($1,$2,$3)`, invID, typ, i); err != nil {
			return nil, err
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return r.GetByEvent(ctx, eventID)
}

func (r *InvitationRepo) Update(ctx context.Context, invID string, p appinv.UpdatePatch) error {
	var theme []byte // nil = unchanged
	if p.Theme != nil {
		theme, _ = json.Marshal(p.Theme)
	}
	_, err := r.pool.Exec(ctx,
		`UPDATE invitations SET
		   palette = COALESCE($2, palette),
		   content_language = COALESCE($3, content_language),
		   template_id = COALESCE($4::uuid, template_id),
		   rsvp_deadline = CASE WHEN $5::text IS NULL THEN rsvp_deadline WHEN $5 = '' THEN NULL ELSE $5::timestamptz END,
		   theme = COALESCE($6::jsonb, theme),
		   updated_at = now()
		 WHERE id=$1`,
		invID, p.Palette, p.ContentLanguage, p.TemplateID, p.RSVPDeadline, theme)
	var pg *pgconn.PgError
	if errors.As(err, &pg) && (pg.ConstraintName == "fk_invitations_template" || pg.Code == "22P02") {
		return invitation.ErrBadTemplate
	}
	return err
}

func (r *InvitationRepo) AddSection(ctx context.Context, invID, typ string, content map[string]any) (*invitation.Section, error) {
	raw, _ := json.Marshal(content)
	var s invitation.Section
	err := r.pool.QueryRow(ctx,
		`INSERT INTO invitation_sections (invitation_id, type, position, content)
		 VALUES ($1,$2,(SELECT COALESCE(MAX(position),-1)+1 FROM invitation_sections WHERE invitation_id=$1),$3)
		 RETURNING id, type, position, visible`,
		invID, typ, string(raw)).Scan(&s.ID, &s.Type, &s.Position, &s.Visible)
	if err != nil {
		return nil, err
	}
	s.Content = content
	return &s, nil
}

func (r *InvitationRepo) UpdateSection(ctx context.Context, invID, sid string, p appinv.SectionPatch) error {
	var contentArg any
	if p.Content != nil {
		raw, _ := json.Marshal(p.Content)
		contentArg = string(raw)
	}
	ct, err := r.pool.Exec(ctx,
		`UPDATE invitation_sections SET
		   type = COALESCE($3, type),
		   visible = COALESCE($4, visible),
		   content = COALESCE($5::jsonb, content),
		   updated_at = now()
		 WHERE id=$1 AND invitation_id=$2`,
		sid, invID, p.Type, p.Visible, contentArg)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return invitation.ErrSectionNotFound
	}
	return nil
}

func (r *InvitationRepo) DeleteSection(ctx context.Context, invID, sid string) error {
	ct, err := r.pool.Exec(ctx, `DELETE FROM invitation_sections WHERE id=$1 AND invitation_id=$2`, sid, invID)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return invitation.ErrSectionNotFound
	}
	return nil
}

func (r *InvitationRepo) Reorder(ctx context.Context, invID string, sids []string) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx) //nolint:errcheck
	for i, sid := range sids {
		if _, err := tx.Exec(ctx,
			`UPDATE invitation_sections SET position=$3, updated_at=now() WHERE id=$1 AND invitation_id=$2`,
			sid, invID, i); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

func (r *InvitationRepo) Publish(ctx context.Context, eventID, invID, token string) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx) //nolint:errcheck
	if _, err := tx.Exec(ctx, `UPDATE invitations SET published_at=now(), updated_at=now() WHERE id=$1`, invID); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx,
		`UPDATE events SET status='published', public_token=COALESCE(public_token,$2), updated_at=now() WHERE id=$1`,
		eventID, token); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (r *InvitationRepo) Unpublish(ctx context.Context, eventID, invID string) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx) //nolint:errcheck
	if _, err := tx.Exec(ctx, `UPDATE invitations SET published_at=NULL, updated_at=now() WHERE id=$1`, invID); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `UPDATE events SET status='draft', public_token=NULL, updated_at=now() WHERE id=$1`, eventID); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (r *InvitationRepo) PublicToken(ctx context.Context, eventID string) (string, error) {
	var tok *string
	if err := r.pool.QueryRow(ctx, `SELECT public_token FROM events WHERE id=$1`, eventID).Scan(&tok); err != nil {
		return "", err
	}
	if tok == nil {
		return "", invitation.ErrNotFound
	}
	return *tok, nil
}

// TemplateSpec reads the sections of the template's synced manifest. A row that was never synced
// ('{}') yields a spec with no sections: picking it adds nothing and publishing falls back to hero + rsvp.
func (r *InvitationRepo) TemplateSpec(ctx context.Context, templateID string) (*invitation.TemplateSpec, error) {
	var slug string
	var raw []byte
	var version int
	err := r.pool.QueryRow(ctx, `SELECT slug, version, manifest FROM templates WHERE id=$1::uuid`, templateID).Scan(&slug, &version, &raw)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, invitation.ErrBadTemplate
	}
	if err != nil {
		return nil, err
	}
	var m struct {
		Sections []struct {
			Type              string `json:"type"`
			Required          bool   `json:"required"`
			HiddenUntilFilled bool   `json:"hiddenUntilFilled"`
			Max               int    `json:"max"`
		} `json:"sections"`
	}
	_ = json.Unmarshal(raw, &m)
	spec := &invitation.TemplateSpec{Slug: slug, Version: version, Manifest: raw}
	for _, s := range m.Sections {
		spec.Sections = append(spec.Sections, invitation.SectionRule{Type: s.Type, Required: s.Required, HiddenUntilFilled: s.HiddenUntilFilled, Max: s.Max})
	}
	return spec, nil
}

// MediaOwned returns which of ids are media rows of the event (ids that are not UUIDs are simply absent).
func (r *InvitationRepo) MediaOwned(ctx context.Context, eventID string, ids []string) (map[string]bool, error) {
	out := map[string]bool{}
	if len(ids) == 0 {
		return out, nil
	}
	rows, err := r.pool.Query(ctx, `SELECT id::text FROM media WHERE event_id=$1 AND id::text = ANY($2)`, eventID, ids)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		out[id] = true
	}
	return out, rows.Err()
}

const tplCols = `id, slug, name, category, tags, palette, kind, status, access, version, manifest`

func scanTemplate(row pgx.Row) (invitation.Template, error) {
	var t invitation.Template
	var raw []byte
	if err := row.Scan(&t.ID, &t.Slug, &t.Name, &t.Category, &t.Tags, &t.Palette, &t.Kind, &t.Status, &t.Access, &t.Version, &raw); err != nil {
		return t, err
	}
	_ = json.Unmarshal(raw, &t.Manifest)
	return t, nil
}

// ListTemplates is the picker catalog: platform rows that are active (published), in position order.
func (r *InvitationRepo) ListTemplates(ctx context.Context) ([]invitation.Template, error) {
	rows, err := r.pool.Query(ctx, `SELECT `+tplCols+` FROM templates WHERE active AND owner_id IS NULL ORDER BY position`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []invitation.Template{}
	for rows.Next() {
		t, err := scanTemplate(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

func (r *InvitationRepo) TemplateBySlug(ctx context.Context, slug string) (*invitation.Template, error) {
	t, err := scanTemplate(r.pool.QueryRow(ctx, `SELECT `+tplCols+` FROM templates WHERE slug=$1 AND active AND owner_id IS NULL`, slug))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, invitation.ErrBadTemplate
	}
	if err != nil {
		return nil, err
	}
	return &t, nil
}
