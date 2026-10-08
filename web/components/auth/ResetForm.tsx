"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input } from "@/components/ui";
import { customInstance } from "@/lib/api/fetcher";
import { resetSchema, type ResetValues } from "@/lib/validation/auth";
import { bindApiError } from "./apiError";
import styles from "./form.module.css";

export function ResetForm() {
  const router = useRouter();
  const token = useSearchParams()?.get("token") || "";
  const [rootError, setRootError] = useState("");

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({ resolver: zodResolver(resetSchema) });

  if (!token) {
    return (
      <div className={styles.form}>
        <h1 className={styles.title}>Link expired</h1>
        <p className={styles.lede}>This reset link is invalid or missing. Request a new one.</p>
        <div className={styles.footer}>
          <Link href="/forgot">Request a new link</Link>
        </div>
      </div>
    );
  }

  const onSubmit = async (values: ResetValues) => {
    setRootError("");
    try {
      await customInstance({
        url: "/api/v1/auth/password/reset",
        method: "POST",
        data: { token, password: values.password },
      });
      router.push("/login");
    } catch (err) {
      setRootError(bindApiError(err, setError));
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      <h1 className={styles.title}>Set a new password</h1>
      {rootError && <div className={styles.rootError} role="alert">{rootError}</div>}

      <Input
        label="New password"
        type="password"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register("password")}
      />
      <Input
        label="Type it again"
        type="password"
        autoComplete="new-password"
        error={errors.confirm?.message}
        {...register("confirm")}
      />

      <Button type="submit" variant="primary" className={styles.submit} loading={isSubmitting}>
        Save password
      </Button>

      <div className={styles.footer}>
        <Link href="/login">Back to sign in</Link>
      </div>
    </form>
  );
}

export default ResetForm;
