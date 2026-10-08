package http

import (
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func testRouter() http.Handler {
	return NewRouter(Deps{Log: slog.New(slog.NewTextHandler(io.Discard, nil)), CORSOrigin: "http://localhost:3000"})
}

func TestHealthz(t *testing.T) {
	rr := httptest.NewRecorder()
	testRouter().ServeHTTP(rr, httptest.NewRequest(http.MethodGet, "/healthz", nil))

	if rr.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rr.Code)
	}
	if !strings.Contains(rr.Body.String(), `"ok"`) {
		t.Fatalf("body = %q, want status ok", rr.Body.String())
	}
	if rr.Header().Get("X-Request-Id") == "" {
		t.Fatal("missing X-Request-Id header from middleware")
	}
}

func TestCORSPreflight(t *testing.T) {
	rr := httptest.NewRecorder()
	testRouter().ServeHTTP(rr, httptest.NewRequest(http.MethodOptions, "/healthz", nil))

	if rr.Code != http.StatusNoContent {
		t.Fatalf("preflight status = %d, want 204", rr.Code)
	}
	if got := rr.Header().Get("Access-Control-Allow-Origin"); got != "http://localhost:3000" {
		t.Fatalf("CORS origin = %q", got)
	}
}
