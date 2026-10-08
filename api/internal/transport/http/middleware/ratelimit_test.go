package middleware

import (
	"testing"
	"time"
)

func TestLimiterBucket(t *testing.T) {
	// 60/min = 1 token/sec, burst 3
	l := &limiter{buckets: map[string]*bucket{}, rate: 1, burst: 3}

	// burst: first 3 pass, 4th is rejected
	for i := 0; i < 3; i++ {
		if !l.allow("a") {
			t.Fatalf("request %d within burst rejected", i+1)
		}
	}
	if l.allow("a") {
		t.Fatal("request beyond burst must be rejected")
	}
	// keys are independent
	if !l.allow("b") {
		t.Fatal("another IP must have its own bucket")
	}
	// refill: rewind the bucket's clock by 2s → 2 tokens back
	l.buckets["a"].last = l.buckets["a"].last.Add(-2 * time.Second)
	if !l.allow("a") || !l.allow("a") {
		t.Fatal("2 tokens should have refilled after 2s")
	}
	if l.allow("a") {
		t.Fatal("only 2 tokens refilled; third must be rejected")
	}
	// refill is capped at burst (a long idle period doesn't bank unlimited tokens)
	l.buckets["a"].last = l.buckets["a"].last.Add(-time.Hour)
	allowed := 0
	for i := 0; i < 10; i++ {
		if l.allow("a") {
			allowed++
		}
	}
	if allowed != 3 {
		t.Fatalf("after a long idle only burst(3) may pass, got %d", allowed)
	}
}
