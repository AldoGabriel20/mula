// Package payment is the payment-provider adapter (docs/10). The Provider interface
// is provider-neutral; DevProvider is a signed, in-process stand-in used until a real
// provider (QRIS / bank / e-wallet gateway) is chosen. Real providers implement the
// same two methods and verify THEIR signature scheme in VerifyWebhook.
package payment

import (
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"strconv"
	"time"
)

type Checkout struct {
	Ref string // provider reference (idempotency + webhook lookup key)
	URL string // where the user completes payment
}

// WebhookEvent is the provider-neutral result of a verified webhook.
type WebhookEvent struct {
	Ref    string `json:"ref"`
	Status string `json:"status"` // paid | failed
}

type Provider interface {
	// CreateCheckout starts a payment for amount and returns its reference + pay URL.
	CreateCheckout(ctx context.Context, amount float64, currency, description string) (Checkout, error)
	// VerifyWebhook authenticates the raw body against the signature headers and
	// returns the parsed event, or an error when the signature is bad/stale.
	VerifyWebhook(body []byte, signature, timestamp string) (WebhookEvent, error)
}

var ErrBadSignature = errors.New("bad webhook signature")

const webhookTolerance = 5 * time.Minute

// DevProvider signs webhooks with HMAC-SHA256 over "<timestamp>.<body>" using a shared secret.
type DevProvider struct {
	secret  []byte
	payBase string
}

func NewDev(secret, payBase string) *DevProvider {
	return &DevProvider{secret: []byte(secret), payBase: payBase}
}

func (d *DevProvider) CreateCheckout(_ context.Context, _ float64, _, _ string) (Checkout, error) {
	b := make([]byte, 12)
	_, _ = rand.Read(b)
	ref := "dev_" + hex.EncodeToString(b)
	return Checkout{Ref: ref, URL: d.payBase + "/" + ref}, nil
}

func (d *DevProvider) Sign(body []byte, timestamp string) string {
	m := hmac.New(sha256.New, d.secret)
	m.Write([]byte(timestamp + "."))
	m.Write(body)
	return hex.EncodeToString(m.Sum(nil))
}

func (d *DevProvider) VerifyWebhook(body []byte, signature, timestamp string) (WebhookEvent, error) {
	ts, err := strconv.ParseInt(timestamp, 10, 64)
	if err != nil {
		return WebhookEvent{}, ErrBadSignature
	}
	// reject stale/future timestamps → limits replay of a captured webhook
	if age := time.Since(time.Unix(ts, 0)); age > webhookTolerance || age < -webhookTolerance {
		return WebhookEvent{}, ErrBadSignature
	}
	want := d.Sign(body, timestamp)
	if !hmac.Equal([]byte(want), []byte(signature)) { // constant-time
		return WebhookEvent{}, ErrBadSignature
	}
	var ev WebhookEvent
	if err := json.Unmarshal(body, &ev); err != nil {
		return WebhookEvent{}, err
	}
	return ev, nil
}
