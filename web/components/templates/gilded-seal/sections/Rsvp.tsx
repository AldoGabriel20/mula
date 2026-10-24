"use client";

import { useEffect, useRef } from "react";
import { useRsvp } from "@/lib/kit/behaviors/useRsvp";
import { DEFAULT_COPY } from "../config";
import { useGs } from "../context";
import { SANS, SERIF } from "../type";
import s from "../gilded-seal.module.css";
import { WaxSeal } from "../parts/WaxSeal";
import { Eyebrow, FRAME_INNER, Heading } from "../parts/ui";

const LABEL = { font: `600 10.5px/1 ${SANS}`, letterSpacing: ".3em", textTransform: "uppercase", color: "#3E332B" } as const;
const ERR = { fontSize: 13, lineHeight: 1.4, color: "var(--k-danger)" } as const;
const MINUS = "rgba(48,39,32,.3)";

/**
 * RSVP (docs/15 §8.12): a reply card that turns over when the guest answers. A personal link sends
 * the reply to the API (the name is the guest's and read-only); a generic link only gets a polite
 * pointer to the personal one; preview and demo run the whole flow without sending anything.
 */
export function Rsvp() {
  const { refs: r, config, d, mode, token } = useGs();
  const rv = config.rsvp;
  const prefill = rv.nameLocked || config.guestName !== DEFAULT_COPY.guestName ? config.guestName : "";
  const f = useRsvp({ mode, token, status: rv.status, partySize: rv.partySize, maxParty: rv.maxParty, prefillName: prefill });
  const { name, attend, guests, message, errors, status, failure, done, sending, yes, maxGuests: maxG, firstName: first } = f;

  // move focus to the thank-you heading once the card has turned (not when it loaded already turned)
  const wasDone = useRef(done);
  useEffect(() => {
    if (done && !wasDone.current) {
      const id = setTimeout(() => r.rsvpThanks.current?.focus({ preventScroll: true }), 750);
      wasDone.current = true;
      return () => clearTimeout(id);
    }
    wasDone.current = done;
  }, [done, r]);
  const submit = f.submit;

  const radio = (value: "yes" | "no", title: string, sub: string) => {
    const on = attend === value;
    return (
      <label style={{ position: "relative", display: "flex", alignItems: "flex-start", gap: 14, padding: 18, border: `1px solid ${on ? "var(--k-ink)" : "rgba(48,39,32,.22)"}`, background: on ? "#FFFDF8" : "rgba(255,253,248,0)", boxShadow: on ? "0 18px 34px -22px rgba(60,40,25,.5)" : "none", cursor: "pointer", transition: "border-color .35s ease,background .35s ease,box-shadow .35s ease" }}>
        <input type="radio" name="gs-attend" value={value} checked={on} onChange={() => f.chooseAttend(value)} style={{ appearance: "none", WebkitAppearance: "none", flex: "none", width: 20, height: 20, margin: "3px 0 0", borderRadius: "50%", border: "1px solid var(--k-x-eyebrow)", background: on ? "var(--k-ink)" : "transparent", boxShadow: "inset 0 0 0 4px var(--k-surface)", cursor: "pointer" }} />
        <span style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 23, lineHeight: 1.1, color: "var(--k-x-ink-strong)" }}>{title}</span>
          <span style={{ fontSize: 13, lineHeight: 1.4, color: "var(--k-x-muted-strong)" }}>{sub}</span>
        </span>
      </label>
    );
  };
  const round = (label: string, text: string, disabled: boolean, onClick: () => void) => (
    <button type="button" onClick={onClick} aria-label={label} disabled={disabled} style={{ width: 44, height: 44, borderRadius: "50%", border: `1px solid ${MINUS}`, background: "transparent", fontSize: 20, lineHeight: 1, cursor: "pointer", color: "var(--k-ink)", opacity: disabled ? 0.35 : 1 }}>
      {text}
    </button>
  );

  return (
    <section id="rsvp" aria-label="RSVP" style={{ position: "relative", overflow: "hidden", padding: "clamp(100px,15vh,170px) clamp(16px,5vw,80px)", background: "radial-gradient(70% 60% at 62% 55%,#F8F2E8 0%,#ECE2D4 100%)" }}>
      <div style={{ maxWidth: 1140, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))", gap: "clamp(56px,7vw,110px)", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <Eyebrow>RSVP</Eyebrow>
          <Heading k="rsvp" override={config.titles.rsvp} />
          <p data-reveal="up" data-delay="100" style={{ margin: 0, maxWidth: "36ch", fontSize: 16, lineHeight: 1.8, color: "var(--k-ink-soft)" }}>{d.rsvpByText}</p>
          <div data-reveal="up" data-delay="180" style={{ display: "flex", alignItems: "center", gap: 14, font: `500 11.5px/1 ${SANS}`, letterSpacing: ".28em", textTransform: "uppercase", color: "#3E332B" }}>
            <span aria-hidden="true" style={{ width: 7, height: 7, transform: "rotate(45deg)", border: "1px solid var(--k-line)" }} />
            {d.displayDate}
          </div>
        </div>

        <div data-reveal="map" data-delay="120" style={{ position: "relative", perspective: 1800, margin: "12px 6px 18px" }}>
          <div aria-hidden="true" style={{ position: "absolute", inset: 0, transform: "translate(-12px,16px) rotate(-3deg)", background: "linear-gradient(170deg,#D8BAB2 0%,#C99F96 100%)", boxShadow: "0 30px 60px -30px rgba(60,40,25,.5)" }} />
          <div aria-hidden="true" style={{ position: "absolute", inset: 0, transform: "translate(10px,6px) rotate(1.8deg)", background: "#F2EADD", border: "1px solid rgba(176,142,82,.3)", boxShadow: "0 20px 40px -30px rgba(60,40,25,.4)" }} />
          <div style={{ position: "relative", transformStyle: "preserve-3d", transform: done ? "rotateY(180deg)" : "rotateY(0deg)", transition: "transform 1.3s cubic-bezier(.65,0,.35,1)" }}>
            {/* front: the reply form */}
            <div aria-hidden={done} style={{ position: "relative", visibility: done ? "hidden" : "visible", transition: `visibility 0s linear ${done ? ".65s" : "0s"}`, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", background: "var(--k-surface)", padding: "clamp(30px,4.4vw,52px) clamp(22px,4vw,48px)", boxShadow: "0 40px 80px -40px rgba(60,40,25,.45)" }}>
              <div aria-hidden="true" style={FRAME_INNER(10, 0.5)} />
              <div aria-hidden="true" style={FRAME_INNER(14, 0.2)} />
              <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center", marginBottom: 30 }}>
                <span aria-hidden="true" style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 500, fontSize: 30, lineHeight: 1, color: "#9C7B45" }}>
                  {d.ini1}
                  <span style={{ fontSize: ".7em", padding: "0 .1em" }}>&amp;</span>
                  {d.ini2}
                </span>
                <span style={{ font: `600 10.5px/1 ${SANS}`, letterSpacing: ".38em", textTransform: "uppercase", color: "var(--k-x-eyebrow)" }}>Kindly Respond</span>
              </div>
              {rv.mode === "notice" ? (
                <p style={{ position: "relative", margin: 0, textAlign: "center", fontFamily: SERIF, fontStyle: "italic", fontSize: 21, lineHeight: 1.5, color: "var(--k-ink-soft)" }}>Please open the personal link your hosts sent you to reply.</p>
              ) : (
                <form onSubmit={submit} noValidate aria-busy={sending} style={{ position: "relative", display: "flex", flexDirection: "column", gap: 28 }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <span style={LABEL}>Your name</span>
                    <input type="text" value={name} readOnly={rv.nameLocked} onChange={(e) => f.editName(e.target.value)} autoComplete="name" maxLength={80} aria-invalid={!!errors.name} aria-describedby="gs-rsvp-err-name" placeholder="As written on your invitation" className={s.field} style={{ width: "100%", padding: "12px 0", border: 0, borderBottom: `1px solid ${errors.name ? "var(--k-danger)" : MINUS}`, borderRadius: 0, background: "transparent", fontFamily: SERIF, fontSize: 24, lineHeight: 1.3, color: "var(--k-x-ink-strong)", outline: "none" }} />
                    <span id="gs-rsvp-err-name" role="alert" style={ERR}>{errors.name}</span>
                  </label>
                  <fieldset aria-describedby="gs-rsvp-err-attend" style={{ margin: 0, padding: 0, border: 0, display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
                    <legend style={{ padding: 0, marginBottom: 12, ...LABEL }}>Will you attend?</legend>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,190px),1fr))", gap: 10 }}>
                      {radio("yes", "Joyfully accepts", "I will be there to celebrate")}
                      {radio("no", "Regretfully declines", "I will be with you in spirit")}
                    </div>
                    <span id="gs-rsvp-err-attend" role="alert" style={ERR}>{errors.attend}</span>
                  </fieldset>
                  {yes && maxG > 1 && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", padding: "16px 0", borderTop: "1px solid rgba(176,142,82,.3)", borderBottom: "1px solid rgba(176,142,82,.3)" }}>
                      <span style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <span id="gs-rsvp-guests" style={LABEL}>Attending</span>
                        <span style={{ fontSize: 13, color: "var(--k-x-muted-strong)" }}>{`Including yourself, up to ${maxG}`}</span>
                      </span>
                      <div role="group" aria-labelledby="gs-rsvp-guests" style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        {round("Fewer guests", "−", guests <= 1, () => f.stepGuests(-1))}
                        <span aria-live="polite" style={{ minWidth: 56, textAlign: "center", fontFamily: SERIF, fontSize: 34, lineHeight: 1, fontVariantNumeric: "lining-nums", color: "var(--k-x-ink-strong)" }}>{guests}</span>
                        {round("More guests", "+", guests >= maxG, () => f.stepGuests(1))}
                      </div>
                    </div>
                  )}
                  <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <span style={LABEL}>
                      A note for the couple <span style={{ fontWeight: 500, letterSpacing: ".06em", textTransform: "none", color: "var(--k-x-muted-strong)" }}>(optional)</span>
                    </span>
                    <textarea value={message} onChange={(e) => f.editMessage(e.target.value)} rows={2} maxLength={300} placeholder="Dietary needs, a song request, or kind words" className={s.field} style={{ width: "100%", padding: "12px 0", border: 0, borderBottom: `1px solid ${MINUS}`, borderRadius: 0, background: "transparent", font: `400 16px/1.6 ${SANS}`, color: "var(--k-ink)", outline: "none", resize: "vertical" }} />
                    <span role="alert" style={ERR}>{errors.message}</span>
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch", gap: 12 }}>
                    <button type="submit" disabled={sending} className={s.pill} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 14, minHeight: 54, padding: "0 34px", border: 0, borderRadius: 999, background: "var(--k-ink)", color: "var(--k-bg)", font: `600 11px/1 ${SANS}`, letterSpacing: ".3em", textTransform: "uppercase", cursor: "pointer", opacity: sending ? 0.6 : 1, transition: "background .4s ease,opacity .3s ease" }}>
                      {sending ? "Sending your reply…" : "Send my reply"}
                      <span aria-hidden="true" style={{ width: 18, height: 1, background: "currentColor" }} />
                    </button>
                    {status === "error" && <span role="alert" style={{ ...ERR, lineHeight: 1.5, textAlign: "center" }}>{failure}</span>}
                  </div>
                </form>
              )}
            </div>

            {/* back: the thank-you card */}
            <div aria-hidden={!done} style={{ position: "absolute", inset: 0, visibility: done ? "visible" : "hidden", transition: `visibility 0s linear ${done ? "0s" : ".65s"}`, transform: "rotateY(180deg)", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", background: "radial-gradient(80% 70% at 50% 40%,#FFFDF8 0%,#F8F2E8 100%)", boxShadow: "0 40px 80px -40px rgba(60,40,25,.45)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, textAlign: "center", padding: "40px 28px" }}>
              <div aria-hidden="true" style={FRAME_INNER(10, 0.5)} />
              <WaxSeal ini1={d.ini1} ini2={d.ini2} size={84} font={24} />
              <h3 ref={r.rsvpThanks} tabIndex={-1} style={{ margin: 0, fontFamily: SERIF, fontWeight: 300, fontSize: "clamp(38px,4vw,52px)", lineHeight: 1.05, color: "var(--k-x-ink-strong)", outline: "none" }}>
                Thank you{first ? ", " : ""}
                <em style={{ fontStyle: "italic" }}>{first}</em>
              </h3>
              <p style={{ margin: 0, maxWidth: "32ch", fontFamily: SERIF, fontStyle: "italic", fontSize: 21, lineHeight: 1.5, color: "var(--k-ink-soft)" }}>
                {yes ? `We cannot wait to celebrate with you${guests > 1 ? `, all ${guests} of you` : ""}.` : "We will miss you on the day, and we are grateful for your kind reply."}
              </p>
              {status === "demo" && <p style={{ margin: 0, maxWidth: "36ch", fontSize: 12.5, lineHeight: 1.6, color: "var(--k-x-muted-strong)" }}>This invitation is a preview, so your reply has not been sent yet.</p>}
              <button type="button" onClick={f.edit} tabIndex={done ? 0 : -1} style={{ minHeight: 44, padding: "0 6px", border: 0, borderBottom: "1px solid rgba(48,39,32,.35)", background: "transparent", font: `600 10.5px/1 ${SANS}`, letterSpacing: ".3em", textTransform: "uppercase", color: "var(--k-ink)", cursor: "pointer" }}>
                Change my reply
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
