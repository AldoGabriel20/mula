"use client";

import { useRef, useState } from "react";
import { Reveal } from "@/lib/motion";
import { InviteScreen } from "../InviteScreen";
import { BY_SLUG } from "../data";
import { PINYON, SERIF } from "../fonts";
import { TH, useLang } from "../i18n";
import { useInView, useInterval } from "../hooks";

const NAMES = ["Sarah", "Michael", "Amanda"];

export function Personalization() {
  const { t, tr } = useLang();
  const [ref, inView] = useInView<HTMLElement>();
  const [idx, setIdx] = useState(0);
  const url = useRef<HTMLSpanElement>(null);
  const big = useRef<HTMLDivElement>(null);
  // Typewriter state lives in a ref: it ticks every 100ms but only `idx` needs a re-render.
  const ty = useRef({ i: 0, n: 5, mode: "hold" as "type" | "hold" | "del", hold: 0 });

  useInterval(() => {
    const T = ty.current;
    const name = NAMES[T.i];
    if (T.mode === "type") {
      T.n++;
      if (T.n >= name.length) { T.n = name.length; T.mode = "hold"; T.hold = 0; setIdx(T.i); }
    } else if (T.mode === "hold") {
      T.hold += 100;
      if (T.hold >= 1900) T.mode = "del";
    } else {
      T.n -= 2;
      if (T.n <= 0) { T.n = 0; T.i = (T.i + 1) % NAMES.length; T.mode = "type"; }
    }
    const txt = NAMES[T.i].slice(0, Math.max(0, T.n));
    if (url.current) url.current.textContent = txt.toLowerCase();
    if (big.current) big.current.textContent = txt || " ";
  }, 100, inView);

  return (
    <section ref={ref} data-bg="#3E1A20" data-screen-label="06 Personalization" style={{ position: "relative", background: "#3E1A20", color: "#F1E3D3", overflow: "hidden" }}>
      <div ref={big} aria-hidden="true" style={{ position: "absolute", left: "-2vw", bottom: "-4vw", fontFamily: PINYON, fontSize: "clamp(160px,30vw,520px)", lineHeight: 1, color: "rgba(241,227,211,.06)", whiteSpace: "nowrap", pointerEvents: "none" }}>Sarah</div>
      <div style={{ position: "relative", maxWidth: 1440, margin: "0 auto", padding: "clamp(110px,13vw,190px) clamp(20px,3.6vw,52px)", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,420px),1fr))", gap: 64, alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".28em", textTransform: "uppercase", color: "#D9B98A" }}>{t("home.person.label", "Personalized invitations")}</div>
          <Reveal kind="blur" as="h2" style={{ fontFamily: SERIF, fontWeight: 300, fontSize: "clamp(46px,5.6vw,92px)", lineHeight: 0.95, letterSpacing: "-.025em", margin: 0, textWrap: "balance" }}>
            <TH k="home.person.title">{"Every guest can receive a <em>personal invitation.</em>"}</TH>
          </Reveal>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6, color: "#D6BFAE", maxWidth: 460 }}>{tr("Each guest gets their own link. When they open it, the invitation greets them by name, and you can see who has opened it.")}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, height: 56, padding: "0 20px", borderRadius: 999, background: "rgba(241,227,211,.07)", border: "1px solid rgba(241,227,211,.14)", fontSize: "clamp(14px,1.3vw,17px)", maxWidth: 460 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#7FB08A", flex: "none" }} />
              <span style={{ color: "#BFA796" }}>mula.co/radandcil/</span>
              <span ref={url} style={{ color: "#F1E3D3", fontWeight: 600 }}>sarah</span>
              <span style={{ width: 1, height: 20, background: "#D9B98A", marginLeft: -8 }} />
            </div>
            <span style={{ fontSize: 12, color: "#BFA796", paddingLeft: 20 }}>{tr("Personal link · visual concept")}</span>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ position: "relative", width: "min(300px,70vw)", aspectRatio: "9/19.5" }}>
            <InviteScreen d={{ ...BY_SLUG.linen.d, guest: NAMES[idx] }} />
            <div style={{ position: "absolute", right: "-22%", top: "20%", display: "flex", flexDirection: "column", gap: 8 }}>
              {NAMES.map((n, i) => (
                <div key={n} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 999, background: i === idx ? "#F1E3D3" : "rgba(241,227,211,.08)", color: i === idx ? "#3E1A20" : "#D6BFAE", fontSize: 12, boxShadow: "0 14px 30px -14px rgba(0,0,0,.5)", transform: `translateX(${i === idx ? -12 : 0}px)`, transition: "all .5s cubic-bezier(.2,.75,.15,1)" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: i === idx ? "#5C8A63" : "rgba(241,227,211,.3)" }} />
                  {n}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
