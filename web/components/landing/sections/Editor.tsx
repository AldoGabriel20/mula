"use client";

import { useRef, useState } from "react";
import { Reveal } from "@/lib/motion";
import { InviteScreen, type InviteData } from "../InviteScreen";
import { BY_SLUG, PHOTOS } from "../data";
import { SERIF, fam } from "../fonts";
import { TH, useLang } from "../i18n";
import { useInView, useInterval } from "../hooks";
import s from "../landing.module.css";

const ED_TABS = ["Template", "Text", "Typography", "Colours", "Photos", "Music", "RSVP", "Guests"];
const ED_TPLS = ["serenity", "arunika", "maison", "linen"];
const ED_TYPES = [
  { name: "Classic", font: "'Bodoni Moda', serif", italic: "italic", weight: 400, size: 15, ls: "-0.01em" },
  { name: "Script", font: "'Pinyon Script', cursive", italic: "normal", weight: 400, size: 16, ls: "0" },
  { name: "Display", font: "'Italiana', serif", italic: "normal", weight: 400, size: 13.5, ls: "0" },
  { name: "Modern", font: "'Manrope', sans-serif", italic: "normal", weight: 300, size: 12.5, ls: "-0.045em" },
];
const ED_PALS = [
  { name: "Ivory", bg: "#EFE7DA", fg: "#2B2420", accent: "#A88452" },
  { name: "Forest", bg: "#1E2A24", fg: "#EDE6D6", accent: "#C9A96E" },
  { name: "Wine", bg: "#3E1A20", fg: "#EBD9C0", accent: "#C9A56E" },
  { name: "Blush", bg: "#F1DCD6", fg: "#4E2630", accent: "#B5676F" },
  { name: "Midnight", bg: "#16213A", fg: "#ECE6D8", accent: "#E0875A" },
];
const ED_PHOTOS: [string, string | null][] = [["None", null], ["Dusk", "dusk"], ["Garden", "garden"], ["Blush", "blush"], ["Noir", "noir"], ["Sea", "sea"]];
const TRACKS = [["Gymnopédie No. 1", "Erik Satie"], ["Clair de Lune", "Claude Debussy"], ["Bengawan Solo", "Instrumental"]];
const GUESTS = [["Sarah", "sarah", "Opened"], ["Michael", "michael", "Confirmed"], ["Amanda", "amanda", "Invited"], ["Pak Hendra", "hendra", "Declined"], ["Tara Wijaya", "tara", "Confirmed"]];
export const STATUS: Record<string, [string, string]> = { Invited: ["#ECE6DC", "#6B5E50"], Opened: ["#E6E3EF", "#4F4A7A"], Confirmed: ["#E1ECDF", "#3F6A47"], Declined: ["#F3E2DC", "#8C4A36"], Pending: ["#F2EAE0", "#7A6A52"] };
const RSVP_OPTS = ["Collect RSVP", "Ask number of guests", "Collect dietary notes"];

const HINT = { fontSize: 11, fontWeight: 600, letterSpacing: ".22em", textTransform: "uppercase", color: "#8A5F38" } as const;
const INPUT = { height: 46, border: "1px solid rgba(14,12,11,.16)", borderRadius: 6, background: "#fff", padding: "0 12px", fontFamily: "inherit", fontSize: 15, color: "#0E0C0B" } as const;
const BARE = { all: "unset", cursor: "pointer" } as const;

function Eq() {
  return (
    <span style={{ display: "inline-flex", gap: 2, alignItems: "flex-end", height: 14 }}>
      {[0, 1, 2, 3].map((k) => <span key={k} style={{ width: 2, height: 14, background: "#8A5F38", transformOrigin: "bottom", animation: `mulaEq ${0.7 + k * 0.15}s ${k * 0.1}s infinite ease-in-out` }} />)}
    </span>
  );
}

