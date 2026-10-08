import type { Metadata } from "next";
import { ContactForm } from "@/components/marketing";

export const metadata: Metadata = {
  title: "Contact — Mula",
  description: "Talk to the Mula team about your celebration or a custom design.",
};

export default function ContactPage() {
  return <ContactForm />;
}
