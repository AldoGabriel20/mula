package storage

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"strconv"
	"strings"
	"time"
)

var ErrBadSignedURL = errors.New("invalid or expired signed url")

// Signer mints and verifies short-lived, resource-scoped tokens: "<exp>.<hmac>" where
// hmac = HMAC-SHA256(secret, "<resourceID>.<exp>"). Scoping to the media id means a
// token for one file can't be replayed against another; expiry bounds leakage. This is
// the local stand-in for an S3 presigned URL (same contract: URL works without a session).
type Signer struct {
	secret []byte
	now    func() time.Time // injectable for tests
}

func NewSigner(secret string) *Signer { return &Signer{secret: []byte(secret), now: time.Now} }

func (s *Signer) mac(resourceID string, exp int64) string {
	m := hmac.New(sha256.New, s.secret)
	m.Write([]byte(resourceID + "." + strconv.FormatInt(exp, 10)))
	return hex.EncodeToString(m.Sum(nil))
}

// Sign returns a token valid for ttl.
func (s *Signer) Sign(resourceID string, ttl time.Duration) string {
	exp := s.now().Add(ttl).Unix()
	return strconv.FormatInt(exp, 10) + "." + s.mac(resourceID, exp)
}

// Verify checks signature (constant-time) and expiry for resourceID.
func (s *Signer) Verify(resourceID, token string) error {
	expStr, sig, ok := strings.Cut(token, ".")
	if !ok {
		return ErrBadSignedURL
	}
	exp, err := strconv.ParseInt(expStr, 10, 64)
	if err != nil {
		return ErrBadSignedURL
	}
	if !hmac.Equal([]byte(s.mac(resourceID, exp)), []byte(sig)) {
		return ErrBadSignedURL
	}
	if s.now().Unix() > exp {
		return ErrBadSignedURL
	}
	return nil
}
