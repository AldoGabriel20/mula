"use client";

import { useState } from "react";
import { InviteError, submitRsvp, type InviteGuest } from "@/lib/api/invite";
import styles from "./invite.module.css";

type Props = { token: string; guest: InviteGuest };

export function RsvpForm({ token, guest }: Props) {
  const [status, setStatus] = useState(guest.rsvp_status);
  const [party, setParty] = useState(Math.max(1, guest.party_size || 1));
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState(guest.rsvp_status === "pending");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const send = async (s: "yes" | "no") => {
    setBusy(true);
    setError("");
    try {
      await submitRsvp(token, { status: s, party_size: s === "yes" ? party : 0, note: note || undefined });
      setStatus(s);
      setEditing(false);
    } catch (e) {
      if (e instanceof InviteError && e.code === "rsvp_closed") setError("Replies for this celebration are now closed.");
      else if (e instanceof InviteError && e.status === 404) setError("This invitation is no longer available.");
      else setError("We couldn't send your reply. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!editing && status === "yes") {
    return (
      <div className={styles.done} role="status">
        <svg width="56" height="36" viewBox="0 0 64 40" fill="none" aria-hidden="true">
          <path className={styles.draw} d="M8 38V24a24 24 0 0 1 48 0v14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" pathLength="100" />
          <circle cx="8" cy="34" r="5" fill="currentColor" />
        </svg>
        <div className={styles.doneTitle}>See you there, {guest.name}.</div>
        <button type="button" className={styles.btn} onClick={() => setEditing(true)}>
          Change my reply
        </button>
      </div>
    );
  }
  if (!editing && status === "no") {
    return (
      <div className={styles.done} role="status">
        <div className={styles.doneTitle}>You’ll be missed, {guest.name}.</div>
        <button type="button" className={styles.btn} onClick={() => setEditing(true)}>
          Change my reply
        </button>
      </div>
    );
  }

  return (
    <div className={styles.form}>
      <h2 className={styles.h2}>Will you join us?</h2>
      {error && <div className={styles.error} role="alert">{error}</div>}
      {guest.max_party > 1 && (
        <label className={styles.field}>
          Number of guests (including you)
          <select className={styles.input} value={party} onChange={(e) => setParty(Number(e.target.value))}>
            {Array.from({ length: guest.max_party }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className={styles.field}>
        A note for the hosts (optional)
        <input className={styles.input} value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} />
      </label>
      <div className={styles.btnRow}>
        <button type="button" className={`${styles.btn} ${styles.btnFill}`} disabled={busy} onClick={() => send("yes")}>
          Joyfully accept
        </button>
        <button type="button" className={styles.btn} disabled={busy} onClick={() => send("no")}>
          Regretfully decline
        </button>
      </div>
    </div>
  );
}

export default RsvpForm;
