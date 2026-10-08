package http

import (
	"regexp"
	"strings"

	apperr "github.com/mula/mula/internal/platform/errors"
)

var emailRe = regexp.MustCompile(`^[^@\s]+@[^@\s]+\.[^@\s]+$`)

func validationErr(fields map[string]string) error { return apperr.Validation(fields) }

func validateRegister(req registerReq) map[string]string {
	f := map[string]string{}
	if !emailRe.MatchString(strings.TrimSpace(req.Email)) {
		f["email"] = "must be a valid email"
	}
	if len(req.Password) < 8 {
		f["password"] = "must be at least 8 characters"
	}
	if strings.TrimSpace(req.Name) == "" {
		f["name"] = "required"
	}
	if len(f) == 0 {
		return nil
	}
	return f
}
