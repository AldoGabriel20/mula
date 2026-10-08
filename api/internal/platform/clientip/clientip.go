// Package clientip derives the real client address of a request without letting a client
// forge it. X-Forwarded-For is only believed when the TCP peer is one of our own trusted
// proxies; otherwise the peer address is used as-is.
package clientip

import (
	"fmt"
	"net"
	"net/http"
	"strings"
)

// Resolver holds the trusted proxy ranges. The zero value trusts nobody (safe default).
type Resolver struct{ trusted []*net.IPNet }

// Parse builds a Resolver from a comma-separated list of CIDRs or bare IPs
// (e.g. "10.0.0.0/8, 127.0.0.1"). Empty input → trust nobody.
func Parse(list string) (*Resolver, error) {
	r := &Resolver{}
	for _, part := range strings.Split(list, ",") {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}
		if !strings.Contains(part, "/") {
			ip := net.ParseIP(part)
			if ip == nil {
				return nil, fmt.Errorf("trusted proxy %q: not an IP or CIDR", part)
			}
			bits := 32
			if ip.To4() == nil {
				bits = 128
			}
			part = fmt.Sprintf("%s/%d", ip, bits)
		}
		_, n, err := net.ParseCIDR(part)
		if err != nil {
			return nil, fmt.Errorf("trusted proxy %q: %w", part, err)
		}
		r.trusted = append(r.trusted, n)
	}
	return r, nil
}

func (r *Resolver) isTrusted(ip net.IP) bool {
	if r == nil || ip == nil {
		return false
	}
	for _, n := range r.trusted {
		if n.Contains(ip) {
			return true
		}
	}
	return false
}

// IP returns the client address for the request.
//
// Algorithm: take the TCP peer. If it is not a trusted proxy, that IS the client (anything in
// X-Forwarded-For is attacker-controlled and ignored). If it is trusted, walk the
// X-Forwarded-For chain from the RIGHT, skipping trusted hops; the first untrusted address is
// the one our own infrastructure actually observed. Entries to its left can be forged by the
// client and are never used. If every hop is trusted, fall back to the peer.
func (r *Resolver) IP(req *http.Request) string {
	peer := peerIP(req)
	if !r.isTrusted(net.ParseIP(peer)) {
		return peer
	}
	hops := strings.Split(strings.Join(req.Header.Values("X-Forwarded-For"), ","), ",")
	for i := len(hops) - 1; i >= 0; i-- {
		h := strings.TrimSpace(hops[i])
		ip := net.ParseIP(h)
		if ip == nil {
			// garbage in the chain: stop trusting anything further left, use what we have
			break
		}
		if !r.isTrusted(ip) {
			return ip.String()
		}
	}
	return peer
}

func peerIP(req *http.Request) string {
	if host, _, err := net.SplitHostPort(req.RemoteAddr); err == nil {
		return host
	}
	return req.RemoteAddr
}
