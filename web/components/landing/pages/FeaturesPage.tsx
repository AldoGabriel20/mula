"use client";

import { useState } from "react";
import Link from "next/link";
import { Magnetic, Reveal } from "@/lib/motion";
import { InviteScreen, type InviteData } from "../InviteScreen";
import { BY_SLUG, PHOTOS } from "../data";
import { SERIF } from "../fonts";
import { Em, EVENT_DATE, Eq, PX, WRAP, useNow } from "./shared";
import { TH, useLang } from "../i18n";
import { LandingShell } from "../LandingShell";
import s from "../landing.module.css";

const FEATS: [string, string][] = [["templates", "Templates"], ["customization", "Customization"], ["personalized", "Personalized"], ["rsvp", "RSVP"], ["whatsapp", "WhatsApp"], ["guests", "Guests"], ["music", "Music"], ["gallery", "Gallery"], ["countdown", "Countdown"], ["maps", "Maps"], ["gift", "Digital gifts"]];
const PALS: [string, string, string, string][] = [["Ivory", "#EFE7DA", "#2B2420", "#A88452"], ["Wine", "#3E1A20", "#EBD9C0", "#C9A56E"], ["Forest", "#1E2A24", "#EDE6D6", "#C9A96E"], ["Blush", "#F1DCD6", "#4E2630", "#B5676F"], ["Midnight", "#16213A", "#ECE6D8", "#E0875A"]];
const GUESTS = ["Sarah", "Michael", "Amanda", "Rizky", "Mei Ling"];
const NEW_REPLIES: [string, string, string][] = [["Rizky", "2", "Attending"], ["Mei Ling", "1", "Attending"], ["Om Budi", "4", "Attending"], ["Dewi", "1", "Not attending"]];
const GROUPS: Record<string, [string, string][]> = { Invited: [["Rizky Hidayat", "Friends"], ["Om Budi", "Family"]], Opened: [["Sarah Putri", "Friends"], ["Amanda Lee", "Office"]], Confirmed: [["Michael Tan", "Friends"], ["Tara Wijaya", "Family"], ["Kevin & Mei", "Family"]], Declined: [["Pak Hendra", "Office"]] };
const COUNTS: Record<string, number> = { Invited: 64, Opened: 41, Confirmed: 118, Declined: 9 };
const GCOL: Record<string, string> = { Invited: "#6B5E50", Opened: "#4F4A7A", Confirmed: "#3F6A47", Declined: "#8C4A36" };

const ARTICLE = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,400px),1fr))", gap: "40px clamp(40px,6vw,100px)", alignItems: "center", padding: "64px 0", borderTop: "1px solid rgba(14,12,11,.12)" } as const;
const COPY = { display: "flex", flexDirection: "column", gap: 18, maxWidth: 460 } as const;
const NUM = { fontSize: 12, fontWeight: 600, color: "#8A5F38" } as const;
const H2 = { fontFamily: SERIF, fontWeight: 300, fontSize: "clamp(38px,4vw,60px)", lineHeight: 1, letterSpacing: "-.02em", margin: 0 } as const;
const P = { margin: 0, fontSize: 16.5, lineHeight: 1.6, color: "#4A423A" } as const;
const STAGE = { height: 440, borderRadius: 6 } as const;
const REPLY_FRESH = "rgba(201,165,110,.18)";

