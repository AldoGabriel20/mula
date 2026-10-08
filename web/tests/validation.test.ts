import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema, forgotSchema, resetSchema } from "@/lib/validation/auth";
import { contactSchema } from "@/lib/validation/contact";

const msgs = (r: { success: boolean; error?: { issues: { message: string; path: PropertyKey[] }[] } }) =>
  r.success ? [] : r.error!.issues.map((i) => `${String(i.path[0])}:${i.message}`);

describe("auth schemas mirror the server rules", () => {
  it("login: needs a valid email and a non-empty password", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
    expect(msgs(loginSchema.safeParse({ email: "nope", password: "" }))).toEqual(
      expect.arrayContaining(["email:Enter a valid email", "password:Enter your password"]),
    );
  });

  it("register: password >= 8 (same as the API), name required, email valid", () => {
    expect(registerSchema.safeParse({ name: "A", email: "a@b.co", password: "12345678" }).success).toBe(true);
    expect(registerSchema.safeParse({ name: "A", email: "a@b.co", password: "1234567" }).success).toBe(false); // 7 chars
    expect(registerSchema.safeParse({ name: "   ", email: "a@b.co", password: "12345678" }).success).toBe(false); // whitespace name
    expect(registerSchema.safeParse({ name: "A", email: "a@b", password: "12345678" }).success).toBe(false);
  });

  it("forgot: email only", () => {
    expect(forgotSchema.safeParse({ email: "a@b.co" }).success).toBe(true);
    expect(forgotSchema.safeParse({ email: "" }).success).toBe(false);
  });

  it("reset: passwords must match, error lands on the confirm field", () => {
    expect(resetSchema.safeParse({ password: "12345678", confirm: "12345678" }).success).toBe(true);
    const r = resetSchema.safeParse({ password: "12345678", confirm: "87654321" });
    expect(msgs(r)).toEqual(["confirm:Passwords don't match"]);
    expect(resetSchema.safeParse({ password: "short", confirm: "short" }).success).toBe(false);
  });
});

describe("contact schema", () => {
  it("requires a real message", () => {
    expect(contactSchema.safeParse({ name: "A", email: "a@b.co", message: "too short" }).success).toBe(false);
    expect(contactSchema.safeParse({ name: "A", email: "a@b.co", message: "this is long enough" }).success).toBe(true);
  });
});
