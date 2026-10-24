"use client";

import { useEffect, useRef, useState } from "react";
import { copyText } from "@/lib/kit/behaviors/copyText";
import { useGs } from "../context";
import { SANS, SERIF } from "../type";
import s from "../gilded-seal.module.css";
import { Eyebrow, FRAME_INNER, Heading } from "../parts/ui";

/** Wedding gift (docs/15 §8.12): the host's bank / e-wallet details with a one-tap copy. Hidden when there are none. */
export function Gift() {
  const { config } = useGs();
  const [done, setDone] = useState<{ i: number; ok: boolean } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  if (!config.show.gift) return null;

  const copy = async (i: number) => {
    const ok = await copyText(config.gift.methods[i].number.replace(/\s+/g, ""));
    setDone({ i, ok });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDone(null), 2600);
  };

  return (
    <section id="gift" aria-label="Wedding gift" style={{ position: "relative", padding: "clamp(100px,15vh,170px) clamp(20px,6vw,96px)", background: "linear-gradient(180deg,#EFE6D9 0%,var(--k-bg) 100%)" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
        <Eyebrow reveal={null}>Wedding Gift</Eyebrow>
        <Heading k="gift" override={config.titles.gift} reveal={null} />
        <p style={{ margin: 0, maxWidth: "44ch", fontSize: 16, lineHeight: 1.8, color: "var(--k-ink-soft)", textWrap: "pretty" }}>{config.gift.note}</p>
        {config.gift.methods.map((m, i) => (
          <div key={i} style={{ position: "relative", width: "100%", marginTop: i ? 0 : 12, padding: "clamp(32px,5vw,48px) clamp(22px,4vw,44px)", background: "var(--k-surface)", border: "1px solid rgba(176,142,82,.5)", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, boxShadow: "0 30px 60px -44px rgba(60,40,25,.45)" }}>
            <div aria-hidden="true" style={FRAME_INNER(8)} />
            <span style={{ font: `600 10.5px/1 ${SANS}`, letterSpacing: ".34em", textTransform: "uppercase", color: "var(--k-x-eyebrow)" }}>{m.bank}</span>
            <span style={{ fontFamily: SERIF, fontSize: "clamp(30px,4vw,42px)", letterSpacing: ".08em", fontVariantNumeric: "lining-nums", color: "var(--k-x-ink-strong)", userSelect: "all" }}>{m.number}</span>
            {m.holder && <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 21, color: "var(--k-ink-soft)" }}>{m.holder}</span>}
            <button type="button" onClick={() => copy(i)} className={s.ink} style={{ position: "relative", marginTop: 10, display: "inline-flex", alignItems: "center", gap: 12, minHeight: 48, padding: "0 28px", border: "1px solid rgba(48,39,32,.3)", borderRadius: 999, background: "transparent", font: `600 10.5px/1 ${SANS}`, letterSpacing: ".3em", textTransform: "uppercase", color: "var(--k-ink)", cursor: "pointer", transition: "background .4s ease,color .4s ease" }}>
              {done?.i === i && done.ok ? "Copied" : m.kind === "wallet" ? "Copy number" : "Copy account number"}
            </button>
          </div>
        ))}
        <span role="status" aria-live="polite" style={{ fontSize: 13, color: "var(--k-x-muted-strong)", minHeight: 18 }}>
          {done ? (done.ok ? "Account number copied to your clipboard." : "Copy is not available here. Please copy the number manually.") : ""}
        </span>
      </div>
    </section>
  );
}
