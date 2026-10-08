"use client";

import { useRef, useState } from "react";
import { InviteScreen, type InviteData } from "../InviteScreen";
import { BY_SLUG, PHOTOS } from "../data";
import { SERIF } from "../fonts";
import { useLang } from "../i18n";
import { clamp, useIsMobile, useScrollTick } from "../hooks";

const STEPS = [
  { name: "Template", title: "Start from a design made by our studio.", copy: "Every template is composed by hand for a particular kind of celebration." },
  { name: "Typography", title: "Change the type, and the mood follows.", copy: "Swap between classic serifs, modern sans and flowing scripts in one tap." },
  { name: "Colour", title: "Pick a palette, or bring your own.", copy: "Curated palettes keep every combination balanced and legible." },
  { name: "Photo", title: "Add your portrait. Every layout makes room.", copy: "Photos are framed by the design, so it always looks intentional." },
  { name: "RSVP", title: "Guests reply from the invitation itself.", copy: "Attendance and number of guests go straight to your guest list." },
];

// 500vh runway with a sticky stage: scroll progress picks the step and tilts the phone in 3D.
export function Showcase() {
  const { t, tr } = useLang();
  const mobile = useIsMobile();
  const sec = useRef<HTMLElement>(null);
  const phone = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [prog, setProg] = useState(0);

  useScrollTick(() => {
    const el = sec.current;
    if (!el) return;
    const r = el.getBoundingClientRect(), vh = innerHeight;
    const p = clamp(-r.top / Math.max(1, r.height - vh));
    const st = Math.min(4, Math.floor(p * 5));
    setStep((v) => (v === st ? v : st));
    setProg((v) => (Math.abs(p - v) > 0.04 ? p : v));
    if (phone.current) phone.current.style.transform = `perspective(1400px) rotateY(${((p - 0.5) * -26).toFixed(2)}deg) rotateX(${(5 - p * 8).toFixed(2)}deg)`;
  });

  const base = BY_SLUG.serenity.d;
  const d1: InviteData = { ...base, font: "'Pinyon Script', cursive", italic: "normal", size: 16 };
  const d2: InviteData = { ...d1, bg: "#3E1A20", fg: "#EBD9C0", accent: "#C9A56E" };
  const d3: InviteData = { ...d2, variant: "photo", photo: PHOTOS.dusk };
  const d4: InviteData = { ...d3, guest: "Sarah" };
  const showD = [base, d1, d2, d3, d4][step];

  return (
    <section ref={sec} data-bg="#171412" data-screen-label="03 Showcase" style={{ position: "relative", height: "500vh", background: "#171412", color: "#F4EEE4" }}>
      <div style={{ position: "sticky", top: 0, height: "100svh", overflow: "hidden" }}>
        <div aria-hidden="true" style={{ position: "absolute", left: "50%", top: "50%", width: "min(80vh,900px)", aspectRatio: "1", transform: "translate(-50%,-50%)", borderRadius: "50%", background: "radial-gradient(closest-side, rgba(201,165,110,.14), rgba(23,20,18,0))" }} />
        <div style={{ position: "relative", maxWidth: 1440, height: "100%", margin: "0 auto", padding: "110px clamp(20px,3.6vw,52px) 48px", display: "grid", gridTemplateColumns: mobile ? "minmax(0,1fr)" : "minmax(0,1fr) auto minmax(0,1fr)", gap: "clamp(24px,4vw,64px)", alignItems: "center" }}>
          {!mobile && (
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".28em", textTransform: "uppercase", color: "#C9A56E" }}>{t("home.show.label", "One invitation")}</div>
              <h2 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: "clamp(44px,4.4vw,74px)", lineHeight: 0.96, letterSpacing: "-.025em", margin: 0 }} dangerouslySetInnerHTML={{ __html: t("home.show.title", "Watch an invitation <em>take shape.</em>") }} />
              <div style={{ display: "flex", gap: 18, marginTop: 12 }}>
                <div style={{ width: 1, background: "rgba(244,238,228,.12)", position: "relative" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, width: 1, height: `${Math.round(prog * 100)}%`, background: "#C9A56E", transition: "height .5s ease" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {STEPS.map((st, i) => (
                    <div key={st.name} style={{ display: "flex", gap: 16, alignItems: "baseline", opacity: i === step ? 1 : 0.32, transition: "opacity .5s" }}>
                      <span style={{ fontSize: 11, color: "#C9A56E", letterSpacing: ".1em" }}>{`0${i + 1}`}</span>
                      <span style={{ fontFamily: SERIF, fontSize: 26 }}>{tr(st.name)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
            <div ref={phone} style={{ position: "relative", width: mobile ? "min(230px,58vw)" : "min(300px,24vw)", aspectRatio: "9/19.5", willChange: "transform" }}>
              <InviteScreen d={showD} />
              <div style={{ position: "absolute", left: "5%", right: "5%", bottom: "3%", borderRadius: 22, background: "rgba(251,247,241,.97)", color: "#2B2420", padding: "18px 16px", boxShadow: "0 30px 60px -20px rgba(0,0,0,.6)", display: "flex", flexDirection: "column", gap: 12, fontSize: 12, opacity: step === 4 ? 1 : 0, transform: `translateY(${step === 4 ? 0 : 30}px)`, transition: "opacity .6s ease, transform .8s cubic-bezier(.2,.75,.15,1)" }}>
                <div style={{ fontFamily: SERIF, fontSize: 22, textAlign: "center" }}>{tr("Will you attend?")}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <span style={{ height: 38, borderRadius: 999, background: "#2B2420", color: "#F4EEE4", display: "flex", alignItems: "center", justifyContent: "center" }}>{tr("Attending")}</span>
                  <span style={{ height: 38, borderRadius: 999, border: "1px solid rgba(43,36,32,.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>{tr("Not attending")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#6B5A48" }}>
                  <span>{tr("Guests")}</span>
                  <span>− 2 +</span>
                </div>
              </div>
            </div>
            {mobile && (
              <div style={{ display: "flex", gap: 6 }}>
                {STEPS.map((st, i) => <span key={st.name} style={{ width: 22, height: 2, background: "#C9A56E", opacity: i === step ? 1 : 0.32 }} />)}
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 340, justifySelf: "end" }}>
            <div style={{ fontFamily: SERIF, fontWeight: 300, fontSize: "clamp(70px,8vw,140px)", lineHeight: 0.8, color: "transparent", WebkitTextStroke: "1px rgba(201,165,110,.7)" }}>{`0${step + 1}`}</div>
            <div style={{ fontFamily: SERIF, fontSize: "clamp(26px,2.2vw,34px)", lineHeight: 1.1 }}>{tr(STEPS[step].title)}</div>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "#B5AA9E" }}>{tr(STEPS[step].copy)}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
