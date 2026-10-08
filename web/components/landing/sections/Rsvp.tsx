"use client";

import { useRef, useState } from "react";
import { Reveal } from "@/lib/motion";
import { PHOTOS } from "../data";
import { SANS, SERIF } from "../fonts";
import { TH, useLang } from "../i18n";
import { useInView, useInterval } from "../hooks";
import { STATUS } from "./Editor";

const RS_BASE: [string, string, string, string][] = [["Michael Tan", "2", "Confirmed", "Yesterday"], ["Amanda Lee", "1", "Pending", "Opened 2h ago"], ["Pak Hendra", "1", "Declined", "Monday"], ["Tara Wijaya", "3", "Confirmed", "Monday"]];
const FLOW = ["Invitation", "Guest", "Data", "Host"];
const SERIF_BTN = { fontFamily: SERIF, fontSize: "7cqw" } as const;

export function Rsvp() {
  const { t, tr } = useLang();
  const [ref, inView] = useInView<HTMLElement>();
  const [rs, setRs] = useState(0); // 0 ask · 1 count · 2 thanks
  const [choice, setChoice] = useState<"yes" | "no">("yes");
  const [count, setCount] = useState(2);
  const [auto, setAuto] = useState(true);
  const manual = () => setAuto(false);

  // Auto-demo (prototype rsAdvance, every 2.1s while visible and untouched).
  const acc = useRef(0);
  useInterval(() => {
    acc.current += 100;
    if (acc.current < 2100) return;
    acc.current = 0;
    if (rs === 0) { setRs(1); setChoice("yes"); setCount(1); }
    else if (rs === 1) { if (count < 2) setCount(2); else setRs(2); }
    else setRs(0);
  }, 100, inView && auto);

  const done = rs === 2, yes = done && choice === "yes", no = done && choice === "no";
  const sarah = done ? [["Sarah", String(yes ? count : 0), yes ? "Confirmed" : "Declined", "Just now", true] as const] : [];
  const rows = [...sarah, ...RS_BASE.map((r) => [...r, false] as const)].slice(0, 5);
  const flowLit = [1, 2, 4][rs];

  return (
    <section ref={ref} data-bg="#EBD3CB" data-nav="light" data-screen-label="07 RSVP" style={{ background: "#EBD3CB", color: "#1E1412" }}>
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "clamp(110px,13vw,190px) clamp(20px,3.6vw,52px)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,420px),1fr))", gap: "32px 64px", alignItems: "end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".28em", textTransform: "uppercase", color: "#7E3F3A" }}>{t("home.rsvp.label", "RSVP")}</div>
            <Reveal kind="blur" as="h2" style={{ fontFamily: SERIF, fontWeight: 300, fontSize: "clamp(46px,5.6vw,92px)", lineHeight: 0.95, letterSpacing: "-.025em", margin: 0, textWrap: "balance" }}>
              <TH k="home.rsvp.title">{"From their reply <em>to your guest list.</em>"}</TH>
            </Reveal>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontSize: 12, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase" }}>
            {FLOW.map((n, i) => (
              <span key={n} style={{ display: "flex", alignItems: "center", gap: 10, opacity: i < flowLit ? 1 : 0.35, transition: "opacity .5s" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: i < flowLit ? "#7E3F3A" : "rgba(30,20,18,.25)", transition: "background .5s" }} />
                {tr(n)}
                <span style={{ width: 24, height: 1, background: "rgba(30,20,18,.3)", opacity: i < 3 ? 1 : 0 }} />
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))", gap: 48, marginTop: 64, alignItems: "center" }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ containerType: "inline-size", width: "min(300px,76vw)", aspectRatio: "9/19.5", padding: "2.6%", background: "#0c0b0a", borderRadius: "15% / 7%", boxShadow: "0 60px 100px -40px rgba(80,30,30,.55)" }}>
              <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: "12.5cqw", overflow: "hidden", background: "#F6EEE7", color: "#2A1D1A", display: "flex", flexDirection: "column" }}>
                <div style={{ height: "38%", background: PHOTOS.blush || "#EBC2C0", position: "relative" }}>
                  <div style={{ position: "absolute", inset: "auto 0 0 0", height: "50%", background: "linear-gradient(to bottom, rgba(246,238,231,0), #F6EEE7)" }} />
                  <div style={{ position: "absolute", top: "3.4cqw", left: "50%", transform: "translateX(-50%)", width: "27cqw", height: "7.6cqw", borderRadius: "8cqw", background: "#0c0b0a" }} />
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "2cqw 8cqw 8cqw", gap: "3cqw" }}>
                  <span style={{ fontSize: "3cqw", letterSpacing: ".24em", textTransform: "uppercase", color: "#8A5A50" }}>The engagement of</span>
                  <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "12cqw", lineHeight: 1 }}>Rad &amp; Cil</span>
                  <span style={{ fontSize: "3.4cqw", color: "#7A625A" }}>Dear Sarah</span>
                  <div style={{ width: "100%", marginTop: "auto", display: "flex", flexDirection: "column", gap: "3cqw" }}>
                    {rs === 0 && (
                      <>
                        <span style={SERIF_BTN}>{tr("Will you attend?")}</span>
                        <button onClick={() => { manual(); setRs(1); setChoice("yes"); }} style={{ height: "13cqw", borderRadius: 99, border: "none", background: "#2A1D1A", color: "#F6EEE7", fontSize: "4cqw", cursor: "pointer" }}>{tr("Attending")}</button>
                        <button onClick={() => { manual(); setRs(2); setChoice("no"); }} style={{ height: "13cqw", borderRadius: 99, border: "1px solid rgba(42,29,26,.25)", background: "transparent", color: "#2A1D1A", fontSize: "4cqw", cursor: "pointer" }}>{tr("Not attending")}</button>
                      </>
                    )}
                    {rs === 1 && (
                      <>
                        <span style={SERIF_BTN}>{tr("How many guests?")}</span>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "2cqw" }}>
                          {[1, 2, 3, 4].map((n) => (
                            <button key={n} onClick={() => { manual(); setCount(n); }} style={{ height: "12cqw", borderRadius: "3cqw", border: `1px solid ${n === count ? "#2A1D1A" : "rgba(42,29,26,.2)"}`, background: n === count ? "#2A1D1A" : "transparent", color: n === count ? "#F6EEE7" : "#2A1D1A", fontSize: "4.4cqw", cursor: "pointer" }}>{n}</button>
                          ))}
                        </div>
                        <button onClick={() => { manual(); setRs(2); }} style={{ height: "13cqw", borderRadius: 99, border: "none", background: "#2A1D1A", color: "#F6EEE7", fontSize: "4cqw", cursor: "pointer" }}>{tr("Confirm")}</button>
                      </>
                    )}
                    {rs === 2 && (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3cqw", paddingBottom: "4cqw" }}>
                        <span style={{ width: "16cqw", height: "16cqw", borderRadius: "50%", border: "1px solid #8A5A50", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "6cqw", color: "#8A5A50" }}>✓</span>
                        <span style={{ ...SERIF_BTN, lineHeight: 1.1 }}>{choice === "yes" ? tr("Thank you, Sarah. See you on 20 March.") : tr("Thank you for letting us know, Sarah.")}</span>
                        <button onClick={() => { manual(); setRs(0); }} style={{ border: "none", background: "none", fontSize: "3.4cqw", color: "#8A5A50", textDecoration: "underline", cursor: "pointer", fontFamily: SANS }}>{tr("Change reply")}</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: "#FBF6F2", borderRadius: 12, boxShadow: "0 50px 100px -50px rgba(80,30,30,.5), 0 0 0 1px rgba(30,20,18,.06)", padding: "clamp(20px,2.4vw,32px)", display: "flex", flexDirection: "column", gap: 20, fontSize: 13 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: SERIF, fontSize: 26 }}>Guest list · Rad &amp; Cil</span>
              <span style={{ fontSize: 11, color: "#7A625A", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#5C8A63" }} />
                {tr("Live")}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8 }}>
              {([["#E4EDE2", "#3F6A47", 118 + (yes ? count : 0), "Confirmed"], ["#F2EAE0", "#7A6A52", 41 - (done ? 1 : 0), "Pending"], ["#F3E2DC", "#8C4A36", 9 + (no ? 1 : 0), "Declined"]] as const).map(([bg, fg, n, label]) => (
                <div key={label} style={{ background: bg, borderRadius: 8, padding: 14, display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontFamily: SERIF, fontSize: 36, lineHeight: 1 }}>{n}</span>
                  <span style={{ color: fg }}>{tr(label)}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {rows.map(([name, n, status, when, fresh]) => (
                <div key={name} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto auto", gap: 14, alignItems: "center", padding: "12px 10px", margin: "0 -10px", borderRadius: 6, background: fresh ? "rgba(201,165,110,.16)" : "transparent", transition: "background 1s" }}>
                  <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                    <span style={{ fontSize: 14 }}>{name}</span>
                    <span style={{ fontSize: 11, color: "#7A625A" }}>{tr(when)}</span>
                  </span>
                  <span style={{ color: "#7A625A" }}>{n === "0" ? "—" : `${n} guest${n === "1" ? "" : "s"}`}</span>
                  <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 999, background: STATUS[status][0], color: STATUS[status][1] }}>{tr(status)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
