"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Magnetic, Reveal, Tilt } from "@/lib/motion";
import { InviteScreen } from "../InviteScreen";
import { TemplateShot } from "../TemplateShot";
import { BY_SLUG, TEMPLATES } from "../data";
import { SERIF } from "../fonts";
import { Em, PX, WRAP } from "./shared";
import { TH, useLang } from "../i18n";
import { useIsMobile } from "../hooks";
import { LandingShell } from "../LandingShell";

const EVENTS = ["All", "Wedding", "Engagement", "Seventeen", "Birthday", "Anniversary", "Golden Anniversary", "Private Event", "Brand Event", "Product Launch"];
const STYLES = ["Minimal", "Elegant", "Romantic", "Modern", "Editorial", "Luxury", "Traditional", "Playful", "Garden"];
const COLORS: [string, string][] = [["Ivory", "#EFE7DA"], ["Stone", "#D9DAD5"], ["Blush", "#F4D9DE"], ["Wine", "#3E1A20"], ["Forest", "#1E2A24"], ["Midnight", "#16213A"], ["Gold", "#B8954A"], ["Black", "#121212"]];
const ALIAS: Record<string, string> = { "Private Celebration": "Private Event", "Brand Activation": "Brand Event" };
const PLATES = ["#E6DED1", "#DDD5C8", "#E9E1D6", "#D9D4CA"];
const WORDS = { one: { en: "design", id: "desain", my: "reka bentuk" }, many: { en: "designs", id: "desain", my: "reka bentuk" } };
const TOTAL = { en: "Templates · ", id: "Template · ", my: "Templat · " };
const H2 = { fontFamily: SERIF, fontWeight: 300, lineHeight: 0.95, letterSpacing: "-.025em", margin: 0 } as const;
const SCROLLER = { display: "flex", overflowX: "auto", scrollbarWidth: "none" } as const;

