"use client";

import Link from "next/link";
import { Reveal, Tilt } from "@/lib/motion";
import { InviteScreen } from "../InviteScreen";
import { BY_SLUG, PHOTOS } from "../data";
import { SERIF, fam } from "../fonts";
import { Em, PX, WRAP } from "./shared";
import { TH, useLang } from "../i18n";
import { useIsMobile } from "../hooks";
import { LandingShell } from "../LandingShell";

const EX = [
  { slug: "maison", title: "Kevin & Mei, a grand-hotel wedding", meta: "Wedding · Maison", col: "span 5", mt: "0px", w: "min(240px,60%)", pad: "56px 24px", plate: "#3E1A20" },
  { slug: "velvet", title: "Naya at seventeen", meta: "Seventeen · Velvet", col: "span 3", mt: "120px", w: "min(170px,72%)", pad: "40px 20px", plate: "#E6DED1" },
  { slug: "decade", title: "Ten years for Bram & Sekar", meta: "Anniversary · Decade", col: "span 4", mt: "40px", w: "min(200px,64%)", pad: "48px 20px", plate: "#D9DAD5" },
  { slug: "atlas", title: "Atlas, a product reveal", meta: "Product Launch · Atlas", col: "span 4", mt: "0px", w: "min(200px,64%)", pad: "48px 20px", plate: "#171412" },
  { slug: "soiree", title: "An evening at home", meta: "Private · Soirée", col: "span 4", mt: "80px", w: "min(200px,64%)", pad: "48px 20px", plate: "#E8D9BF" },
  { slug: "sekar", title: "Fajar & Annisa, walimatul ursy", meta: "Wedding · Sekar", col: "span 4", mt: "20px", w: "min(200px,64%)", pad: "48px 20px", plate: "#EBD3CB" },
];
const PALETTES: { name: string; use: string; sw: [string, number][] }[] = [
  { name: "Champagne Evening", use: "Black-tie weddings and golden anniversaries", sw: [["#0E0C0B", 3], ["#3E1A20", 2], ["#A87A4F", 1], ["#E8D9BF", 2], ["#F4EEE4", 2]] },
  { name: "Garden Morning", use: "Outdoor ceremonies and engagements", sw: [["#1E2A24", 3], ["#4F6248", 2], ["#A9B48E", 2], ["#C9A96E", 1], ["#EDE6D6", 2]] },
  { name: "Soft Blush", use: "Seventeenths and intimate celebrations", sw: [["#5A2335", 2], ["#B5676F", 2], ["#EBC2C0", 2], ["#F4D9DE", 2], ["#FBF6F2", 2]] },
  { name: "Stone & Sea", use: "Minimal weddings and brand events", sw: [["#22272A", 2], ["#5E6668", 2], ["#AEB8BC", 2], ["#D9DAD5", 3], ["#F3F2EE", 1]] },
  { name: "Midnight Ember", use: "Birthdays and evening launches", sw: [["#121212", 2], ["#16213A", 3], ["#E0875A", 1], ["#ECE6D8", 2], ["#C9C3B8", 2]] },
];
const TYPES = [
  { name: "Bodoni Moda", mood: "Romantic", font: "'Bodoni Moda', serif", italic: "italic", weight: 400, size: "clamp(54px,5vw,80px)", ls: "-0.01em", sample: "Raka & Celine", note: "High contrast italics for classic weddings." },
  { name: "Italiana", mood: "Elegant", font: "'Italiana', serif", italic: "normal", weight: 400, size: "clamp(50px,4.6vw,74px)", ls: "0", sample: "Fifty Golden Years", note: "Light and tall, made for anniversaries." },
  { name: "Pinyon Script", mood: "Intimate", font: "'Pinyon Script', cursive", italic: "normal", weight: 400, size: "clamp(56px,5.4vw,84px)", ls: "0", sample: "An Evening", note: "A formal script, best used for names only." },
  { name: "Unbounded", mood: "Playful", font: "'Unbounded', sans-serif", italic: "normal", weight: 500, size: "clamp(42px,4vw,64px)", ls: "-0.04em", sample: "Chapter 25", note: "Wide and confident for birthdays and launches." },
  { name: "Manrope Light", mood: "Modern", font: "'Manrope', sans-serif", italic: "normal", weight: 300, size: "clamp(46px,4.4vw,70px)", ls: "-0.05em", sample: "Rad & Cil", note: "Quiet geometry for editorial invitations." },
  { name: "Cormorant Garamond", mood: "Editorial", font: "'Cormorant Garamond', serif", italic: "italic", weight: 300, size: "clamp(54px,5vw,80px)", ls: "-0.02em", sample: "Ten Years", note: "A book face with warmth, at any size." },
];
const IDEAS: [string, string][] = [
  ["Wedding", "Send a save-the-date first, then reveal the full invitation on the same link three months later."],
  ["Engagement", "Use the photo you took on the day of the proposal as the portrait arch."],
  ["Seventeen", "Let the celebrant choose the palette and the music. It becomes their first party, truly."],
  ["Birthday", "Number the invitation like a chapter and ask guests to bring one story from the past year."],
  ["Anniversary", "Add your original wedding date beneath the new one, so guests see the whole span."],
  ["Brand Activation", "Give every guest a personal link and greet them by name at the door with the same list."],
];
const ink = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 > 0.55 ? "#0E0C0B" : "#F4EEE4";
};
const H2 = { fontFamily: SERIF, fontWeight: 300, fontSize: "clamp(44px,5.6vw,92px)", lineHeight: 0.95, letterSpacing: "-.025em", margin: 0 } as const;

