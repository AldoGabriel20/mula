"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input } from "@/components/ui";
import { customInstance } from "@/lib/api/fetcher";
import { registerFormSchema, type RegisterValues } from "@/lib/validation/auth";
import { bindApiError } from "./apiError";
import styles from "./form.module.css";

// Prototype pwS: 1 short, 2 good (8+), 3 strong (12+).
const LABELS = ["", "Too short", "Good", "Strong"];

export function RegisterForm() {
  const router = useRouter();
  const [rootError, setRootError] = useState("");

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerFormSchema) });

  const pw = watch("password") ?? "";
  const strength = pw.length >= 12 ? 3 : pw.length >= 8 ? 2 : pw.length > 0 ? 1 : 0;

  const onSubmit = async ({ terms: _terms, ...values }: RegisterValues) => {
    setRootError("");
    try {
      await customInstance({ url: "/api/v1/auth/register", method: "POST", data: values });
      router.push(`/verify?email=${encodeURIComponent(values.email)}`);
    } catch (err) {
      setRootError(bindApiError(err, setError));
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      <h1 className={styles.title}>Let’s begin.</h1>
      <p className={styles.lede}>Create an account. Your first invitation is free.</p>
      {rootError && <div className={styles.rootError} role="alert">{rootError}</div>}

      <Input label="Your name" autoComplete="name" placeholder="Aldo Prasetyo" error={errors.name?.message} {...register("name")} />
      <Input label="Email" type="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message} {...register("email")} />
      <Input label="Password" type="password" autoComplete="new-password" error={errors.password?.message} {...register("password")} />

      <div className={styles.strength} aria-live="polite">
        {[1, 2, 3].map((i) => (
          <i key={i} className={i <= strength ? styles[`s${strength}`] : undefined} />
        ))}
        <small>{LABELS[strength]}</small>
      </div>

      <label className={styles.terms}>
        <input type="checkbox" aria-invalid={errors.terms ? true : undefined} {...register("terms")} />
        <span>
          I agree to the <Link href="/terms">Terms &amp; Conditions</Link>
        </span>
      </label>
      {errors.terms && <span className={styles.fieldError} role="alert">{errors.terms.message}</span>}

      <Button type="submit" variant="primary" className={styles.submit} loading={isSubmitting}>
        Create account
      </Button>

    </form>
  );
}

export default RegisterForm;