export function TemplatesPage() {
  const { lang, tr } = useLang();
  const narrow = useIsMobile(640);
  const [ev, setEv] = useState("All");
  const [st, setSt] = useState("");
  const [col, setCol] = useState("");
  const cat = useSearchParams()?.get("cat");

  useEffect(() => {
    if (!cat) return;
    const e = ALIAS[cat] || cat;
    if (EVENTS.includes(e)) setEv(e);
  }, [cat]);

  const list = TEMPLATES.filter((t) => (ev === "All" || t.cat === ev) && (!st || t.style === st || t.mood === st) && (!col || t.color === col));
  const filtered = ev !== "All" || !!st || !!col;
  const clear = () => { setEv("All"); setSt(""); setCol(""); };
  const word = (n: number) => (n === 1 ? WORDS.one : WORDS.many)[lang];

  return (
    <LandingShell active="templates" bg="#F4EEE4" fg="#0E0C0B" startLight hover="brown">
      <section data-bg="#F4EEE4" data-nav="light" data-screen-label="Templates hero" style={{ background: "#F4EEE4" }}>
        <div style={{ ...WRAP, padding: `clamp(140px,16vw,220px) ${PX} clamp(60px,7vw,100px)`, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,460px),1fr))", gap: 48, alignItems: "end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".28em", textTransform: "uppercase", color: "#8A5F38" }}>{TOTAL[lang]}{TEMPLATES.length} {word(2)}</div>
            <Reveal kind="blur" as="h1" style={{ fontFamily: SERIF, fontWeight: 300, fontSize: "clamp(56px,7.6vw,128px)", lineHeight: 0.92, letterSpacing: "-.03em", margin: 0, textWrap: "balance" }}>
              <TH k="page.templates.title">{"Find the design <em>that feels like you.</em>"}</TH>
            </Reveal>
            <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6, color: "#4A423A", maxWidth: 460 }}>{tr("Every design is composed by the Mula studio for a particular kind of celebration. Browse by event, style or colour, then make it entirely yours.")}</p>
          </div>
          <div aria-hidden="true" style={{ position: "relative", height: "clamp(320px,34vw,480px)", perspective: 1600 }}>
            <div style={{ position: "absolute", left: "8%", top: "12%", width: "30%", aspectRatio: "9/19.5", transform: "rotateY(24deg) rotateZ(-6deg)" }}><InviteScreen d={BY_SLUG.velvet.d} /></div>
            <div style={{ position: "absolute", left: "62%", top: "12%", width: "30%", aspectRatio: "9/19.5", transform: "rotateY(-24deg) rotateZ(6deg)" }}><InviteScreen d={BY_SLUG.noir.d} /></div>
            <div style={{ position: "absolute", left: "33%", top: 0, width: "34%", aspectRatio: "9/19.5", zIndex: 2 }}><InviteScreen d={BY_SLUG.serenity.d} /></div>
          </div>
        </div>
      </section>

      <section data-bg="#F4EEE4" data-nav="light" data-screen-label="Gallery" style={{ background: "#F4EEE4" }}>
        <div style={{ position: "sticky", top: 76, zIndex: 20, background: "rgba(244,238,228,.9)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderTop: "1px solid rgba(14,12,11,.08)", borderBottom: "1px solid rgba(14,12,11,.08)" }}>
          <div style={{ ...WRAP, padding: `14px ${PX}`, display: "flex", flexDirection: "column", gap: 12 }}>
            <div role="tablist" aria-label="Event" style={{ ...SCROLLER, gap: 22, fontSize: 14, whiteSpace: "nowrap" }}>
              {EVENTS.map((e) => (
                <button key={e} role="tab" aria-selected={e === ev} onClick={() => setEv(e)} style={{ all: "unset", cursor: "pointer", padding: "6px 0", borderBottom: `1px solid ${e === ev ? "#0E0C0B" : "transparent"}`, opacity: e === ev ? 1 : 0.55, transition: "opacity .3s, border-color .3s" }}>{tr(e)}</button>
              ))}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 18px" }}>
              <div style={{ ...SCROLLER, gap: 6, maxWidth: "100%" }}>
                {STYLES.map((f) => {
                  const on = f === st;
                  return (
                    <button key={f} onClick={() => setSt(on ? "" : f)} aria-pressed={on} style={{ flex: "none", height: 32, padding: "0 13px", borderRadius: 999, border: `1px solid ${on ? "#0E0C0B" : "rgba(14,12,11,.18)"}`, background: on ? "#0E0C0B" : "transparent", color: on ? "#F4EEE4" : "#0E0C0B", font: "inherit", fontSize: 12.5, cursor: "pointer", transition: "all .25s" }}>{tr(f)}</button>
                  );
                })}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".2em", textTransform: "uppercase", color: "#8A5F38" }}>{tr("Colour")}</span>
                {COLORS.map(([label, hex]) => {
                  const on = label === col;
                  return <button key={label} onClick={() => setCol(on ? "" : label)} aria-label={label} aria-pressed={on} style={{ width: 22, height: 22, borderRadius: "50%", padding: 0, cursor: "pointer", background: hex, border: "1px solid rgba(14,12,11,.15)", boxShadow: `0 0 0 2px #F4EEE4, 0 0 0 3px ${on ? "#0E0C0B" : "transparent"}` }} />;
                })}
              </div>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14, fontSize: 13, color: "#5E554C" }}>
                <span>{list.length} {word(list.length)}</span>
                {filtered && <button onClick={clear} style={{ all: "unset", cursor: "pointer", textDecoration: "underline", color: "#0E0C0B" }}>{tr("Clear")}</button>}
              </div>
            </div>
          </div>
        </div>

        <div style={{ ...WRAP, padding: `48px ${PX} clamp(100px,12vw,160px)` }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,270px),1fr))", gridAutoFlow: "dense", gap: "48px 20px" }}>
            {list.map((t, i) => {
              const big = !narrow && list.length > 3 && i % 7 === 0;
              return (
                <Link key={t.slug} href={`/templates/${t.slug}`} data-cursor="Preview" aria-label={`${t.name}, ${t.cat} template, ${t.style}`} style={{ gridColumn: big ? "span 2" : "span 1", gridRow: big ? "span 2" : "span 1", display: "flex", flexDirection: "column", gap: 16, color: "#0E0C0B" }}>
                  <Tilt strength={7} style={{ position: "relative", flex: 1, minHeight: big ? 760 : 440, borderRadius: 4, background: big ? t.d.bg : PLATES[i % PLATES.length], overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", padding: big ? 48 : "36px 28px" }}>
                    <div style={{ width: big ? "min(300px,62%)" : "min(190px,72%)", aspectRatio: "9/19.5" }}><TemplateShot t={t} /></div>
                    <span style={{ position: "absolute", left: 14, top: 14, fontSize: 10, fontWeight: 600, letterSpacing: ".2em", textTransform: "uppercase", padding: "6px 10px", borderRadius: 999, background: "rgba(244,238,228,.9)", color: "#0E0C0B", opacity: big ? 1 : 0 }}>{tr("Featured")}</span>
                  </Tilt>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                    <span style={{ fontFamily: SERIF, fontSize: 28, lineHeight: 1 }}>{t.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".16em", textTransform: "uppercase", color: "#8A5F38", textAlign: "right" }}>{tr(t.cat)} · {tr(t.style)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
          {list.length === 0 && (
            <div style={{ padding: "80px 0", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
              <span style={{ fontFamily: SERIF, fontSize: 40 }}>{tr("Nothing matches yet.")}</span>
              <button onClick={clear} style={{ height: 48, padding: "0 24px", borderRadius: 999, border: "1px solid #0E0C0B", background: "transparent", font: "inherit", fontSize: 14, cursor: "pointer" }}>{tr("Clear filters")}</button>
            </div>
          )}
        </div>
      </section>

      <section data-bg="#E8D9BF" data-nav="light" data-screen-label="Bespoke" style={{ background: "#E8D9BF" }}>
        <div style={{ ...WRAP, padding: `clamp(90px,10vw,140px) ${PX}`, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 32 }}>
          <Reveal kind="blur" as="h2" style={{ ...H2, fontSize: "clamp(42px,5vw,80px)", maxWidth: 780 }}><Em a="Looking for something " b="only yours?" /></Reveal>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 360 }}>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: "#4F463D" }}>{tr("Our studio designs bespoke invitations for weddings, brands and launches, built on the same platform.")}</p>
            <Magnetic style={{ alignSelf: "flex-start" }}>
              <Link href="/pricing" style={{ display: "inline-flex", alignItems: "center", gap: 12, height: 52, padding: "0 26px", borderRadius: 999, background: "#0E0C0B", color: "#F4EEE4", fontSize: 14, fontWeight: 600 }}>{tr("Ask about Custom")}<span data-arrow="1">→</span></Link>
            </Magnetic>
          </div>
        </div>
      </section>
    </LandingShell>
  );
}
