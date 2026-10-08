// Single fetch wrapper used by every orval-generated hook (docs/11).
// Adds credentials + CSRF, normalizes the error envelope, redirects on 401.

export class ApiError extends Error {
  code: string;
  status: number;
  fields?: Record<string, string>;
  requestId?: string;

  constructor(status: number, code: string, message: string, fields?: Record<string, string>, requestId?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
    this.requestId = requestId;
  }
}

type RequestConfig = {
  url: string;
  method: string;
  params?: Record<string, unknown>;
  data?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const hit = document.cookie.split("; ").find((c) => c.startsWith(`${name}=`));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : undefined;
}

function buildUrl(url: string, params?: Record<string, unknown>): string {
  if (!params) return url;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) qs.append(k, String(v));
  }
  const s = qs.toString();
  return s ? `${url}?${s}` : url;
}

export const customInstance = async <T>(config: RequestConfig): Promise<T> => {
  const { url, method, params, data, headers, signal } = config;
  const h: Record<string, string> = { ...headers };

  if (data !== undefined && !(data instanceof FormData)) {
    h["Content-Type"] = h["Content-Type"] ?? "application/json";
  }
  if (MUTATING.has(method.toUpperCase())) {
    const csrf = readCookie("csrf_token");
    if (csrf) h["X-CSRF-Token"] = csrf;
  }

  const res = await fetch(buildUrl(url, params), {
    method,
    headers: h,
    credentials: "include",
    signal,
    body: data === undefined ? undefined : data instanceof FormData ? data : JSON.stringify(data),
  });

  // A 401 from an /auth/ call (wrong password, bad token) is an answer to show on the form, not an expired session.
  if (res.status === 401 && typeof window !== "undefined" && !url.startsWith("/api/v1/auth/")) {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/login?next=${next}`;
  }

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => undefined);

  if (!res.ok) {
    const e = body?.error ?? {};
    throw new ApiError(res.status, e.code ?? "error", e.message ?? res.statusText, e.fields, e.request_id);
  }

  return body as T;
};

export default customInstance;
