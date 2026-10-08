package middleware

import (
	"net/http"
	"sync"
	"time"
)

// RateLimit is a per-IP token bucket for abuse-prone endpoints (auth, public forms).
// ponytail: in-memory per-instance; swap for Redis if the API runs multi-replica.
// keyFn derives the bucket key (the real client IP via clientip.Resolver, or the user id for
// per-user limits). It must NOT be a raw RemoteAddr behind a proxy: every user would share one bucket.
func RateLimit(perMinute int, burst int, keyFn func(*http.Request) string) func(http.Handler) http.Handler {
	l := &limiter{
		buckets: map[string]*bucket{},
		rate:    float64(perMinute) / 60.0, // tokens per second
		burst:   float64(burst),
	}
	go l.gc()
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !l.allow(keyFn(r)) {
				w.Header().Set("Retry-After", "60")
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusTooManyRequests)
				_, _ = w.Write([]byte(`{"error":{"code":"rate_limited","message":"too many requests"}}`))
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

type bucket struct {
	tokens float64
	last   time.Time
}

type limiter struct {
	mu      sync.Mutex
	buckets map[string]*bucket
	rate    float64
	burst   float64
}

func (l *limiter) allow(key string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	now := time.Now()
	b := l.buckets[key]
	if b == nil {
		l.buckets[key] = &bucket{tokens: l.burst - 1, last: now}
		return true
	}
	b.tokens += now.Sub(b.last).Seconds() * l.rate
	if b.tokens > l.burst {
		b.tokens = l.burst
	}
	b.last = now
	if b.tokens < 1 {
		return false
	}
	b.tokens--
	return true
}

func (l *limiter) gc() {
	for range time.Tick(10 * time.Minute) {
		l.mu.Lock()
		for k, b := range l.buckets {
			if time.Since(b.last) > 15*time.Minute {
				delete(l.buckets, k)
			}
		}
		l.mu.Unlock()
	}
}
