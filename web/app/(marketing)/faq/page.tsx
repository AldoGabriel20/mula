import type { Metadata } from "next";
import { CTA } from "@/components/marketing";
import section from "@/components/marketing/section.module.css";

export const metadata: Metadata = {
  title: "FAQ — Mula",
  description: "Questions, answered: pricing, guests, personalization and more.",
};

const FAQ = [
  { q: "Do I pay per guest?", a: "No. You pay once per celebration — no subscription and no per-guest fees." },
  { q: "Can each guest get their own link?", a: "Yes, on Signature and Custom. Each guest gets a personal link and you can see who opened it." },
  { q: "Can I change the design later?", a: "Yes. Edit names, wording, palette, type and photos anytime before you publish." },
  { q: "How do guests reply?", a: "Guests RSVP straight from the invitation; replies appear in your dashboard immediately." },
  { q: "Do you offer custom designs?", a: "Yes — our studio designs bespoke invitations for weddings, brands and larger events. Ask us on the Contact page." },
];

export default function FaqPage() {
  return (
    <>
      <section className={section.section}>
        <div className={section.eyebrow}>
          <span />
          FAQ
        </div>
        <h1 className={section.title}>Questions, answered.</h1>
        <dl className={section.prose}>
          {FAQ.map((item) => (
            <div key={item.q} style={{ marginBottom: 24 }}>
              <dt style={{ fontWeight: 500, color: "var(--ink)", marginBottom: 6 }}>{item.q}</dt>
              <dd style={{ margin: 0, color: "var(--mut)" }}>{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>
      <CTA />
    </>
  );
}
