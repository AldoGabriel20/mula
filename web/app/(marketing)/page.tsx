import type { Metadata } from "next";
import { LandingHome } from "@/components/landing/LandingHome";

export const metadata: Metadata = {
  title: "Mula — Digital invitations for every beginning",
  description: "Digital invitations designed to make every celebration feel unforgettable.",
};

export default function HomePage() {
  return <LandingHome />;
}
