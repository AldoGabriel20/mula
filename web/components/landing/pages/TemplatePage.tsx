"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Magnetic, Reveal, Tilt } from "@/lib/motion";
import { InviteScreen, type InviteData } from "../InviteScreen";
import { BY_SLUG, TEMPLATES } from "../data";
import { SERIF, fam } from "../fonts";
import { Em, EVENT_DATE, Eq, PX, WRAP, lum, useNow } from "./shared";
import { useLang } from "../i18n";
import { LandingShell } from "../LandingShell";
import s from "../landing.module.css";

const INCLUDED = ["Personalized guest links", "RSVP with guest count", "Background music", "Photo gallery", "Live countdown", "Location and maps", "Digital gifts", "Wishes and guestbook", "WhatsApp sharing", "Edit anytime after sending"];
const H2 = { fontFamily: SERIF, fontWeight: 300, lineHeight: 0.95, letterSpacing: "-.025em", margin: 0 } as const;
const LABEL = { fontSize: 11, fontWeight: 600, letterSpacing: ".22em", textTransform: "uppercase", color: "#7A5232" } as const;
const CARD = { background: "#F6EFE3", borderRadius: 6, padding: 28, display: "flex", flexDirection: "column", gap: 20, minHeight: 300 } as const;
const CARD_TITLE = { fontFamily: SERIF, fontSize: 30, lineHeight: 1.1 } as const;

