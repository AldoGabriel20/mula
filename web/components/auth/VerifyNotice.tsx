"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui";
import { customInstance } from "@/lib/api/fetcher";
import { ApiError } from "@/lib/api/fetcher";
import styles from "./form.module.css";

type Status = "idle" | "verifying" | "done" | "failed";

export function VerifyNotice() {
  const params = useSearchParams();
  const token = params?.get("token") || "";
  const email = params?.get("email") || "";
  const [status, setStatus] = useState<Status>(token ? "verifying" : "idle");
  const [resent, setResent] = useState(false);

  // Auto-verify when arriving via the emailed link (?token=).
  useEffect(() => {
    if (!token) return;
    let active = true;
    (async () => {
      try {
        await customInstance({ url: "/api/v1/auth/verify", method: "POST", data: { token } });
        if (active) setStatus("done");
      } catch {
        if (active) setStatus("failed");
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

  const resend = async () => {
    if (!email) return;
    try {
      await customInstance({ url: "/api/v1/auth/verify/resend", method: "POST", data: { email } });
    } catch (e) {
      if (!(e instanceof ApiError)) throw e; // resend is best-effort (always 204)
    }
    setResent(true);
  };

  if (status === "done") {
    return (
      <div className={styles.form}>
        <h1 className={styles.title}>Email verified</h1>
        <p className={styles.lede}>You&apos;re all set. Sign in to continue.</p>
        <div className={styles.footer}>
          <Link href="/login">Go to sign in</Link>
        </div>
      </div>
    );
  }

  if (status === "verifying") {
    return (
      <div className={styles.form}>
        <h1 className={styles.title}>Verifying…</h1>
        <p className={styles.lede}>One moment while we confirm your email.</p>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className={styles.form}>
        <h1 className={styles.title}>Link expired</h1>
        <p className={styles.lede}>This verification link is invalid or has expired.</p>
        {email && (
          <Button variant="primary" className={styles.submit} onClick={resend} disabled={resent}>
            {resent ? "Sent — check your inbox" : "Resend verification"}
          </Button>
        )}
        <div className={styles.footer}>
          <Link href="/login">Back to sign in</Link>
        </div>
      </div>
    );
  }

  // idle: arrived from registration, no token yet
  return (
    <div className={styles.form}>
      <h1 className={styles.title}>Check your email</h1>
      <p className={styles.lede}>
        We sent a verification link{email ? ` to ${email}` : ""}. Open it to activate your account.
      </p>
      {email && (
        <Button variant="default" className={styles.submit} onClick={resend} disabled={resent}>
          {resent ? "Sent — check your inbox" : "Resend verification"}
        </Button>
      )}
      <div className={styles.footer}>
        <Link href="/login">Back to sign in</Link>
      </div>
    </div>
  );
}

export default VerifyNotice;
