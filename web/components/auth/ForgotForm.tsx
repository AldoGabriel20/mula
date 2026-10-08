"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input } from "@/components/ui";
import { customInstance } from "@/lib/api/fetcher";
import { forgotSchema, type ForgotValues } from "@/lib/validation/auth";
import { bindApiError } from "./apiError";
import styles from "./form.module.css";

export function ForgotForm() {
  const [rootError, setRootError] = useState("");
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({ resolver: zodResolver(forgotSchema) });

  const onSubmit = async (values: ForgotValues) => {
    setRootError("");
    try {
      await customInstance({ url: "/api/v1/auth/password/forgot", method: "POST", data: values });
      setSent(true); // server always 204 (no account enumeration)
    } catch (err) {
      setRootError(bindApiError(err, setError));
    }
  };

  if (sent) {
    return (
      <div className={styles.form}>
        <h1 className={styles.title}>Check your inbox</h1>
        <p className={styles.lede}>If that email is registered, a reset link is on its way.</p>
        <div className={styles.footer}>
          <Link href="/login">Back to sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      <h1 className={styles.title}>Reset your password</h1>
      <p className={styles.lede}>We&apos;ll email you a link to set a new one.</p>
      {rootError && <div className={styles.rootError} role="alert">{rootError}</div>}

      <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
      <Button type="submit" variant="primary" className={styles.submit} loading={isSubmitting}>
        Send reset link
      </Button>

      <div className={styles.footer}>
        <Link href="/login">Back to sign in</Link>
      </div>
    </form>
  );
}

export default ForgotForm;
