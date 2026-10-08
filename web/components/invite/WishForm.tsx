"use client";

import { useState } from "react";
import { InviteError, submitWish, type InviteGuest } from "@/lib/api/invite";
import styles from "./invite.module.css";

type Props = { token: string; guest: InviteGuest | null };

// Personal link: the server attributes the wish to the guest (no name field).
// Generic link: the guest types a name.
export function WishForm({ token, guest }: Props) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await submitWish(token, { name: guest ? undefined : name, message });
      setSent(true);
      setMessage("");
    } catch (err) {
      setError(err instanceof InviteError && err.status === 400 ? "Please add a short message (and your name)." : "We couldn't send your wish. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className={styles.done} role="status">
        <div className={styles.doneTitle}>Thank you — your wish is on its way.</div>
        <button type="button" className={styles.btn} onClick={() => setSent(false)}>
          Write another
        </button>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <h2 className={styles.h2}>Leave a wish</h2>
      {error && <div className={styles.error} role="alert">{error}</div>}
      {!guest && (
        <label className={styles.field}>
          Your name
          <input className={styles.input} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} required />
        </label>
      )}
      <label className={styles.field}>
        Your message
        <textarea className={styles.input} rows={3} maxLength={500} value={message} onChange={(e) => setMessage(e.target.value)} required />
      </label>
      <div className={styles.btnRow}>
        <button type="submit" className={`${styles.btn} ${styles.btnFill}`} disabled={busy || !message.trim()}>
          Send wish
        </button>
      </div>
    </form>
  );
}

export default WishForm;
