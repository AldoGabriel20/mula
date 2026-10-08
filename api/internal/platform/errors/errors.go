// Package errors defines the API error type and its HTTP envelope (per docs/08).
package errors

import (
	"encoding/json"
	"net/http"
)

// Error is an application error that maps to an HTTP status and the uniform
// response envelope: {"error":{code,message,fields,request_id}}.
type Error struct {
	Status  int               `json:"-"`
	Code    string            `json:"code"`
	Message string            `json:"message"`
	Fields  map[string]string `json:"fields,omitempty"`
}

func (e *Error) Error() string { return e.Code + ": " + e.Message }

func New(status int, code, message string) *Error {
	return &Error{Status: status, Code: code, Message: message}
}

// Common constructors (codes per docs/08).
func BadRequest(message string) *Error { return New(http.StatusBadRequest, "bad_request", message) }
func Unauthorized() *Error {
	return New(http.StatusUnauthorized, "unauthorized", "authentication required")
}
func Forbidden() *Error                    { return New(http.StatusForbidden, "forbidden", "not allowed") }
func NotFound() *Error                     { return New(http.StatusNotFound, "not_found", "not found") }
func Conflict(code, message string) *Error { return New(http.StatusConflict, code, message) }

// Validation returns a 400 with per-field messages.
func Validation(fields map[string]string) *Error {
	return &Error{Status: http.StatusBadRequest, Code: "validation_error", Message: "validation failed", Fields: fields}
}

// Write renders err as the error envelope. Non-*Error values become a 500
// internal_error without leaking their message.
func Write(w http.ResponseWriter, requestID string, err error) {
	apiErr, ok := err.(*Error)
	if !ok {
		apiErr = New(http.StatusInternalServerError, "internal_error", "internal server error")
	}

	body := map[string]any{
		"error": map[string]any{
			"code":       apiErr.Code,
			"message":    apiErr.Message,
			"request_id": requestID,
		},
	}
	if len(apiErr.Fields) > 0 {
		body["error"].(map[string]any)["fields"] = apiErr.Fields
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(apiErr.Status)
	_ = json.NewEncoder(w).Encode(body)
}
