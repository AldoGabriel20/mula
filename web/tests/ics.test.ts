import { describe, expect, it } from "vitest";
import { buildIcs } from "@/components/invite/AddToCalendar";

describe("buildIcs", () => {
  const ics = buildIcs("Raka & Celine", "2027-04-12T09:00:00Z", "The Glasshouse, Jakarta");

  it("is a well-formed RFC 5545 VEVENT with CRLF line endings", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR")).toBe(true);
    expect(ics).toContain("BEGIN:VEVENT\r\n");
    expect(ics).toContain("DTSTART:20270412T090000Z");
    expect(ics).toContain("DTEND:20270412T120000Z"); // default 3h
    expect(ics.split("\r\n").every((l) => !l.includes("\n"))).toBe(true);
  });

  it("escapes commas/semicolons/backslashes/newlines so values can't inject properties", () => {
    expect(ics).toContain("LOCATION:The Glasshouse\\, Jakarta");

    // A hostile title containing real CR/LF must not create extra calendar lines. What matters
    // is how a parser sees the file: split on REAL line breaks, not substring counts (the
    // escaped text legitimately still contains the characters "BEGIN:VEVENT").
    const evil = buildIcs("x\r\nBEGIN:VEVENT\r\nSUMMARY:pwned", "2027-04-12T09:00:00Z", "a;b\\c");
    const lines = evil.split("\r\n");
    expect(lines.filter((l) => l === "BEGIN:VEVENT")).toHaveLength(1);
    expect(lines.filter((l) => l.startsWith("SUMMARY:"))).toEqual(["SUMMARY:x\\nBEGIN:VEVENT\\nSUMMARY:pwned"]);
    expect(lines).toContain("LOCATION:a\\;b\\\\c"); // a\;b\\c  (";" and "\\" escaped)
  });

  it("omits LOCATION when there is no venue", () => {
    expect(buildIcs("t", "2027-04-12T09:00:00Z", null)).not.toContain("LOCATION");
  });
});
