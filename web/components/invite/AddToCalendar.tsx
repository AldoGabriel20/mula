"use client";

import styles from "./invite.module.css";

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

// Builds a one-event RFC 5545 calendar in the browser (no dependency, no server round-trip).
export function buildIcs(title: string, startISO: string, venue?: string | null): string {
  const start = new Date(startISO);
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000); // default 3h
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Mula//Invitation//EN",
    "BEGIN:VEVENT",
    `UID:${stamp(start)}-${Math.abs(hash(title))}@mula`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(title)}`,
    ...(venue ? [`LOCATION:${esc(venue)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

type Props = { title: string; startISO: string | null; venue: string | null };

export function AddToCalendar({ title, startISO, venue }: Props) {
  if (!startISO) return null;
  const download = () => {
    const url = URL.createObjectURL(new Blob([buildIcs(title, startISO, venue)], { type: "text/calendar;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "invitation.ics";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <button type="button" className={styles.btn} onClick={download}>
      Add to calendar
    </button>
  );
}

export default AddToCalendar;