export function Editor() {
  const { t, tr } = useLang();
  const [ref, inView] = useInView<HTMLElement>();
  const [auto, setAuto] = useState(true);
  const [tab, setTab] = useState(0);
  const [tpl, setTpl] = useState(0);
  const [n1, setN1] = useState("Raka");
  const [n2, setN2] = useState("Celine");
  const [date, setDate] = useState("Saturday · 12 April 2027");
  const [type, setType] = useState(-1);
  const [pal, setPal] = useState(-1);
  const [photo, setPhoto] = useState(0);
  const [track, setTrack] = useState(-1);
  const [rsvp, setRsvp] = useState([true, true, false]);
  const [guest, setGuest] = useState(0);
  const acc = useRef(0);

  const stop = () => setAuto(false);
  // Auto-tour: every 2.6s move to the next tab and apply that tab's change (prototype edAdvance).
  useInterval(() => {
    acc.current += 100;
    if (acc.current < 2600) return;
    acc.current = 0;
    const nt = (tab + 1) % ED_TABS.length;
    setTab(nt);
    if (nt === 0) setTpl((v) => (v + 1) % ED_TPLS.length);
    if (nt === 2) setType((v) => (v + 1) % ED_TYPES.length);
    if (nt === 3) setPal((v) => (v + 1) % ED_PALS.length);
    if (nt === 4) setPhoto((v) => (v % (ED_PHOTOS.length - 1)) + 1);
    if (nt === 5) setTrack(0);
    if (nt === 7) setGuest(0);
  }, 100, inView && auto);

  const base = BY_SLUG[ED_TPLS[tpl]].d;
  let edD: InviteData = { ...base, title: `${n1 || "Raka"} & ${n2 || "Celine"}`, date };
  if (type >= 0) { const ty = ED_TYPES[type]; edD = { ...edD, font: ty.font, italic: ty.italic, weight: ty.weight, size: ty.size, ls: ty.ls }; }
  if (pal >= 0) { const p = ED_PALS[pal]; edD = { ...edD, bg: p.bg, fg: p.fg, accent: p.accent }; }
  const ph = ED_PHOTOS[photo];
  if (ph && ph[1]) edD = { ...edD, photo: PHOTOS[ph[1]], variant: edD.variant === "cover" ? "cover" : "photo" };
  else if (photo === 0 && edD.variant === "photo") edD = { ...edD, variant: "arch" };
  if (tab === 7) edD = { ...edD, guest: GUESTS[guest][0] };
  const edSlug = `${(n1 || "raka").toLowerCase().replace(/[^a-z]/g, "")}-${(n2 || "celine").toLowerCase().replace(/[^a-z]/g, "")}`;
  const sel = (on: boolean, c = "#0E0C0B") => (on ? c : "transparent");

  return (
    <section ref={ref} data-bg="#F4EEE4" data-nav="light" data-screen-label="05 Editor" style={{ background: "#F4EEE4", color: "#0E0C0B" }}>
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "clamp(110px,13vw,190px) clamp(20px,3.6vw,52px)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,420px),1fr))", gap: "32px 64px", alignItems: "end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
            <div style={HINT}>{t("home.editor.label", "The editor")}</div>
            <Reveal kind="blur" as="h2" style={{ fontFamily: SERIF, fontWeight: 300, fontSize: "clamp(56px,8vw,132px)", lineHeight: 0.9, letterSpacing: "-.03em", margin: 0 }}>
              <TH k="home.editor.title">{"Make it <em>yours.</em>"}</TH>
            </Reveal>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 440 }}>
            <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6, color: "#4A423A" }}>{tr("Mula isn't just a collection of pretty templates. It is a complete invitation platform: design, words, photos, music, RSVP and guests, edited in one place and previewed live.")}</p>
            <a href="#how" className={s.textLink}>
              <span>{t("cta.how", "See how it works")}</span>
              <span>→</span>
            </a>
          </div>
        </div>

        <Reveal kind="scale" style={{ marginTop: 64, borderRadius: 12, background: "#FBF8F3", boxShadow: "0 60px 120px -50px rgba(60,40,20,.45), 0 0 0 1px rgba(14,12,11,.07)", overflow: "hidden" }}>
          <div style={{ height: 48, display: "flex", alignItems: "center", gap: 16, padding: "0 16px", borderBottom: "1px solid rgba(14,12,11,.07)", background: "#F6F1E9" }}>
            <div style={{ display: "flex", gap: 7 }}>
              {["#E2B8A8", "#E8D2A6", "#BFD0B8"].map((c) => <span key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c }} />)}
            </div>
            <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
              <span style={{ fontSize: 12, color: "#7A6E62", background: "#FBF8F3", borderRadius: 6, padding: "6px 14px", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>app.mula.co/editor/{edSlug}</span>
            </div>
            <div style={{ display: "flex", gap: 8, fontSize: 12 }}>
              <span style={{ height: 30, padding: "0 12px", borderRadius: 999, border: "1px solid rgba(14,12,11,.15)", display: "flex", alignItems: "center" }}>{tr("Preview")}</span>
              <span style={{ height: 30, padding: "0 12px", borderRadius: 999, background: "#0E0C0B", color: "#F4EEE4", display: "flex", alignItems: "center" }}>{tr("Publish")}</span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 22, padding: "clamp(20px,2.4vw,32px)", borderRight: "1px solid rgba(14,12,11,.07)" }}>
              <div role="tablist" aria-label="Editor sections" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {ED_TABS.map((n, i) => (
                  <button key={n} role="tab" aria-selected={i === tab} onClick={() => { stop(); setTab(i); }} style={{ height: 36, padding: "0 14px", borderRadius: 999, border: `1px solid ${i === tab ? "#0E0C0B" : "rgba(14,12,11,.16)"}`, background: sel(i === tab), color: i === tab ? "#F4EEE4" : "#0E0C0B", fontSize: 13, cursor: "pointer", transition: "all .3s" }}>{tr(n)}</button>
                ))}
              </div>
              <div style={{ height: 1, background: "rgba(14,12,11,.07)" }} />
              <div style={{ minHeight: 300, display: "flex", flexDirection: "column", gap: 16, fontSize: 13 }}>
                <div style={HINT}>{tr(ED_TABS[tab])}</div>
                {tab === 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10 }}>
                    {ED_TPLS.map((slug, i) => {
                      const tp = BY_SLUG[slug];
                      return (
                        <button key={slug} onClick={() => { stop(); setTpl(i); setType(-1); setPal(-1); }} style={{ ...BARE, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
                          <span style={{ width: "100%", aspectRatio: "3/4", borderRadius: 6, background: tp.d.bg, boxShadow: `0 0 0 2px #FBF8F3, 0 0 0 3px ${sel(i === tpl)}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fam(tp.d.font), fontStyle: tp.d.italic || "normal", fontSize: 20, color: tp.d.fg }}>Aa</span>
                          <span style={{ fontSize: 12 }}>{tp.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {tab === 1 && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: 6, color: "#7A6E62" }}>{tr("First name")}<input className={s.input} value={n1} onChange={(e) => { stop(); setN1(e.target.value); }} maxLength={14} style={INPUT} /></label>
                    <label style={{ display: "flex", flexDirection: "column", gap: 6, color: "#7A6E62" }}>{tr("Second name")}<input className={s.input} value={n2} onChange={(e) => { stop(); setN2(e.target.value); }} maxLength={14} style={INPUT} /></label>
                    <label style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 6, color: "#7A6E62" }}>{tr("Date")}<input className={s.input} value={date} onChange={(e) => { stop(); setDate(e.target.value); }} maxLength={34} style={INPUT} /></label>
                  </div>
                )}
                {tab === 2 && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {ED_TYPES.map((o, i) => (
                      <button key={o.name} onClick={() => { stop(); setType(i); }} style={{ height: 84, borderRadius: 8, border: `1px solid ${i === type ? "#0E0C0B" : "rgba(14,12,11,.12)"}`, background: i === type ? "#fff" : "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, color: "#0E0C0B" }}>
                        <span style={{ fontFamily: fam(o.font), fontStyle: o.italic, fontWeight: o.weight, fontSize: 26, lineHeight: 1 }}>Raka</span>
                        <span style={{ fontSize: 11, color: "#7A6E62" }}>{tr(o.name)}</span>
                      </button>
                    ))}
                  </div>
                )}
                {tab === 3 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
                    {ED_PALS.map((o, i) => (
                      <button key={o.name} onClick={() => { stop(); setPal(i); }} style={{ ...BARE, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 48, height: 48, borderRadius: "50%", background: o.bg, boxShadow: `0 0 0 3px #FBF8F3, 0 0 0 4px ${sel(i === pal)}, inset 0 0 0 1px rgba(14,12,11,.1)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ width: 14, height: 14, borderRadius: "50%", background: o.accent }} />
                        </span>
                        <span style={{ fontSize: 12 }}>{tr(o.name)}</span>
                      </button>
                    ))}
                  </div>
                )}
                {tab === 4 && (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 10 }}>
                      {ED_PHOTOS.map(([name, key], i) => (
                        <button key={name} onClick={() => { stop(); setPhoto(i); }} aria-label={name} style={{ ...BARE, display: "flex", flexDirection: "column", gap: 6 }}>
                          <span style={{ aspectRatio: "4/5", borderRadius: 6, background: key ? PHOTOS[key] : "repeating-linear-gradient(45deg, #EDE6DB 0 6px, #F6F1E9 6px 12px)", boxShadow: `0 0 0 2px #FBF8F3, 0 0 0 3px ${sel(i === photo)}` }} />
                          <span style={{ fontSize: 12 }}>{tr(name)}</span>
                        </button>
                      ))}
                    </div>
                    <span style={{ color: "#7A6E62" }}>{tr("Sample photo moods. Upload your own in the editor.")}</span>
                  </>
                )}
                {tab === 5 && (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {TRACKS.map(([name, by], i) => (
                      <button key={name} onClick={() => { stop(); setTrack(track === i ? -1 : i); }} style={{ ...BARE, display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: "1px solid rgba(14,12,11,.07)" }}>
                        <span style={{ width: 36, height: 36, borderRadius: "50%", background: track === i ? "#0E0C0B" : "#EFE8DD", color: track === i ? "#F4EEE4" : "#0E0C0B", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flex: "none" }}>{track === i ? "❚❚" : "▶"}</span>
                        <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                          <span style={{ fontSize: 14 }}>{name}</span>
                          <span style={{ fontSize: 12, color: "#7A6E62" }}>{tr(by)}</span>
                        </span>
                        <span style={{ opacity: track === i ? 1 : 0 }}><Eq /></span>
                      </button>
                    ))}
                  </div>
                )}
                {tab === 6 && (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {RSVP_OPTS.map((n, i) => (
                      <button key={n} onClick={() => { stop(); setRsvp((r) => r.map((v, j) => (j === i ? !v : v))); }} style={{ ...BARE, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 0", borderBottom: "1px solid rgba(14,12,11,.07)" }}>
                        <span style={{ fontSize: 14 }}>{tr(n)}</span>
                        <span style={{ width: 40, height: 24, borderRadius: 999, background: rsvp[i] ? "#0E0C0B" : "rgba(14,12,11,.16)", position: "relative", transition: "background .3s" }}>
                          <span style={{ position: "absolute", top: 3, left: rsvp[i] ? 19 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,.2)", transition: "left .3s" }} />
                        </span>
                      </button>
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 0", color: "#7A6E62" }}>
                      <span>{tr("Reply by")}</span>
                      <span style={{ color: "#0E0C0B" }}>1 March 2027</span>
                    </div>
                  </div>
                )}
                {tab === 7 && (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {GUESTS.map(([name, slug, status], i) => (
                      <button key={slug} onClick={() => { stop(); setGuest(i); }} style={{ ...BARE, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "11px 10px", margin: "0 -10px", borderRadius: 6, background: i === guest ? "rgba(201,165,110,.16)" : "transparent" }}>
                        <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <span style={{ fontSize: 14 }}>{name}</span>
                          <span style={{ fontSize: 11, color: "#7A6E62" }}>mula.co/{edSlug}/{slug}</span>
                        </span>
                        <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 999, background: STATUS[status][0], color: STATUS[status][1] }}>{tr(status)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(32px,4vw,64px) 20px", background: "#EFE8DD", minHeight: 560 }}>
              <div aria-hidden="true" style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(14,12,11,.09) 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
              <div style={{ position: "relative", width: "min(270px,62vw)", aspectRatio: "9/19.5" }}>
                <InviteScreen d={edD} />
                <div style={{ position: "absolute", top: "8%", right: "-14%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 999, background: "#0E0C0B", color: "#F4EEE4", fontSize: 11, boxShadow: "0 14px 30px -12px rgba(0,0,0,.5)", opacity: track >= 0 ? 1 : 0, transform: `translateY(${track >= 0 ? 0 : 8}px)`, transition: "opacity .4s, transform .5s" }}>♪ {track >= 0 ? TRACKS[track][0] : ""}</div>
                <div style={{ position: "absolute", left: "-16%", bottom: "16%", padding: "12px 14px", borderRadius: 10, background: "#FBF8F3", color: "#0E0C0B", fontSize: 11, boxShadow: "0 20px 40px -16px rgba(0,0,0,.35)", display: "flex", flexDirection: "column", gap: 6, opacity: tab === 6 && rsvp[0] ? 1 : 0, transform: `translateY(${tab === 6 ? 0 : 10}px)`, transition: "opacity .4s, transform .5s" }}>
                  <span style={{ fontWeight: 600 }}>{tr("RSVP enabled")}</span>
                  <span style={{ color: "#7A6E62" }}>{tr("Guests reply from the invitation")}</span>
                </div>
              </div>
              <div style={{ position: "absolute", left: 16, bottom: 14, fontSize: 11, color: "#7A6E62", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#5C8A63" }} />
                {tr("Live preview")}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
