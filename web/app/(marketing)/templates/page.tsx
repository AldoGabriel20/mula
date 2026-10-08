import type { Metadata } from "next";
import { Suspense } from "react";
import { TemplatesPage } from "@/components/landing/pages/TemplatesPage";

export const metadata: Metadata = {
  title: "Templates — Mula",
  description: "Browse invitation designs by celebration, style and palette. Find the design that feels like you.",
};

// useSearchParams (the ?cat= filter) needs a Suspense boundary in the App Router.
export default function Page() {
  return (
    <Suspense>
      <TemplatesPage />
    </Suspense>
  );
}
