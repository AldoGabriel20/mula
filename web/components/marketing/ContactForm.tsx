"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Textarea } from "@/components/ui";
import { customInstance, ApiError } from "@/lib/api/fetcher";
import { contactSchema, type ContactValues } from "@/lib/validation/contact";
import styles from "./section.module.css";

// POSTs to /api/v1/contact. NOTE: that endpoint is an API SPEC GAP — not yet in the
// backend (only auth + events exist). The form is wired and ready; a 404/501 shows the
// graceful error until the endpoint lands.
export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [rootError, setRootError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({ resolver: zodResolver(contactSchema) });

  const onSubmit = async (values: ContactValues) => {
    setRootError("");
    try {
      await customInstance({ url: "/api/v1/contact", method: "POST", data: values });
      setSent(true);
    } catch (err) {
      setRootError(err instanceof ApiError ? "We couldn't send that just now. Please try again." : "Network error.");
    }
  };

  if (sent) {
    return (
      <section className={styles.section}>
        <h1 className={styles.title}>Thanks — we&apos;ll be in touch.</h1>
        <p className={styles.lede}>Our team will reply to your message soon.</p>
      </section>
    );
  }

  return (
    <section className={styles.section} style={{ maxWidth: 560 }}>
      <div className={styles.eyebrow}>
        <span />
        Contact
      </div>
      <h1 className={styles.title}>Talk to us.</h1>
      <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: "grid", gap: 16, marginTop: 28 }}>
        {rootError && (
          <div role="alert" style={{ background: "var(--nob)", color: "var(--no)", borderRadius: 10, padding: "10px 14px" }}>
            {rootError}
          </div>
        )}
        <Input label="Your name" error={errors.name?.message} {...register("name")} />
        <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
        <Textarea label="Message" error={errors.message?.message} {...register("message")} />
        <Button type="submit" variant="primary" loading={isSubmitting}>
          Send message
        </Button>
      </form>
    </section>
  );
}

export default ContactForm;
