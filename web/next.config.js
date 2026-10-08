/** @type {import('next').NextConfig} */

// The Go API origin. Browser code calls same-origin relative URLs (/api/v1/...) so the
// httpOnly session cookie and the double-submit CSRF cookie just work (no CORS, no
// third-party-cookie issues); Next proxies them to the API.
const API_ORIGIN = process.env.API_ORIGIN || "http://localhost:8080";

const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next", // lets a build run without clobbering a running dev server
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    // No CSP yet: Next injects inline bootstrap scripts, so a safe policy needs per-request nonces
    // (middleware). Tracked as follow-up in SEC-001.
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      { source: "/api/v1/:path*", destination: `${API_ORIGIN}/api/v1/:path*` },
      { source: "/healthz", destination: `${API_ORIGIN}/healthz` },
    ];
  },
};

module.exports = nextConfig;
