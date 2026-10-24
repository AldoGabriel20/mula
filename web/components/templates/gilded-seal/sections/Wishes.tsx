"use client";

import { useWishes } from "@/lib/kit/behaviors/useWishes";
import { useGs } from "../context";
import { SANS, SERIF } from "../type";
import s from "../gilded-seal.module.css";
import { wishLayout, wishSlots } from "../layout";
import { Chevron, Eyebrow, FRAME_INNER, Heading, ROUND_BTN } from "../parts/ui";
import { arrowKeys, useSwipe } from "../parts/useSwipe";

const LABEL = { font: `600 10.5px/1 ${SANS}`, letterSpacing: ".3em", textTransform: "uppercase", color: "#3E332B" } as const;
const ERR = { fontSize: 13, lineHeight: 1.4, color: "var(--k-danger)" } as const;
/**
 * Kind words (docs/15 §8.12): at most five cards are ever in the DOM, however many wishes there are.
 * Live mode reads the guestbook page by page (more are fetched as the guest nears the end) and posts
 * new wishes to the API; preview and demo keep new wishes on this device only.
 */
export function Wishes() {
  const { refs: r, config, mode, token, vw, reduced } = useGs();
  const pulse = () => {
    const el = r.wishDeck.current;
    if (el && !reduced) el.animate([{ opacity: 0.3, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], { duration: 800, easing: "cubic-bezier(.22,1,.36,1)" });
  };
  const w = useWishes({ mode, token, nameLocked: config.rsvp.nameLocked, guestName: config.guestName, samples: config.sampleWishes, onAdded: pulse });
  const { all, count: nw, pos, total, loading, failed, empty, name, text, errors, status, thanks, sending, step } = w;
  const locked = config.rsvp.nameLocked;
  const swipe = useSwipe(step, r.wishDeck, reduced);
  const submit = w.submit;

  const wl = wishLayout(vw);
  const slots = wishSlots(all, w.idx, vw);
  const msg = status === "local" ? `Thank you, ${thanks}. Your wish is now among the kind words, shown on this device only.` : status === "sent" ? `Thank you, ${thanks}. Your wish has been shared with the couple.` : status === "error" ? "We could not send your wish. Please try again." : "";
  const field = (bad: boolean) => ({ width: "100%", padding: "10px 0", border: 0, borderBottom: `1px solid ${bad ? "var(--k-danger)" : "rgba(48,39,32,.3)"}`, borderRadius: 0, background: "transparent", color: "var(--k-ink)", outline: "none" }) as const;
  const stateBox = { position: "absolute", left: 0, right: 0, top: 0, height: wl.cardH } as const;

  if (!config.show.wishes) return null;
  return (
    <section id="wishes" aria-label="Kind words" style={{ position: "relative", overflow: "hidden", padding: "clamp(100px,15vh,170px) clamp(16px,5vw,80px)", background: "var(--k-bg)" }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", display: "flex", flexDirection: "column", gap: "clamp(44px,5vw,64px)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22, textAlign: "center" }}>
          <Eyebrow>Kind Words</Eyebrow>
          <Heading k="wishes" override={config.titles.wishes} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,400px),1fr))", gap: "clamp(40px,5vw,72px)", alignItems: "start" }}>
          <div data-reveal="up" role="region" aria-roledescription="carousel" aria-label="Wishes from guests" tabIndex={0} onKeyDown={arrowKeys(step)} style={{ position: "relative", minWidth: 0, display: "flex", flexDirection: "column", gap: 22 }}>
            <div {...swipe} onPointerCancel={swipe.onPointerUp} onPointerLeave={swipe.onPointerUp} style={{ position: "relative", height: wl.h, perspective: 1400, touchAction: "pan-y", userSelect: "none" }}>
              {nw > 0 && (
                <div ref={r.wishDeck} style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d" }}>
                  {slots.map((w, j) => (
                    <figure key={j} aria-hidden={w.hidden} style={{ position: "absolute", left: 0, right: 0, top: 0, height: wl.cardH, margin: 0, transform: w.tf, opacity: w.op, zIndex: w.z, transition: "transform .9s cubic-bezier(.22,1,.36,1),opacity .7s ease", background: "var(--k-surface)", border: "1px solid rgba(176,142,82,.4)", boxShadow: "0 30px 60px -36px rgba(60,40,25,.5)", padding: wl.pad, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 18, overflow: "hidden" }}>
                      <span aria-hidden="true" style={{ position: "absolute", top: 2, left: 18, fontFamily: SERIF, fontSize: 92, lineHeight: 1, color: "rgba(176,142,82,.3)", pointerEvents: "none" }}>“</span>
                      <blockquote style={{ position: "relative", margin: 0, paddingTop: 18, fontFamily: SERIF, fontStyle: "italic", fontSize: w.fs, lineHeight: 1.45, color: "var(--k-x-ink-strong)", overflowWrap: "anywhere", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: w.lines, overflow: "hidden" }}>{w.message}</blockquote>
                      <figcaption style={{ position: "relative", display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
                        <span aria-hidden="true" style={{ flex: "none", width: 28, height: 1, background: "var(--k-line)" }} />
                        <span style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
                          <span style={{ font: `600 10.5px/1.3 ${SANS}`, letterSpacing: ".26em", textTransform: "uppercase", color: "#3E332B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.name}</span>
                          {w.relation && <span style={{ fontSize: 13, color: "var(--k-x-muted-strong)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.relation}</span>}
                        </span>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              )}
              {empty && (
                <div style={{ ...stateBox, border: "1px dashed rgba(176,142,82,.55)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 32, textAlign: "center" }}>
                  <span aria-hidden="true" style={{ fontFamily: SERIF, fontSize: 72, lineHeight: 0.6, color: "rgba(176,142,82,.5)" }}>“</span>
                  <span style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 32, lineHeight: 1.15, color: "var(--k-x-ink-strong)" }}>No wishes yet</span>
                  <span style={{ maxWidth: "30ch", fontFamily: SERIF, fontStyle: "italic", fontSize: 20, lineHeight: 1.5, color: "var(--k-ink-soft)" }}>Be the first to leave a few kind words for {config.partnerOne} and {config.partnerTwo}.</span>
                </div>
              )}
              {nw === 0 && loading && (
                <div role="status" style={{ ...stateBox, border: "1px solid rgba(176,142,82,.3)", background: "var(--k-surface)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontStyle: "italic", fontSize: 21, color: "var(--k-ink-soft)" }}>Gathering kind words…</div>
              )}
              {nw === 0 && failed && (
                <div role="alert" style={{ ...stateBox, border: "1px solid rgba(176,142,82,.3)", background: "var(--k-surface)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 28, textAlign: "center" }}>
                  <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 21, lineHeight: 1.5, color: "var(--k-ink-soft)" }}>We could not load the wishes just now.</span>
                  <button type="button" onClick={w.reload} style={{ minHeight: 44, padding: "0 22px", border: "1px solid rgba(48,39,32,.3)", borderRadius: 999, background: "transparent", font: `600 10.5px/1 ${SANS}`, letterSpacing: ".28em", textTransform: "uppercase", color: "var(--k-ink)", cursor: "pointer" }}>
                    Try again
                  </button>
                </div>
              )}
            </div>
            {nw > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <button type="button" onClick={() => step(-1)} aria-label="Previous wish" className={s.ink} style={{ ...ROUND_BTN, width: 46, height: 46 }}>
                  <Chevron dir="l" size={15} />
                </button>
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  <span style={{ font: `600 10px/1 ${SANS}`, letterSpacing: ".28em", textTransform: "uppercase", color: "var(--k-ink-soft)" }}>{`${pos + 1} of ${Math.max(nw, total)}`}</span>
                  <span aria-hidden="true" style={{ position: "relative", height: 1, background: "rgba(176,142,82,.25)" }}>
                    <span style={{ position: "absolute", inset: 0, background: "var(--k-accent)", transformOrigin: "0 50%", transform: `scaleX(${(pos + 1) / nw})`, transition: "transform .8s cubic-bezier(.22,1,.36,1)" }} />
                  </span>
                </div>
                <button type="button" onClick={() => step(1)} aria-label="Next wish" className={s.ink} style={{ ...ROUND_BTN, width: 46, height: 46 }}>
                  <Chevron dir="r" size={15} />
                </button>
              </div>
            )}
            <span aria-live="polite" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)", whiteSpace: "nowrap" }}>{nw ? `Wish ${pos + 1} of ${nw}, from ${all[pos].name}` : ""}</span>
          </div>

          <form data-reveal="up" data-delay="150" onSubmit={submit} noValidate aria-busy={sending} style={{ position: "relative", minWidth: 0, background: "var(--k-surface)", border: "1px solid rgba(176,142,82,.38)", padding: "clamp(28px,4vw,44px)", display: "flex", flexDirection: "column", gap: 22, boxShadow: "0 30px 60px -44px rgba(60,40,25,.4)" }}>
            <div aria-hidden="true" style={FRAME_INNER(8, 0.18)} />
            <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={{ font: `600 10.5px/1 ${SANS}`, letterSpacing: ".34em", textTransform: "uppercase", color: "var(--k-x-eyebrow)" }}>Send Your Wishes</span>
              <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 21, lineHeight: 1.4, color: "var(--k-ink-soft)" }}>A few words for {config.partnerOne} and {config.partnerTwo}.</span>
            </div>
            <label style={{ position: "relative", display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={LABEL}>Your name</span>
              <input type="text" value={locked ? config.guestName : name} readOnly={locked} onChange={(e) => w.editName(e.target.value)} maxLength={60} autoComplete="name" aria-invalid={!!errors.name} aria-describedby="gs-wish-err-name" className={s.field} style={{ ...field(!!errors.name), font: `400 17px/1.4 ${SANS}` }} />
              <span id="gs-wish-err-name" role="alert" style={ERR}>{errors.name}</span>
            </label>
            <label style={{ position: "relative", display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span style={LABEL}>Your wish</span>
                <span aria-hidden="true" style={{ font: `500 11px/1 ${SANS}`, color: "var(--k-x-muted-strong)", fontVariantNumeric: "tabular-nums" }}>{`${text.length} / 300`}</span>
              </span>
              <textarea value={text} onChange={(e) => w.editText(e.target.value)} rows={4} maxLength={300} aria-invalid={!!errors.text} aria-describedby="gs-wish-err-text" className={s.field} style={{ ...field(!!errors.text), fontFamily: SERIF, fontStyle: "italic", fontSize: 22, lineHeight: 1.5, resize: "none" }} />
              <span id="gs-wish-err-text" role="alert" style={ERR}>{errors.text}</span>
            </label>
            <div style={{ position: "relative", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "14px 20px" }}>
              <span role="status" aria-live="polite" style={{ flex: "1 1 200px", fontFamily: SERIF, fontStyle: "italic", fontSize: 18, lineHeight: 1.4, color: status === "error" ? "var(--k-danger)" : "var(--k-ink-soft)" }}>{msg}</span>
              <button type="submit" disabled={sending} className={s.ink} style={{ display: "inline-flex", alignItems: "center", gap: 14, minHeight: 50, padding: "0 28px", border: "1px solid var(--k-ink)", borderRadius: 999, background: "transparent", font: `600 11px/1 ${SANS}`, letterSpacing: ".3em", textTransform: "uppercase", color: "var(--k-ink)", cursor: "pointer", opacity: sending ? 0.55 : 1, transition: "background .4s ease,color .4s ease" }}>
                {sending ? "Sending…" : "Send wish"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

