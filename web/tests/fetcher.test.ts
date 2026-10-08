import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, customInstance } from "@/lib/api/fetcher";

const json = (status: number, body: unknown) =>
  new Response(status === 204 ? null : JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  document.cookie = "csrf_token=tok123; path=/";
});
afterEach(() => {
  vi.unstubAllGlobals();
  document.cookie = "csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
});

describe("customInstance", () => {
  it("sends credentials and echoes the CSRF cookie ONLY on mutating methods", async () => {
    fetchMock.mockResolvedValue(json(200, { ok: true }));
    await customInstance({ url: "/api/v1/x", method: "GET" });
    await customInstance({ url: "/api/v1/x", method: "POST", data: { a: 1 } });

    const [, getInit] = fetchMock.mock.calls[0];
    const [, postInit] = fetchMock.mock.calls[1];
    expect(getInit.credentials).toBe("include");
    expect(getInit.headers["X-CSRF-Token"]).toBeUndefined();
    expect(postInit.headers["X-CSRF-Token"]).toBe("tok123");
    expect(postInit.headers["Content-Type"]).toBe("application/json");
    expect(postInit.body).toBe(JSON.stringify({ a: 1 }));
  });

  it("does not force a JSON content type on FormData (browser must set the boundary)", async () => {
    fetchMock.mockResolvedValue(json(201, { id: "1" }));
    const fd = new FormData();
    fd.append("file", new Blob(["x"]), "x.png");
    await customInstance({ url: "/api/v1/media", method: "POST", data: fd });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers["Content-Type"]).toBeUndefined();
    expect(init.body).toBe(fd);
  });

  it("normalises the API error envelope into ApiError", async () => {
    fetchMock.mockResolvedValue(
      json(400, { error: { code: "validation_error", message: "validation failed", fields: { email: "required" }, request_id: "rid1" } }),
    );
    await expect(customInstance({ url: "/api/v1/x", method: "POST", data: {} })).rejects.toMatchObject({
      name: "ApiError",
      status: 400,
      code: "validation_error",
      fields: { email: "required" },
      requestId: "rid1",
    });
  });

  it("survives a non-JSON error body", async () => {
    fetchMock.mockResolvedValue(new Response("<html>bad gateway</html>", { status: 502, statusText: "Bad Gateway" }));
    const err: unknown = await customInstance({ url: "/api/v1/x", method: "GET" }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    const e = err as ApiError;
    expect(e.status).toBe(502);
    expect(e.code).toBe("error");
  });

  it("204 resolves to undefined", async () => {
    fetchMock.mockResolvedValue(json(204, null));
    await expect(customInstance({ url: "/api/v1/x", method: "DELETE" })).resolves.toBeUndefined();
  });

  it("drops undefined/null query params and encodes the rest", async () => {
    fetchMock.mockResolvedValue(json(200, {}));
    await customInstance({ url: "/api/v1/x", method: "GET", params: { q: "a b", skip: undefined, nope: null, n: 0 } });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/x?q=a+b&n=0");
  });

  it("401 redirects to /login with the current path as ?next=", async () => {
    fetchMock.mockResolvedValue(json(401, { error: { code: "unauthorized", message: "no" } }));
    const loc = { pathname: "/app/guests", search: "?q=1", href: "" };
    vi.stubGlobal("window", Object.assign(Object.create(window), { location: loc }));
    await customInstance({ url: "/api/v1/me", method: "GET" }).catch(() => undefined);
    expect(loc.href).toBe("/login?next=%2Fapp%2Fguests%3Fq%3D1");
  });

  it("a 401 from /auth/ (wrong password) is thrown to the form, not redirected", async () => {
    fetchMock.mockResolvedValue(json(401, { error: { code: "invalid_credentials", message: "Invalid email or password" } }));
    const loc = { pathname: "/login", search: "", href: "" };
    vi.stubGlobal("window", Object.assign(Object.create(window), { location: loc }));
    await expect(customInstance({ url: "/api/v1/auth/login", method: "POST", data: {} })).rejects.toMatchObject({ status: 401 });
    expect(loc.href).toBe("");
  });
});
