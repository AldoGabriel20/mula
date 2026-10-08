package clientip

import (
	"net/http"
	"testing"
)

func req(peer string, xff ...string) *http.Request {
	r, _ := http.NewRequest("GET", "/", nil)
	r.RemoteAddr = peer
	for _, v := range xff {
		r.Header.Add("X-Forwarded-For", v)
	}
	return r
}

func TestResolver(t *testing.T) {
	trust := func(s string) *Resolver {
		r, err := Parse(s)
		if err != nil {
			t.Fatal(err)
		}
		return r
	}
	cases := []struct {
		name string
		r    *Resolver
		req  *http.Request
		want string
	}{
		{"no proxies configured: XFF is ignored (anyone could forge it)", trust(""), req("203.0.113.9:5555", "1.2.3.4"), "203.0.113.9"},
		{"direct client, trusted list set but peer not in it: XFF ignored", trust("10.0.0.0/8"), req("203.0.113.9:5555", "1.2.3.4"), "203.0.113.9"},
		{"trusted proxy, single XFF hop", trust("10.0.0.0/8"), req("10.0.0.2:1", "198.51.100.7"), "198.51.100.7"},
		{"client forges a leading hop: we take the RIGHTMOST untrusted, not the forged left one", trust("10.0.0.0/8"), req("10.0.0.2:1", "6.6.6.6, 198.51.100.7"), "198.51.100.7"},
		{"chain through two of our proxies", trust("10.0.0.0/8"), req("10.0.0.3:1", "198.51.100.7, 10.0.0.2"), "198.51.100.7"},
		{"multiple XFF header lines are joined in order", trust("10.0.0.0/8"), req("10.0.0.2:1", "6.6.6.6", "198.51.100.7"), "198.51.100.7"},
		{"all hops trusted → fall back to the peer", trust("10.0.0.0/8"), req("10.0.0.2:1", "10.0.0.9"), "10.0.0.2"},
		{"trusted proxy but no XFF → peer", trust("10.0.0.0/8"), req("10.0.0.2:1"), "10.0.0.2"},
		{"garbage in XFF is not trusted: stop at it", trust("10.0.0.0/8"), req("10.0.0.2:1", "not-an-ip"), "10.0.0.2"},
		{"IPv6 client behind a trusted v6 proxy", trust("fd00::/8"), req("[fd00::1]:1", "2001:db8::5"), "2001:db8::5"},
		{"bare IP (no /len) is accepted", trust("127.0.0.1"), req("127.0.0.1:9", "198.51.100.7"), "198.51.100.7"},
		{"nil resolver is safe and trusts nobody", nil, req("203.0.113.9:1", "1.2.3.4"), "203.0.113.9"},
		{"peer without a port", trust(""), req("203.0.113.9"), "203.0.113.9"},
	}
	for _, c := range cases {
		if got := c.r.IP(c.req); got != c.want {
			t.Errorf("%s: got %q want %q", c.name, got, c.want)
		}
	}
}

func TestParseRejectsGarbage(t *testing.T) {
	for _, bad := range []string{"nope", "10.0.0.0/99", "10.0.0.0/8, banana", "1.2.3"} {
		if _, err := Parse(bad); err == nil {
			t.Errorf("Parse(%q) should fail loudly (a typo must not silently trust nobody or everybody)", bad)
		}
	}
	if r, err := Parse(" , ,"); err != nil || r == nil {
		t.Errorf("blank entries are ignored, got %v %v", r, err)
	}
}