export function InspirationPage() {
  const { tr } = useLang();
  const narrow = useIsMobile(820);
  return (
    <LandingShell active="inspiration">
      <section data-bg="#0E0C0B" data-screen-label="Inspiration hero" style={{ position: "relative", background: "#0E0C0B", overflow: "hidden" }}>
        <div style={{ ...WRAP, padding: `clamp(140px,15vw,210px) ${PX} 0` }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16, fontSize: 11, fontWeight: 600, letterSpacing: ".28em", textTransform: "uppercase", color: "#C9A56E" }}>
            <span>{tr("The Mula Journal")}</span>
            <span>{tr("Issue 01 · 2026")}</span>
          </div>
          <Reveal kind="blur" as="h1" style={{ fontFamily: SERIF, fontWeight: 300, fontStyle: "italic", fontSize: "clamp(80px,17vw,300px)", lineHeight: 0.82, letterSpacing: "-.05em", margin: "24px 0 0" }}>
            <TH k="page.inspiration.title">Inspiration</TH>
          </Reveal>
        </div>
        <div style={{ ...WRAP, padding: `clamp(40px,5vw,72px) ${PX} clamp(100px,12vw,160px)`, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,420px),1fr))", gap: "40px clamp(40px,6vw,96px)", alignItems: "end" }}>
          <Reveal kind="mask" style={{ aspectRatio: "4/5" }}>
            <Tilt strength={4} style={{ width: "100%", height: "100%", borderRadius: 4, background: PHOTOS.sea || "#AEB8BC", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", right: "8%", bottom: "-8%", width: "38%", aspectRatio: "9/19.5", transform: "rotate(-5deg)" }}><InviteScreen d={BY_SLUG.linen.d} /></div>
              <span style={{ position: "absolute", left: 20, top: 20, fontSize: 10, fontWeight: 600, letterSpacing: ".2em", textTransform: "uppercase", background: "rgba(14,12,11,.6)", padding: "6px 10px", borderRadius: 999 }}>{tr("Photo placeholder")}</span>
            </Tilt>
          </Reveal>
          <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 20 }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".24em", textTransform: "uppercase", color: "#C9A56E" }}>{tr("Featured story · Engagement")}</span>
            <h2 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: "clamp(40px,4.6vw,76px)", lineHeight: 0.98, letterSpacing: "-.02em", margin: 0 }}>{tr("Rad & Cil, ")}<em>{tr("in stone and sea.")}</em></h2>
            <p style={{ margin: 0, fontSize: 17, lineHeight: 1.65, color: "#C8BEB2", maxWidth: 480 }}>{tr("A cool, quiet engagement invitation built on Linen: a portrait arch, a single sans and two shades of grey-blue taken from the coast where they met.")}</p>
            <div style={{ display: "flex", gap: 28, fontSize: 13, color: "#9C9186" }}><span>{tr("Template · Linen")}</span><span>{tr("Palette · Stone")}</span><span>{tr("Type · Manrope Light")}</span></div>
            <Link href="/templates/linen" style={{ alignSelf: "flex-start", fontSize: 14, fontWeight: 600, borderBottom: "1px solid currentColor", paddingBottom: 4 }}>{tr("Use this design →")}</Link>
          </div>
        </div>
      </section>

      <section data-bg="#F4EEE4" data-nav="light" data-screen-label="Examples" style={{ background: "#F4EEE4", color: "#0E0C0B" }}>
        <div style={{ ...WRAP, padding: `clamp(100px,12vw,170px) ${PX}` }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 24, marginBottom: 64 }}>
            <Reveal kind="blur" as="h2" style={H2}><Em a="Invitations, " b="in the wild." /></Reveal>
            <span style={{ fontSize: 13, color: "#5E554C", maxWidth: 300 }}>{tr("Sample couples and hosts shown as placeholders until real customer stories are published.")}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(12,minmax(0,1fr))", gap: "48px 20px" }}>
            {EX.map((e) => (
              <Link key={e.slug} href={`/templates/${e.slug}`} data-cursor="View" style={{ gridColumn: narrow ? "span 12" : e.col, marginTop: narrow ? "0px" : e.mt, display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ background: e.plate, borderRadius: 4, padding: e.pad, display: "flex", justifyContent: "center" }}>
                  <div style={{ width: e.w, aspectRatio: "9/19.5" }}><InviteScreen d={BY_SLUG[e.slug].d} /></div>
                </div>
                <span style={{ fontFamily: SERIF, fontSize: 26, lineHeight: 1.1 }}>{tr(e.title)}</span>
                <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".16em", textTransform: "uppercase", color: "#8A5F38" }}>{tr(e.meta)}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section data-bg="#E8D9BF" data-nav="light" data-screen-label="Palettes" style={{ background: "#E8D9BF", color: "#0E0C0B" }}>
        <div style={{ ...WRAP, padding: `clamp(100px,12vw,170px) ${PX}` }}>
          <Reveal kind="blur" as="h2" style={{ ...H2, margin: "0 0 56px" }}><TH k="insp.colour">{"Colour <em>stories.</em>"}</TH></Reveal>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {PALETTES.map((p) => (
              <Reveal key={p.name} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,280px),1fr))", gap: "20px 48px", alignItems: "center", padding: "28px 0", borderTop: "1px solid rgba(14,12,11,.14)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontFamily: SERIF, fontSize: 34 }}>{tr(p.name)}</span>
                  <span style={{ fontSize: 14, color: "#4F463D" }}>{tr(p.use)}</span>
                </div>
                <div style={{ display: "flex", height: 84, borderRadius: 4, overflow: "hidden", gridColumn: "span 2", minWidth: 0 }}>
                  {p.sw.map(([hex, f]) => (
                    <div key={hex} style={{ flex: f, background: hex, display: "flex", alignItems: "flex-end", padding: 10, fontSize: 10, letterSpacing: ".08em", color: ink(hex) }}>{hex}</div>
                  ))}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section data-bg="#171412" data-screen-label="Typography" style={{ background: "#171412", color: "#F4EEE4" }}>
        <div style={{ ...WRAP, padding: `clamp(100px,12vw,170px) ${PX}` }}>
          <Reveal kind="blur" as="h2" style={{ ...H2, margin: "0 0 56px" }}><Em a="Type with " b="a voice." /></Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,400px),1fr))", gap: 1, background: "rgba(244,238,228,.1)" }}>
            {TYPES.map((t) => (
              <div key={t.name} style={{ background: "#171412", padding: "36px 28px", display: "flex", flexDirection: "column", gap: 18, minHeight: 280 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 600, letterSpacing: ".2em", textTransform: "uppercase", color: "#C9A56E" }}><span>{t.name}</span><span>{tr(t.mood)}</span></div>
                <span style={{ fontFamily: fam(t.font), fontStyle: t.italic, fontWeight: t.weight, fontSize: t.size, lineHeight: 1, letterSpacing: t.ls, marginTop: "auto" }}>{t.sample}</span>
                <span style={{ fontSize: 13, color: "#9C9186" }}>{tr(t.note)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section data-bg="#EBD3CB" data-nav="light" data-screen-label="Ideas" style={{ background: "#EBD3CB", color: "#1E1412" }}>
        <div style={{ ...WRAP, padding: `clamp(100px,12vw,170px) ${PX}`, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,380px),1fr))", gap: "48px clamp(40px,6vw,100px)" }}>
          <Reveal kind="blur" as="h2" style={H2}><TH k="insp.ideas">{"Event <em>ideas.</em>"}</TH></Reveal>
          <div style={{ display: "flex", flexDirection: "column", borderTop: "1px solid rgba(30,20,18,.16)" }}>
            {IDEAS.map(([cat, idea]) => (
              <div key={cat} style={{ display: "grid", gridTemplateColumns: "150px minmax(0,1fr)", gap: 20, padding: "22px 0", borderBottom: "1px solid rgba(30,20,18,.16)" }}>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".2em", textTransform: "uppercase", color: "#7E3F3A", paddingTop: 6 }}>{tr(cat)}</span>
                <span style={{ fontFamily: SERIF, fontSize: 24, lineHeight: 1.25 }}>{tr(idea)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </LandingShell>
  );
}