export function TemplatePage({ slug }: { slug: string }) {
  const { tr } = useLang();
  const t = BY_SLUG[slug] || BY_SLUG.serenity;
  const d = t.d;
  const light = lum(d.bg) > 0.55;
  const line = light ? "rgba(14,12,11,.22)" : "rgba(255,255,255,.26)";
  const [guest, setGuest] = useState("Sarah");
  const [modal, setModal] = useState(false);
  const [cover, setCover] = useState(false);
  const [music, setMusic] = useState(false);
  const [rsvp, setRsvp] = useState("");
  const now = useNow();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setModal(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const guestShown = guest.trim() || "Guest";
  const guestSlug = guestShown.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "guest";
  const heroD: InviteData = { ...d, guest: guestShown };
  const title = d.title || "";
  const parts = title.split(/\s*&\s*/);
  const mono = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : title[0];
  const diff = Math.max(0, EVENT_DATE - (now ?? EVENT_DATE));
  const countdown: [string, number][] = [["Days", Math.floor(diff / 864e5)], ["Hours", Math.floor(diff / 36e5) % 24], ["Minutes", Math.floor(diff / 6e4) % 60]];
  const photo = d.photo || `radial-gradient(circle at 50% 40%, ${d.accent}, ${d.bg} 70%)`;
  const font = fam(d.font) || SERIF;
  const more = TEMPLATES.filter((x) => x.slug !== t.slug && (x.cat === t.cat || x.style === t.style))
    .concat(TEMPLATES.filter((x) => x.slug !== t.slug))
    .filter((x, i, a) => a.indexOf(x) === i)
    .slice(0, 4);
  const rsvpTitle = rsvp === "yes" ? `${tr("Wonderful,")} ${guestShown}. ${tr("We’ll save you a seat.")}` : rsvp === "no" ? `${tr("Thank you for letting us know,")} ${guestShown}.` : `${tr("Will you attend,")} ${guestShown}?`;
  const rsvpBtn = (on: boolean) => ({ height: 48, borderRadius: 999, border: "1px solid #0E0C0B", background: on ? "#0E0C0B" : "transparent", color: on ? "#F4EEE4" : "#0E0C0B", font: "inherit", fontSize: 14, cursor: "pointer" }) as const;
  const openModal = () => { setModal(true); setCover(false); };

  return (
    <LandingShell active="templates" bg={d.bg} fg="#0E0C0B" startLight={light} hover="fade">
      <section data-bg={d.bg} data-nav={light ? "light" : "dark"} data-screen-label="Template hero" style={{ position: "relative", background: d.bg, color: d.fg, overflow: "hidden" }}>
        <div aria-hidden="true" style={{ position: "absolute", right: "-10vw", top: "-10vw", width: "70vw", aspectRatio: "1", borderRadius: "50%", border: `1px solid ${d.accent}`, opacity: 0.35 }} />
        <div style={{ position: "relative", ...WRAP, padding: `clamp(130px,14vw,190px) ${PX} clamp(80px,9vw,130px)`, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,440px),1fr))", gap: 56, alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <nav aria-label="Breadcrumb" style={{ display: "flex", gap: 10, fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", opacity: 0.8 }}>
              <Link href="/templates">{tr("Templates")}</Link>
              <span>/</span>
              <Link href={`/templates?cat=${encodeURIComponent(t.cat)}`}>{tr(t.cat)}</Link>
            </nav>
            <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: "clamp(72px,11vw,180px)", lineHeight: 0.85, letterSpacing: "-.04em", margin: 0 }}>{t.name}</h1>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {[t.cat, t.style, t.mood, t.color].filter(Boolean).map((g) => (
                <span key={g} style={{ height: 32, padding: "0 14px", borderRadius: 999, border: `1px solid ${line}`, display: "inline-flex", alignItems: "center", fontSize: 12.5 }}>{tr(g)}</span>
              ))}
            </div>
            <p style={{ margin: 0, fontSize: 18, lineHeight: 1.6, maxWidth: 460, opacity: 0.88, textWrap: "pretty" }}>{t.desc}</p>
            <label style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 360, fontSize: 11, fontWeight: 600, letterSpacing: ".2em", textTransform: "uppercase", opacity: 0.9 }}>
              {tr("Preview with a guest name")}
              <input value={guest} onChange={(e) => setGuest(e.target.value)} maxLength={22} style={{ height: 50, borderRadius: 999, border: `1px solid ${line}`, background: "transparent", padding: "0 20px", fontFamily: "var(--l-manrope), sans-serif", fontSize: 15, letterSpacing: 0, textTransform: "none", color: d.fg, outline: "none" }} />
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <Magnetic>
                <Link href="/register" data-cursor="Create" style={{ display: "inline-flex", alignItems: "center", gap: 12, height: 56, padding: "0 30px", borderRadius: 999, background: d.fg, color: d.bg, fontSize: 14, fontWeight: 600 }}>{tr("Use this template")}<span data-arrow="1">→</span></Link>
              </Magnetic>
              <button onClick={openModal} style={{ display: "inline-flex", alignItems: "center", gap: 10, height: 56, padding: "0 28px", borderRadius: 999, border: `1px solid ${line}`, background: "transparent", color: d.fg, font: "inherit", fontSize: 14, cursor: "pointer" }}>{tr("Preview invitation")}</button>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button onClick={openModal} data-cursor="Open" aria-label="Open full preview" style={{ all: "unset", cursor: "pointer", width: "min(330px,72vw)", aspectRatio: "9/19.5", display: "block" }}>
              <Tilt strength={8} style={{ width: "100%", height: "100%" }}><InviteScreen d={heroD} /></Tilt>
            </button>
          </div>
        </div>
      </section>

      <section data-bg="#F4EEE4" data-nav="light" data-screen-label="Devices" style={{ background: "#F4EEE4", color: "#0E0C0B" }}>
        <div style={{ ...WRAP, padding: `clamp(100px,12vw,170px) ${PX}` }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 24 }}>
            <Reveal kind="blur" as="h2" style={{ ...H2, fontSize: "clamp(44px,5.6vw,90px)" }}><Em a="Beautiful on " b="every screen." /></Reveal>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: "#4A423A", maxWidth: 340 }}>{tr("Most guests open on their phone. Some open on a laptop.")} {t.name} {tr("is composed for both.")}</p>
          </div>
          <div style={{ position: "relative", marginTop: 64, paddingBottom: "clamp(40px,6vw,80px)" }}>
            <Reveal kind="scale" style={{ borderRadius: 12, overflow: "hidden", background: "#FBF8F3", boxShadow: "0 60px 120px -50px rgba(60,40,20,.45), 0 0 0 1px rgba(14,12,11,.07)", maxWidth: 1100 }}>
              <div style={{ height: 40, display: "flex", alignItems: "center", gap: 14, padding: "0 14px", background: "#EFE8DD" }}>
                <div style={{ display: "flex", gap: 6 }}>
                  {["#E2B8A8", "#E8D2A6", "#BFD0B8"].map((c) => <span key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
                </div>
                <span style={{ flex: 1, textAlign: "center", fontSize: 12, color: "#7A6E62" }}>mula.co/{t.slug}/{guestSlug}</span>
              </div>
              <div style={{ containerType: "inline-size", aspectRatio: "16/9", background: d.bg, color: d.fg, display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", borderRight: `1px solid ${line}` }}>
                  <div style={{ width: "22cqw", height: "30cqw", borderRadius: "11cqw 11cqw 0 0", background: photo, border: `1px solid ${d.accent}` }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "2.2cqw", padding: "0 5cqw" }}>
                  <span style={{ fontSize: "1.1cqw", letterSpacing: ".3em", textTransform: "uppercase", opacity: 0.8 }}>{d.eyebrow}</span>
                  <span style={{ fontFamily: font, fontStyle: d.italic || "normal", fontWeight: d.weight || 400, fontSize: `${Math.min(7.2, (d.size || 12) * 0.42)}cqw`, lineHeight: 1, letterSpacing: d.ls || "0" }}>{title}</span>
                  <span style={{ fontSize: "1.3cqw", opacity: 0.85 }}>{d.date}</span>
                  <span style={{ fontFamily: SERIF, fontSize: "1.8cqw" }}>{tr("Dear")} {guestShown}</span>
                  <div style={{ display: "flex", gap: "2.4cqw", marginTop: "1cqw" }}>
                    {countdown.map(([l, v]) => (
                      <span key={l} style={{ display: "flex", flexDirection: "column", gap: ".3cqw" }}>
                        <span style={{ fontFamily: SERIF, fontSize: "3.4cqw", lineHeight: 1 }}>{String(v).padStart(2, "0")}</span>
                        <span style={{ fontSize: ".9cqw", letterSpacing: ".2em", textTransform: "uppercase", opacity: 0.7 }}>{tr(l)}</span>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "1cqw", marginTop: "1.4cqw", fontSize: "1.1cqw" }}>
                    <span style={{ padding: "1cqw 2.2cqw", borderRadius: 99, background: d.fg, color: d.bg }}>RSVP</span>
                    <span style={{ padding: "1cqw 2.2cqw", borderRadius: 99, border: `1px solid ${d.accent}` }}>{tr("Location")}</span>
                    <span style={{ padding: "1cqw 2.2cqw", borderRadius: 99, border: `1px solid ${d.accent}` }}>{tr("Gift")}</span>
                  </div>
                </div>
              </div>
            </Reveal>
            <div style={{ position: "absolute", right: "clamp(0px,3vw,40px)", bottom: 0, width: "clamp(150px,18vw,250px)", aspectRatio: "9/19.5" }}><InviteScreen d={heroD} /></div>
          </div>
        </div>
      </section>

      <section data-bg="#E8D9BF" data-nav="light" data-screen-label="Included" style={{ background: "#E8D9BF" }}>
        <div style={{ ...WRAP, padding: `clamp(100px,12vw,170px) ${PX}`, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))", gap: 20, color: "#0E0C0B" }}>
          <div style={{ gridColumn: "1 / -1", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 24, marginBottom: 40 }}>
            <Reveal kind="blur" as="h2" style={{ ...H2, fontSize: "clamp(44px,5.6vw,90px)" }}><Em a="Everything " b="included." /></Reveal>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: "4px 32px", fontSize: 14, maxWidth: 460 }}>
              {INCLUDED.map((i) => (
                <span key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(14,12,11,.12)" }}>
                  <span style={{ color: "#8A5F38" }}>✓</span>
                  {tr(i)}
                </span>
              ))}
            </div>
          </div>
          <Reveal style={CARD}>
            <span style={LABEL}>{tr("Music preview")}</span>
            <span style={CARD_TITLE}>{tr("Your song plays softly as the invitation opens.")}</span>
            <button onClick={() => setMusic(!music)} style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 14, padding: 12, borderRadius: 999, border: "1px solid rgba(14,12,11,.14)", background: "#FBF8F3", cursor: "pointer", font: "inherit", textAlign: "left", color: "#0E0C0B" }}>
              <span style={{ width: 44, height: 44, borderRadius: "50%", background: "#0E0C0B", color: "#F4EEE4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flex: "none" }}>{music ? "❚❚" : "▶"}</span>
              <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}><span style={{ fontSize: 14 }}>Gymnopédie No. 1</span><span style={{ fontSize: 12, color: "#7A6E62" }}>{tr("Erik Satie · sample track")}</span></span>
              <span style={{ opacity: music ? 1 : 0, paddingRight: 10 }}><Eq n={4} w={2} h={16} gap={2} color="#8A5F38" dur={(k) => 0.7 + k * 0.15} delay={(k) => k * 0.1} /></span>
            </button>
          </Reveal>
          <Reveal wait={100} style={CARD}>
            <span style={LABEL}>{tr("RSVP preview")}</span>
            <span style={CARD_TITLE}>{rsvpTitle}</span>
            <div style={{ marginTop: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button onClick={() => setRsvp("yes")} style={rsvpBtn(rsvp === "yes")}>{tr("Attending")}</button>
              <button onClick={() => setRsvp("no")} style={rsvpBtn(rsvp === "no")}>{tr("Not attending")}</button>
            </div>
          </Reveal>
          <Reveal wait={200} style={CARD}>
            <span style={LABEL}>{tr("Guest link preview")}</span>
            <span style={CARD_TITLE}>{tr("Each guest receives their own link, opening with their name.")}</span>
            <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, height: 48, padding: "0 16px", borderRadius: 999, background: "#FBF8F3", border: "1px solid rgba(14,12,11,.12)", overflow: "hidden", whiteSpace: "nowrap" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#5C8A63", flex: "none" }} />
                <span style={{ color: "#7A6E62" }}>mula.co/{t.slug}/</span>
                <span style={{ fontWeight: 600 }}>{guestSlug}</span>
              </div>
              <span style={{ color: "#7A6E62", paddingLeft: 16 }}>{tr("Edit the guest name above to see it change.")}</span>
            </div>
          </Reveal>
        </div>
      </section>

      <section data-bg="#F4EEE4" data-nav="light" data-screen-label="More" style={{ background: "#F4EEE4", color: "#0E0C0B" }}>
        <div style={{ ...WRAP, padding: `clamp(100px,12vw,160px) ${PX}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 20, flexWrap: "wrap" }}>
            <h2 style={{ ...H2, fontSize: "clamp(40px,4.4vw,68px)", letterSpacing: "-.02em" }}>{tr("More like")} <em>{t.name}</em></h2>
            <Link href="/templates" className={s.textLink}>{tr("All templates →")}</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,220px),1fr))", gap: "40px 20px", marginTop: 48 }}>
            {more.map((x) => (
              <Link key={x.slug} href={`/templates/${x.slug}`} data-cursor="Preview" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ background: "#E6DED1", borderRadius: 4, padding: "32px 24px", display: "flex", justifyContent: "center" }}>
                  <div style={{ width: "min(170px,70%)", aspectRatio: "9/19.5" }}><InviteScreen d={x.d} /></div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontFamily: SERIF, fontSize: 26 }}>{x.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".16em", textTransform: "uppercase", color: "#8A5F38" }}>{tr(x.style)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {modal && (
        <div role="dialog" aria-modal="true" aria-label="Invitation preview" style={{ position: "fixed", inset: 0, zIndex: 140, background: "rgba(10,9,8,.92)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <button onClick={() => setModal(false)} style={{ position: "absolute", top: 20, right: 20, height: 44, padding: "0 20px", borderRadius: 999, border: "1px solid rgba(244,238,228,.3)", background: "transparent", color: "#F4EEE4", font: "inherit", fontSize: 13, cursor: "pointer" }}>{tr("Close")}</button>
          <div style={{ position: "relative", height: "min(86vh,760px)", aspectRatio: "9/19.5", maxWidth: "90vw" }}>
            <InviteScreen d={heroD} />
            <div style={{ position: "absolute", inset: "2.6%", borderRadius: "12%/5.6%", overflow: "hidden", pointerEvents: cover ? "none" : "auto" }}>
              <div style={{ position: "absolute", inset: 0, background: d.bg, color: d.fg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, textAlign: "center", padding: 24, transform: `translateY(${cover ? "-101%" : "0%"})`, transition: "transform 1.3s cubic-bezier(.7,0,.2,1)" }}>
                <span style={{ fontSize: 11, letterSpacing: ".3em", textTransform: "uppercase", opacity: 0.8 }}>{tr("Dear")} {guestShown}</span>
                <span style={{ width: 110, height: 110, borderRadius: "50%", border: `1px solid ${d.accent}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font, fontStyle: d.italic || "normal", fontSize: 34 }}>{mono}</span>
                <span style={{ fontFamily: SERIF, fontSize: 22 }}>{tr("You are invited")}</span>
                <button onClick={() => setCover(true)} style={{ height: 44, padding: "0 22px", borderRadius: 999, border: `1px solid ${d.accent}`, background: "transparent", color: d.fg, font: "inherit", fontSize: 13, cursor: "pointer" }}>{tr("Open invitation")}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </LandingShell>
  );
}