function Copy({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  const { tr } = useLang();
  return (
    <Reveal style={COPY}>
      <span style={NUM}>{n}</span>
      <h2 style={H2}>{tr(title)}</h2>
      <p style={P}>{children}</p>
    </Reveal>
  );
}

export function FeaturesPage() {
  const { tr } = useLang();
  const now = useNow();
  const [pal, setPal] = useState(0);
  const [g, setG] = useState(0);
  const [replies, setReplies] = useState<[string, string, string][]>([["Michael", "2", "Attending"], ["Tara", "3", "Attending"], ["Pak Hendra", "1", "Not attending"]]);
  const [fresh, setFresh] = useState(-1);
  const [ri, setRi] = useState(0);
  const [gTab, setGTab] = useState("Confirmed");
  const [music, setMusic] = useState(false);
  const [photo, setPhoto] = useState(1);
  const [copied, setCopied] = useState(false);

  const base = BY_SLUG.serenity.d;
  const p = PALS[pal];
  const custD: InviteData = { ...base, bg: p[1], fg: p[2], accent: p[3] };
  const diff = Math.max(0, EVENT_DATE - (now ?? EVENT_DATE));
  const cd: [string, number][] = [["Days", Math.floor(diff / 864e5)], ["Hours", Math.floor(diff / 36e5) % 24], ["Minutes", Math.floor(diff / 6e4) % 60], ["Seconds", Math.floor(diff / 1e3) % 60]];
  const photos = Object.keys(PHOTOS);
  const pName = GUESTS[g];

  const copyGift = () => {
    try { navigator.clipboard?.writeText("0000 0000 00"); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <LandingShell active="features" hover="brown" pad={90}>
      <section data-bg="#0E0C0B" data-screen-label="Features hero" style={{ position: "relative", background: "#0E0C0B", overflow: "hidden" }}>
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "radial-gradient(50% 60% at 80% 30%, rgba(201,165,110,.14), rgba(14,12,11,0) 70%)" }} />
        <div style={{ position: "relative", ...WRAP, padding: `clamp(150px,17vw,240px) ${PX} clamp(80px,9vw,120px)`, display: "flex", flexDirection: "column", gap: 30 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".28em", textTransform: "uppercase", color: "#C9A56E" }}>{tr("Features · 11 capabilities")}</div>
          <Reveal kind="blur" as="h1" style={{ fontFamily: SERIF, fontWeight: 300, fontSize: "clamp(52px,7.4vw,124px)", lineHeight: 0.92, letterSpacing: "-.03em", margin: 0, maxWidth: 1200, textWrap: "balance" }}>
            <TH k="page.features.title">{"Not just pretty templates. <em>A complete invitation platform.</em>"}</TH>
          </Reveal>
          <nav aria-label="Features" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 20 }}>
            {FEATS.map(([id, name], i) => (
              <a key={id} href={`#${id}`} className={s.chip} style={{ height: 38, padding: "0 16px", borderRadius: 999, border: "1px solid rgba(244,238,228,.18)", display: "inline-flex", alignItems: "center", gap: 10, fontSize: 13, color: "#F4EEE4" }}>
                <span style={{ fontSize: 11, color: "#C9A56E" }}>{String(i + 1).padStart(2, "0")}</span>
                {tr(name)}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <section data-bg="#F4EEE4" data-nav="light" data-screen-label="Feature list" style={{ background: "#F4EEE4", color: "#0E0C0B" }}>
        <div style={{ ...WRAP, padding: `clamp(80px,9vw,130px) ${PX} clamp(100px,12vw,170px)`, display: "flex", flexDirection: "column" }}>
          <article id="templates" style={ARTICLE}>
            <Reveal style={COPY}>
              <span style={NUM}>01</span>
              <h2 style={H2}>{tr("Beautiful templates")}</h2>
              <p style={P}>{tr("Designed in-house for weddings, seventeenths, birthdays, anniversaries and brand events. Each one is a starting point, not a cage.")}</p>
              <Link href="/templates" className={s.textLink} style={{ alignSelf: "flex-start", borderBottom: "1px solid currentColor", paddingBottom: 3 }}>{tr("Explore designs →")}</Link>
            </Reveal>
            <Reveal kind="scale" style={{ position: "relative", ...STAGE, background: "#E8D9BF", overflow: "hidden" }}>
              <div style={{ position: "absolute", left: "14%", top: "14%", width: "24%", aspectRatio: "9/19.5", transform: "rotate(-8deg)" }}><InviteScreen d={BY_SLUG.velvet.d} /></div>
              <div style={{ position: "absolute", left: "62%", top: "14%", width: "24%", aspectRatio: "9/19.5", transform: "rotate(8deg)" }}><InviteScreen d={BY_SLUG.chapter.d} /></div>
              <div style={{ position: "absolute", left: "36%", top: "6%", width: "28%", aspectRatio: "9/19.5", zIndex: 2 }}><InviteScreen d={base} /></div>
            </Reveal>
          </article>

          <article id="customization" style={ARTICLE}>
            <Copy n="02" title="Easy customization">{tr("Change names, wording, palette, type and photos in a guided editor. Try a palette here.")}</Copy>
            <Reveal kind="scale" style={{ ...STAGE, background: "#D9DAD5", display: "flex", alignItems: "center", justifyContent: "center", gap: "clamp(20px,4vw,56px)", padding: 24 }}>
              <div style={{ width: "min(180px,40%)", aspectRatio: "9/19.5" }}><InviteScreen d={custD} /></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".2em", textTransform: "uppercase", color: "#4E585B" }}>{tr("Palette")}</span>
                {PALS.map(([name, bg], i) => (
                  <button key={name} onClick={() => setPal(i)} style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, fontSize: 14 }}>
                    <span style={{ width: 30, height: 30, borderRadius: "50%", background: bg, boxShadow: `0 0 0 2px #D9DAD5, 0 0 0 3px ${i === pal ? "#0E0C0B" : "transparent"}` }} />
                    {tr(name)}
                  </button>
                ))}
              </div>
            </Reveal>
          </article>

          <article id="personalized" style={ARTICLE}>
            <Copy n="03" title="Personalized invitations">{tr("Every guest gets a unique link that opens with their name. Hosts see who opened it and when.")}</Copy>
            <Reveal kind="scale" style={{ ...STAGE, background: "#3E1A20", color: "#F1E3D3", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, padding: 24, textAlign: "center" }}>
              <span style={{ fontSize: 12, letterSpacing: ".24em", textTransform: "uppercase", color: "#D9B98A" }}>{tr("You're invited to Rad & Cil's wedding")}</span>
              <span style={{ fontFamily: SERIF, fontWeight: 300, fontSize: "clamp(56px,6vw,96px)", lineHeight: 1 }}>{tr("Hi, ")}<em>{pName}</em></span>
              <span style={{ fontSize: 14, color: "#D6BFAE" }}>mula.co/radandcil/{pName.toLowerCase().replace(/\s+/g, "-")}</span>
              <button onClick={() => setG((g + 1) % GUESTS.length)} style={{ height: 44, padding: "0 22px", borderRadius: 999, border: "1px solid rgba(241,227,211,.35)", background: "transparent", color: "#F1E3D3", font: "inherit", fontSize: 13, cursor: "pointer" }}>{tr("Next guest →")}</button>
            </Reveal>
          </article>

          <article id="rsvp" style={ARTICLE}>
            <Copy n="04" title="RSVP">{tr("Guests confirm attendance and number of guests from the invitation. Replies appear in your dashboard immediately.")}</Copy>
            <Reveal kind="scale" style={{ ...STAGE, background: "#EBD3CB", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
              <div style={{ width: "min(360px,100%)", background: "#FBF6F2", borderRadius: 10, padding: 20, display: "flex", flexDirection: "column", gap: 4, boxShadow: "0 30px 60px -30px rgba(80,30,30,.5)", fontSize: 13 }}>
                <span style={{ fontWeight: 600, paddingBottom: 10 }}>{tr("Latest replies")}</span>
                {replies.slice(0, 4).map(([name, n, status], i) => (
                  <div key={`${name}-${i}`} style={{ display: "flex", justifyContent: "space-between", padding: "11px 10px", margin: "0 -10px", borderRadius: 6, background: i === 0 && fresh >= 0 ? REPLY_FRESH : "transparent" }}>
                    <span>{name} · {n === "1" ? `1 ${tr("guest")}` : `${n} ${tr("guests")}`}</span>
                    <span style={{ color: status === "Attending" ? "#3F6A47" : "#8C4A36" }}>{tr(status)}</span>
                  </div>
                ))}
                <button onClick={() => { setReplies([NEW_REPLIES[ri % NEW_REPLIES.length], ...replies]); setFresh(ri); setRi(ri + 1); }} style={{ marginTop: 10, height: 40, borderRadius: 999, border: "1px solid rgba(14,12,11,.2)", background: "transparent", font: "inherit", fontSize: 13, cursor: "pointer" }}>{tr("Simulate a reply")}</button>
              </div>
            </Reveal>
          </article>

          <article id="whatsapp" style={ARTICLE}>
            <Copy n="05" title="WhatsApp sharing">{tr("Mula writes the message for each guest, with their name and personal link, ready to send.")}</Copy>
            <Reveal kind="scale" style={{ ...STAGE, background: "#171412", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
              <div style={{ maxWidth: 300, borderRadius: "14px 14px 4px 14px", background: "#1F4A3D", color: "#EAF3EE", padding: "14px 16px", fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-line" }}>
                {`${tr("Hi Sarah 👋")}\n\n${tr("You're invited to")}\n${tr("Rad & Cil's wedding.")}\n\n${tr("Open invitation:")}\n`}
                <span style={{ color: "#9FD9C0", textDecoration: "underline" }}>mula.co/radandcil/sarah</span>
              </div>
            </Reveal>
          </article>

          <article id="guests" style={ARTICLE}>
            <Copy n="06" title="Guest management">{tr("Import your list, group guests and follow every invitation from sent to confirmed.")}</Copy>
            <Reveal kind="scale" style={{ ...STAGE, background: "#E8D9BF", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
              <div style={{ width: "min(400px,100%)", background: "#FBF8F3", borderRadius: 10, padding: 18, display: "flex", flexDirection: "column", gap: 12, boxShadow: "0 30px 60px -30px rgba(60,40,20,.45)", fontSize: 13 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 6 }}>
                  {Object.keys(COUNTS).map((k) => (
                    <button key={k} onClick={() => setGTab(k)} style={{ padding: "10px 4px", borderRadius: 6, border: `1px solid ${k === gTab ? "#0E0C0B" : "rgba(14,12,11,.1)"}`, background: k === gTab ? "#fff" : "transparent", font: "inherit", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, color: "#0E0C0B" }}>
                      <span style={{ fontFamily: SERIF, fontSize: 24, lineHeight: 1 }}>{COUNTS[k]}</span>
                      <span style={{ fontSize: 11, color: GCOL[k] }}>{tr(k)}</span>
                    </button>
                  ))}
                </div>
                {GROUPS[gTab].map(([name, group]) => (
                  <div key={name} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid rgba(14,12,11,.07)" }}>
                    <span>{name}</span>
                    <span style={{ color: "#7A6E62" }}>{tr(group)}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </article>

          <article id="music" style={ARTICLE}>
            <Copy n="07" title="Music">{tr("Choose from our library or upload your own song. Guests can pause it anytime.")}</Copy>
            <Reveal kind="scale" style={{ ...STAGE, background: "#16213A", color: "#ECE6D8", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, padding: 24 }}>
              <button onClick={() => setMusic(!music)} aria-label="Play or pause" style={{ width: 96, height: 96, borderRadius: "50%", border: "1px solid rgba(236,230,216,.4)", background: "transparent", color: "#ECE6D8", fontSize: 22, cursor: "pointer" }}>{music ? "❚❚" : "▶"}</button>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: SERIF, fontSize: 30 }}>Clair de Lune</span>
                <span style={{ fontSize: 13, opacity: 0.75 }}>{tr("Claude Debussy · sample")}</span>
              </div>
              <span style={{ opacity: music ? 1 : 0.15, transition: "opacity .3s" }}>
                <Eq n={7} w={3} h={40} gap={4} color="#E0875A" dur={(k) => 0.6 + (k % 3) * 0.2} delay={(k) => k * 0.08} />
              </span>
            </Reveal>
          </article>

          <article id="gallery" style={ARTICLE}>
            <Copy n="08" title="Photo gallery">{tr("Share your story in pictures, framed by your template. Tap a frame to view it larger.")}</Copy>
            <Reveal kind="scale" style={{ ...STAGE, background: "#F0E6DA", display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 10, padding: 18 }}>
              <div style={{ borderRadius: 4, background: PHOTOS[photos[photo]] || "#ccc", transition: "background .6s" }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {photos.map((k, i) => (
                  <button key={k} onClick={() => setPhoto(i)} aria-label={`${tr("Photo")} ${i + 1}`} style={{ border: "none", borderRadius: 4, background: PHOTOS[k], cursor: "pointer", boxShadow: `0 0 0 2px ${i === photo ? "#0E0C0B" : "transparent"}` }} />
                ))}
              </div>
            </Reveal>
          </article>

          <article id="countdown" style={ARTICLE}>
            <Copy n="09" title="Countdown">{tr("A live countdown to your day, counting down every second for your guests.")}</Copy>
            <Reveal kind="scale" style={{ ...STAGE, background: "#0E0C0B", color: "#E8D9BF", display: "flex", alignItems: "center", justifyContent: "center", gap: "clamp(16px,3vw,40px)", padding: 24 }}>
              {cd.map(([l, v]) => (
                <div key={l} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: SERIF, fontWeight: 300, fontSize: "clamp(48px,5vw,84px)", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{String(v).padStart(2, "0")}</span>
                  <span style={{ fontSize: 11, letterSpacing: ".24em", textTransform: "uppercase", color: "#9C9186" }}>{tr(l)}</span>
                </div>
              ))}
            </Reveal>
          </article>

          <article id="maps" style={ARTICLE}>
            <Copy n="10" title="Maps">{tr("Your venue, pinned. Guests open directions in Google Maps or Waze in one tap.")}</Copy>
            <Reveal kind="scale" style={{ position: "relative", ...STAGE, overflow: "hidden", background: "#E3E1DA", backgroundImage: "linear-gradient(rgba(14,12,11,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(14,12,11,.06) 1px, transparent 1px)", backgroundSize: "44px 44px" }}>
              <div aria-hidden="true" style={{ position: "absolute", left: "-10%", top: "58%", width: "130%", height: 14, background: "#F6F3EC", transform: "rotate(-12deg)" }} />
              <div aria-hidden="true" style={{ position: "absolute", left: "38%", top: "-10%", width: 12, height: "130%", background: "#F6F3EC", transform: "rotate(8deg)" }} />
              <div aria-hidden="true" style={{ position: "absolute", left: "58%", top: "12%", width: "26%", height: "30%", borderRadius: "40% 50% 45% 55%", background: "#CFD8C6" }} />
              <div style={{ position: "absolute", left: "44%", top: "38%", width: 22, height: 22, borderRadius: "50% 50% 50% 0", transform: "rotate(-45deg)", background: "#3E1A20", boxShadow: "0 8px 16px -4px rgba(62,26,32,.5)" }} />
              <div style={{ position: "absolute", left: 20, right: 20, bottom: 20, background: "#FBF8F3", borderRadius: 10, padding: 16, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, fontSize: 13, boxShadow: "0 20px 40px -20px rgba(0,0,0,.3)" }}>
                <span style={{ display: "flex", flexDirection: "column", gap: 2 }}><span style={{ fontWeight: 600 }}>{tr("The Glasshouse")}</span><span style={{ color: "#7A6E62" }}>{tr("Jakarta · 16.00")}</span></span>
                <span style={{ display: "flex", gap: 6 }}><span style={{ padding: "8px 14px", borderRadius: 999, background: "#0E0C0B", color: "#F4EEE4" }}>Google Maps</span><span style={{ padding: "8px 14px", borderRadius: 999, border: "1px solid rgba(14,12,11,.2)" }}>Waze</span></span>
              </div>
            </Reveal>
          </article>

          <article id="gift" style={{ ...ARTICLE, borderBottom: "1px solid rgba(14,12,11,.12)" }}>
            <Copy n="11" title="Digital gifts">{tr("Add bank or e-wallet details for guests who would like to send a gift. They copy the number in one tap.")}</Copy>
            <Reveal kind="scale" style={{ ...STAGE, background: "#EBD3CB", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
              <div style={{ width: "min(340px,100%)", aspectRatio: "1.6", borderRadius: 14, background: "#2B2418", color: "#E2C27A", padding: 22, display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 40px 70px -30px rgba(43,36,24,.7)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, letterSpacing: ".2em", textTransform: "uppercase" }}><span>{tr("Wedding gift")}</span><span>{tr("Bank")}</span></div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 20, letterSpacing: ".12em", fontVariantNumeric: "tabular-nums" }}>0000 0000 00</span>
                  <span style={{ fontSize: 12, opacity: 0.8 }}>{tr("Account holder name")}</span>
                </div>
                <button onClick={copyGift} style={{ alignSelf: "flex-start", height: 36, padding: "0 16px", borderRadius: 999, border: "1px solid rgba(226,194,122,.5)", background: "transparent", color: "#E2C27A", font: "inherit", fontSize: 12, cursor: "pointer" }}>{copied ? tr("Copied ✓") : tr("Copy number")}</button>
              </div>
            </Reveal>
          </article>
        </div>
      </section>

      <section data-bg="#E8D9BF" data-nav="light" data-screen-label="Features CTA" style={{ background: "#E8D9BF", color: "#0E0C0B" }}>
        <div style={{ ...WRAP, padding: `clamp(90px,10vw,140px) ${PX}`, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 32 }}>
          <Reveal kind="blur" as="h2" style={{ fontFamily: SERIF, fontWeight: 300, fontSize: "clamp(42px,5vw,80px)", lineHeight: 0.95, letterSpacing: "-.025em", margin: 0, maxWidth: 760 }}>
            <Em a="All of it, in " b="one invitation." />
          </Reveal>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <Link href="/templates" style={{ display: "inline-flex", alignItems: "center", height: 54, padding: "0 26px", borderRadius: 999, border: "1px solid rgba(14,12,11,.3)", fontSize: 14 }}><TH k="cta.explore">Explore designs</TH></Link>
            <Magnetic>
              <Link href="/register" data-cursor="Create" className={s.btnDark} style={{ height: 54, padding: "0 28px" }}>
                <TH k="cta.create">Create your invitation</TH>
                <span data-arrow="1">→</span>
              </Link>
            </Magnetic>
          </div>
        </div>
      </section>
    </LandingShell>
  );
}

