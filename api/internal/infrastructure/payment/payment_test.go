package payment

import (
	"context"
	"strconv"
	"strings"
	"testing"
	"time"
)

func TestDevProviderWebhookVerification(t *testing.T) {
	p := NewDev("s3cret", "/pay")
	body := []byte(`{"ref":"dev_abc","status":"paid"}`)
	now := strconv.FormatInt(time.Now().Unix(), 10)
	good := p.Sign(body, now)

	t.Run("valid", func(t *testing.T) {
		ev, err := p.VerifyWebhook(body, good, now)
		if err != nil || ev.Ref != "dev_abc" || ev.Status != "paid" {
			t.Fatalf("got %+v err=%v", ev, err)
		}
	})
	bad := map[string]func() error{
		"wrong signature": func() error { _, e := p.VerifyWebhook(body, strings.Repeat("0", 64), now); return e },
		"empty signature": func() error { _, e := p.VerifyWebhook(body, "", now); return e },
		"tampered body": func() error {
			_, e := p.VerifyWebhook([]byte(`{"ref":"dev_abc","status":"failed"}`), good, now)
			return e
		},
		"non-numeric ts": func() error { _, e := p.VerifyWebhook(body, good, "yesterday"); return e },
		"empty ts":       func() error { _, e := p.VerifyWebhook(body, good, ""); return e },
		"stale ts": func() error {
			old := strconv.FormatInt(time.Now().Add(-10*time.Minute).Unix(), 10)
			_, e := p.VerifyWebhook(body, p.Sign(body, old), old)
			return e
		},
		"future ts": func() error {
			f := strconv.FormatInt(time.Now().Add(10*time.Minute).Unix(), 10)
			_, e := p.VerifyWebhook(body, p.Sign(body, f), f)
			return e
		},
		"different secret": func() error {
			_, e := NewDev("other", "/pay").VerifyWebhook(body, good, now)
			return e
		},
		// signature is bound to the timestamp: reusing a valid sig with a fresh ts must fail
		"ts swapped under same sig": func() error {
			later := strconv.FormatInt(time.Now().Add(time.Second).Unix(), 10)
			_, e := p.VerifyWebhook(body, good, later)
			return e
		},
	}
	for name, f := range bad {
		t.Run(name, func(t *testing.T) {
			if err := f(); err == nil {
				t.Fatal("must be rejected")
			}
		})
	}
}

func TestCheckoutRefsAreUnique(t *testing.T) {
	p := NewDev("x", "/pay")
	seen := map[string]bool{}
	for i := 0; i < 500; i++ {
		c, err := p.CreateCheckout(context.Background(), 1, "IDR", "x")
		if err != nil || seen[c.Ref] || !strings.HasPrefix(c.Ref, "dev_") {
			t.Fatalf("bad/duplicate ref %q err=%v", c.Ref, err)
		}
		seen[c.Ref] = true
	}
}
