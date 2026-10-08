package http

import (
	"net/http"
	"strings"
	"time"

	taskapp "github.com/mula/mula/internal/application/task"
	"github.com/mula/mula/internal/domain/task"
	apperr "github.com/mula/mula/internal/platform/errors"
)

type TaskHandler struct{ svc *taskapp.Service }

func NewTaskHandler(svc *taskapp.Service) *TaskHandler { return &TaskHandler{svc: svc} }

type taskDTO struct {
	ID       string  `json:"id"`
	Title    string  `json:"title"`
	Priority string  `json:"priority"`
	Done     bool    `json:"done"`
	DueAt    *string `json:"due_at"`
	Position int     `json:"position"`
	Category string  `json:"category"`
}

func toTaskDTO(t *task.Task) taskDTO {
	var due *string
	if t.DueAt != nil {
		s := t.DueAt.UTC().Format(time.RFC3339)
		due = &s
	}
	return taskDTO{ID: t.ID, Title: t.Title, Priority: t.Priority, Done: t.Done, DueAt: due, Position: t.Position, Category: t.Category}
}

type taskReq struct {
	Title    string  `json:"title"`
	Priority string  `json:"priority"`
	DueAt    *string `json:"due_at"`
	Category string  `json:"category"`
}
type taskPatchReq struct {
	Title    *string `json:"title"`
	Priority *string `json:"priority"`
	Done     *bool   `json:"done"`
	DueAt    *string `json:"due_at"`
	Category *string `json:"category"`
}

func (h *TaskHandler) List(w http.ResponseWriter, r *http.Request) {
	ts, err := h.svc.List(r.Context(), eventID(r.Context()))
	if err != nil {
		writeErr(w, r, err)
		return
	}
	data := make([]taskDTO, 0, len(ts))
	for i := range ts {
		data = append(data, toTaskDTO(&ts[i]))
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": data, "counts": taskapp.CountOf(ts)})
}

func (h *TaskHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req taskReq
	if !decode(w, r, &req) {
		return
	}
	f := map[string]string{}
	if strings.TrimSpace(req.Title) == "" {
		f["title"] = "required"
	}
	if req.Priority != "" && !task.ValidPriority(req.Priority) {
		f["priority"] = "must be low, normal or high"
	}
	if len([]rune(req.Category)) > 40 {
		f["category"] = "at most 40 characters"
	}
	if len(f) > 0 {
		writeErr(w, r, validationErr(f))
		return
	}
	t, err := h.svc.Create(r.Context(), eventID(r.Context()), taskapp.Input{Title: req.Title, Priority: req.Priority, DueAt: req.DueAt, Category: strings.TrimSpace(req.Category)})
	if err != nil {
		writeErr(w, r, mapTimeErrField(err, "due_at"))
		return
	}
	writeJSON(w, http.StatusCreated, toTaskDTO(t))
}

func (h *TaskHandler) scoped(w http.ResponseWriter, r *http.Request) *task.Task {
	t, err := h.svc.Get(r.Context(), r.PathValue("tid"))
	if err != nil {
		writeErr(w, r, err)
		return nil
	}
	if t.EventID != eventID(r.Context()) {
		writeErr(w, r, apperr.NotFound())
		return nil
	}
	return t
}

func (h *TaskHandler) Patch(w http.ResponseWriter, r *http.Request) {
	if h.scoped(w, r) == nil {
		return
	}
	var req taskPatchReq
	if !decode(w, r, &req) {
		return
	}
	if req.Priority != nil && !task.ValidPriority(*req.Priority) {
		writeErr(w, r, validationErr(map[string]string{"priority": "must be low, normal or high"}))
		return
	}
	if req.Category != nil && len([]rune(*req.Category)) > 40 {
		writeErr(w, r, validationErr(map[string]string{"category": "at most 40 characters"}))
		return
	}
	t, err := h.svc.Update(r.Context(), r.PathValue("tid"), taskapp.Patch{Title: req.Title, Priority: req.Priority, Done: req.Done, DueAt: req.DueAt, Category: req.Category})
	if err != nil {
		writeErr(w, r, mapTimeErrField(err, "due_at"))
		return
	}
	writeJSON(w, http.StatusOK, toTaskDTO(t))
}

func (h *TaskHandler) Delete(w http.ResponseWriter, r *http.Request) {
	if h.scoped(w, r) == nil {
		return
	}
	if err := h.svc.Delete(r.Context(), r.PathValue("tid")); err != nil {
		writeErr(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func mapTimeErrField(err error, field string) error {
	if _, ok := err.(*time.ParseError); ok {
		return validationErr(map[string]string{field: "must be RFC3339"})
	}
	return err
}
