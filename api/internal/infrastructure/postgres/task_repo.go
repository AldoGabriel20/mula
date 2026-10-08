package postgres

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	apptask "github.com/mula/mula/internal/application/task"
	"github.com/mula/mula/internal/domain/task"
)

type TaskRepo struct{ pool *pgxpool.Pool }

func NewTaskRepo(pool *pgxpool.Pool) *TaskRepo { return &TaskRepo{pool: pool} }

const taskCols = `id, event_id, title, priority, done, due_at, position, category`

func scanTask(row pgx.Row) (*task.Task, error) {
	var t task.Task
	if err := row.Scan(&t.ID, &t.EventID, &t.Title, &t.Priority, &t.Done, &t.DueAt, &t.Position, &t.Category); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, task.ErrNotFound
		}
		return nil, err
	}
	return &t, nil
}

func (r *TaskRepo) List(ctx context.Context, eventID string) ([]task.Task, error) {
	rows, err := r.pool.Query(ctx, `SELECT `+taskCols+` FROM tasks WHERE event_id=$1 ORDER BY done, position`, eventID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []task.Task{}
	for rows.Next() {
		var t task.Task
		if err := rows.Scan(&t.ID, &t.EventID, &t.Title, &t.Priority, &t.Done, &t.DueAt, &t.Position, &t.Category); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

func (r *TaskRepo) Get(ctx context.Context, id string) (*task.Task, error) {
	return scanTask(r.pool.QueryRow(ctx, `SELECT `+taskCols+` FROM tasks WHERE id=$1`, id))
}

func (r *TaskRepo) Create(ctx context.Context, eventID string, in apptask.Input) (*task.Task, error) {
	due, err := parseTime(in.DueAt)
	if err != nil {
		return nil, err
	}
	return scanTask(r.pool.QueryRow(ctx,
		`INSERT INTO tasks (event_id, title, priority, due_at, category, position)
		 VALUES ($1,$2,$3,$4,$5,(SELECT COALESCE(MAX(position),-1)+1 FROM tasks WHERE event_id=$1))
		 RETURNING `+taskCols, eventID, in.Title, in.Priority, due, in.Category))
}

func (r *TaskRepo) Update(ctx context.Context, id string, p apptask.Patch) (*task.Task, error) {
	due, err := parseTime(p.DueAt)
	if err != nil {
		return nil, err
	}
	return scanTask(r.pool.QueryRow(ctx,
		`UPDATE tasks SET title=COALESCE($2,title), priority=COALESCE($3,priority),
		   done=COALESCE($4,done), due_at=COALESCE($5,due_at), category=COALESCE($6,category), updated_at=now()
		 WHERE id=$1 RETURNING `+taskCols, id, p.Title, p.Priority, p.Done, due, p.Category))
}

func (r *TaskRepo) Delete(ctx context.Context, id string) error {
	ct, err := r.pool.Exec(ctx, `DELETE FROM tasks WHERE id=$1`, id)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return task.ErrNotFound
	}
	return nil
}
