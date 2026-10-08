"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input } from "@/components/ui";
import { customInstance } from "@/lib/api/fetcher";
import { loginSchema, type LoginValues } from "@/lib/validation/auth";
import { bindApiError } from "./apiError";
import styles from "./form.module.css";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params?.get("next") || "/app";
  const [rootError, setRootError] = useState("");

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginValues) => {
    setRootError("");
    try {
      await customInstance({ url: "/api/v1/auth/login", method: "POST", data: values });
      router.push(next);
      router.refresh();
    } catch (err) {
      setRootError(bindApiError(err, setError));
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      <h1 className={styles.title}>Welcome back.</h1>
      <p className={styles.lede}>Sign in to continue preparing your celebration.</p>
      {rootError && <div className={styles.rootError} role="alert">{rootError}</div>}

      <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
      <Input
        label={
          <span className={styles.rowBetween}>
            Password
            <Link href="/forgot" className={`${styles.ghostLink} ${styles.forgot}`}>Forgot?</Link>
          </span>
        }
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register("password")}
      />

      <Button type="submit" variant="primary" className={styles.submit} loading={isSubmitting}>
        Sign in
      </Button>

      <div className={styles.or} aria-hidden="true">
        <span />
        or
        <span />
      </div>
      {/* No Google sign-in on the API yet: the button is part of the design, so it stays and says so. */}
      <Button type="button" style={{ minHeight: 50 }} onClick={() => setRootError("Google sign-in isn’t available yet. Use your email and password.")}>
        Continue with Google
      </Button>

    </form>
  );
}

export default LoginForm;
