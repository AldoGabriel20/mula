"use client";

import { useEffect, useId, useRef, useState } from "react";
import { copyText } from "@/lib/kit/behaviors/copyText";
import { useRsvp } from "@/lib/kit/behaviors/useRsvp";
import { useWishes } from "@/lib/kit/behaviors/useWishes";
import type { ModelGiftMethod } from "@/lib/kit/model";
import { DEFAULT_COPY } from "./config";
import { useWd } from "./context";
import { Dust, useTilt } from "./fx";
import { bgOf, DARK_ROOM, Head, rv, Sec } from "./sections";
import s from "./we-do.module.css";

// ---- gift ----------------------------------------------------------------------------------------
/** A bank card in 3D: it follows the pointer on a desktop, floats gently on a phone; a glare slides across it. */
function GiftCard({ m }: { m: ModelGiftMethod }) {
  const { d } = useWd();
  const tilt = useTilt<HTMLDivElement>(16);
  return (
    <div ref={tilt} className={s.ccWrap}>
      <div className={`${s.cc} ${s.loop}`}>
        <div className={s.ccTop}>
          <b className={s.gold}>{m.bank}</b>
          <span>{m.kind === "wallet" ? "E-wallet" : "Bank transfer"}</span>
        </div>
        <div className={s.ccMid} aria-hidden="true">
          <span className={s.chip} />
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M8 8.5a5 5 0 0 1 0 7M11.5 6a8.5 8.5 0 0 1 0 12M15 3.5a12 12 0 0 1 0 17" /></svg>
        </div>
        <code>{m.number}</code>
        <div className={s.ccBot}>
          <span>{m.holder}</span>
          <i className={s.gold} aria-hidden="true">{d.ini1}&amp;{d.ini2}</i>
        </div>
        <span className={s.glare} aria-hidden="true" />
      </div>
    </div>
  );
}

export function Gift({ side }: { side: string | null }) {
  const { config: c } = useWd();
  const [done, setDone] = useState<{ i: number; ok: boolean } | null>(null);
  if (!c.show.gift) return null;
  const copy = async (i: number) => setDone({ i, ok: await copyText(c.gift.methods[i].number.replace(/\s+/g, "")) });
  return (
    <Sec id="gift" label="Gift" side={side}>
      <div className={s.gift}>
        <Head title={c.gift.title || "Gift"} sub="with love & gratitude" />
        <p className={`${s.note} ${rv(2)}`}>{c.gift.note}</p>
        <div className={s.cards}>
          {c.gift.methods.map((m, i) => (
            <div key={i} className={`${s.gcard} ${rv(2)}`}>
              <GiftCard m={m} />
              <button type="button" className={`${s.pill} ${s.copy}`} onClick={() => copy(i)}>
                {done?.i === i && done.ok ? "Copied ✓" : "Copy number"}
              </button>
            </div>
          ))}
        </div>
        <p role="status" className={s.sr}>{done ? (done.ok ? "Account number copied to your clipboard." : "Copy is not available here. Please copy the number manually.") : ""}</p>
      </div>
    </Sec>
  );
}

// ---- rsvp ----------------------------------------------------------------------------------------
export function Rsvp({ side }: { side: string | null }) {
  const { config: c, d, mode, token } = useWd();
  const rvp = c.rsvp;
  const uid = useId();
  const prefill = rvp.nameLocked || c.guestName !== DEFAULT_COPY.guestName ? c.guestName : "";
  const f = useRsvp({ mode, token, status: rvp.status, partySize: rvp.partySize, maxParty: rvp.maxParty, prefillName: prefill });
  const card = useRef<HTMLDivElement | null>(null);
  const thanks = useRef<HTMLParagraphElement | null>(null);
  const wasDone = useRef(f.done);
  useEffect(() => {
    if (f.done && !wasDone.current) thanks.current?.focus({ preventScroll: true });
    wasDone.current = f.done;
  }, [f.done]);
  const go = () => {
    const el = card.current;
    if (!el) return;
    el.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    el.querySelector<HTMLElement>("input,textarea")?.focus({ preventScroll: true });
  };
  const arrow = <svg viewBox="0 0 24 30" aria-hidden="true" focusable="false"><path d="M8 2h8v14h6L12 28 2 16h6z" fill="url(#wd-gold)" /></svg>;
  return (
    <Sec id="rsvp" label="RSVP" side={side}>
      <div className={s.rsvp}>
        <div className={s.rsvpArt}>
          <div className={`${s.please} ${rv()}`} aria-hidden="true"><span>please</span></div>
          <h2 className={s.sr}>RSVP</h2>
          <div className={`${s.letters} ${rv(1)}`} aria-hidden="true">
            {["R", "S", "V", "P"].map((l) => <div key={l} className={s.L}><span className={s.gold}>{l}</span></div>)}
          </div>
          {d.rsvpBy && <div className={`${s.by} ${s.gold} ${rv()}`}>{d.rsvpBy}</div>}
        </div>
        <div className={s.rsvpBody}>
          <div className={`${s.ready} ${rv()}`}>{c.rsvp.title || "Ready to party?"}</div>
          <p className={`${s.readySub} ${rv(1)}`}>{rvp.body}</p>
          <button type="button" className={`${s.rsvpbtn} ${rv(2)}`} onClick={go} aria-label="RSVP: go to the reply form">
            {arrow}<span className={s.gold}>RSVP</span>{arrow}
          </button>

          <div className={`${s.rf} ${rv()}`} ref={card}>
            <h3>{c.partnerOne} &amp; {c.partnerTwo}&apos;s Wedding</h3>
            {f.done ? (
              <div className={s.sent}>
                <p ref={thanks} tabIndex={-1} style={{ outline: "none", margin: 0 }}>
                  {f.attend === "no" ? `Thank you${f.firstName ? `, ${f.firstName}` : ""}. We will miss you, and we are grateful you let us know.` : `Thank you${f.firstName ? `, ${f.firstName}` : ""}! Your confirmation is received ♡`}
                </p>
                {f.status === "demo" && <p className={s.hint}>{mode === "preview" ? "This is a preview: nothing was sent." : "This is a demo: nothing was sent."}</p>}
                {mode === "live" && token && <button type="button" onClick={f.edit}>Change my reply</button>}
              </div>
            ) : rvp.mode === "notice" ? (
              <p className={s.notice}>Please open the personal link your hosts sent you to reply.</p>
            ) : (
              <form onSubmit={f.submit} noValidate aria-busy={f.sending}>
                <div className={s.hint}>Please confirm whether you can join us.</div>
                <div className={s.q}>
                  <label className={s.t} htmlFor={`${uid}-name`}>Full name *</label>
                  <input id={`${uid}-name`} type="text" value={f.name} readOnly={rvp.nameLocked} onChange={(e) => f.editName(e.target.value)} autoComplete="name" maxLength={80} aria-invalid={!!f.errors.name} aria-describedby={`${uid}-e-name`} placeholder="As written on your invitation" />
                  <span id={`${uid}-e-name`} role="alert" className={s.err}>{f.errors.name}</span>
                </div>
                <fieldset className={s.q} aria-describedby={`${uid}-e-att`}>
                  <legend className={s.t}>Will you attend? *</legend>
                  <label className={s.opt}><input type="radio" name={`${uid}-att`} checked={f.attend === "yes"} onChange={() => f.chooseAttend("yes")} /> Joyfully accept — I&apos;ll be there!</label>
                  <label className={s.opt}><input type="radio" name={`${uid}-att`} checked={f.attend === "no"} onChange={() => f.chooseAttend("no")} /> Sadly, I won&apos;t be able to attend.</label>
                  <span id={`${uid}-e-att`} role="alert" className={s.err}>{f.errors.attend}</span>
                </fieldset>
                {f.yes && f.maxGuests > 1 && (
                  <div className={s.q}>
                    <span id={`${uid}-g`} className={s.t}>Number of guests (including you)</span>
                    <div className={s.step} role="group" aria-labelledby={`${uid}-g`}>
                      <button type="button" aria-label="Fewer guests" disabled={f.guests <= 1} onClick={() => f.stepGuests(-1)}>−</button>
                      <output aria-live="polite">{f.guests}</output>
                      <button type="button" aria-label="More guests" disabled={f.guests >= f.maxGuests} onClick={() => f.stepGuests(1)}>+</button>
                    </div>
                  </div>
                )}
                <div className={s.q}>
                  <label className={s.t} htmlFor={`${uid}-note`}>Wishes &amp; prayers (optional)</label>
                  <textarea id={`${uid}-note`} rows={2} maxLength={300} value={f.message} onChange={(e) => f.editMessage(e.target.value)} placeholder="Dietary needs, a song request, or kind words" />
                  <span role="alert" className={s.err}>{f.errors.message}</span>
                </div>
                <button className={s.submit} type="submit" disabled={f.sending}>{f.sending ? "Sending…" : "Send"}</button>
                {f.status === "error" && <span role="alert" className={s.err}>{f.failure}</span>}
              </form>
            )}
          </div>
        </div>
      </div>
      <div className={`${s.thanks} ${rv()}`} aria-hidden="true"><span className={s.gold}>thank you</span></div>
    </Sec>
  );
}

// ---- wishes --------------------------------------------------------------------------------------
export function Wishes({ side }: { side: string | null }) {
  const { config: c, mode, token } = useWd();
  const uid = useId();
  const w = useWishes({ mode, token, nameLocked: c.rsvp.nameLocked, guestName: c.guestName, samples: c.sampleWishes });
  if (!c.show.wishes) return null;
  const cur = w.all[w.pos];
  const msg = w.status === "local" ? `Thank you, ${w.thanks}. Your wish is shown on this device only.` : w.status === "sent" ? `Thank you, ${w.thanks}. Your wish has been shared with the couple.` : w.status === "error" ? "We could not send your wish. Please try again." : "";
  return (
    <Sec id="wishes" label="Kind words" side={side} className={s.details}>
      <div className={s.wishes}>
        <div className={s.wRead}>
          <Head title={c.wishesTitle || "Wishes"} sub="kind words from people we love" />
          <div className={`${s.wcard} ${rv(2)}`} aria-live="polite">
            <span className={`${s.qm} ${s.gold}`} aria-hidden="true">“</span>
            {cur ? (
              <>
                <blockquote key={cur.id}>{cur.message}</blockquote>
                <cite>{cur.name}{(cur as { relation?: string }).relation ? ` · ${(cur as { relation?: string }).relation}` : ""}</cite>
              </>
            ) : w.loading ? <blockquote>Loading kind words…</blockquote> : w.failed ? <button type="button" className={s.submit} onClick={w.reload}>Could not load. Try again</button> : <blockquote>Be the first to leave kind words.</blockquote>}
          </div>
          {w.count > 1 && (
            <div className={s.wnav}>
              <button type="button" aria-label="Previous wish" onClick={() => w.step(-1)}>‹</button>
              <span>{String(w.pos + 1).padStart(2, "0")} / {String(w.count).padStart(2, "0")}</span>
              <button type="button" aria-label="Next wish" onClick={() => w.step(1)}>›</button>
            </div>
          )}
        </div>
        <form className={`${s.wform} ${s.rf} ${rv()}`} onSubmit={w.submit} noValidate>
          <h3>Leave a wish</h3>
          {!c.rsvp.nameLocked && (
            <div className={s.q}>
              <label className={s.t} htmlFor={`${uid}-n`}>Your name</label>
              <input id={`${uid}-n`} type="text" maxLength={60} value={w.name} onChange={(e) => w.editName(e.target.value)} autoComplete="name" aria-invalid={!!w.errors.name} />
              <span role="alert" className={s.err}>{w.errors.name}</span>
            </div>
          )}
          <div className={s.q}>
            <label className={s.t} htmlFor={`${uid}-t`}>Your wish</label>
            <textarea id={`${uid}-t`} rows={3} maxLength={300} value={w.text} onChange={(e) => w.editText(e.target.value)} aria-invalid={!!w.errors.text} />
            <span role="alert" className={s.err}>{w.errors.text}</span>
          </div>
          <button type="submit" className={s.submit} disabled={w.sending}>{w.sending ? "Sending…" : "Send wish"}</button>
          <p role="status" className={s.hint} style={{ marginTop: 10 }}>{msg}</p>
        </form>
      </div>
    </Sec>
  );
}

// ---- save the date -------------------------------------------------------------------------------
export function SaveTheDate() {
  const { config: c, d, engine } = useWd();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const off1 = engine.listen(document, "pointerdown", (e) => !box.current?.contains(e.target as Node) && setOpen(false));
    const off2 = engine.listen(document, "keydown", (e) => e.key === "Escape" && setOpen(false));
    return () => (off1(), off2());
  }, [open, engine]);
  const url = c.closing.photo?.url ?? c.heroPhoto?.url ?? null;
  const ics = () => {
    if (!d.cal) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([d.cal.ics], { type: "text/calendar" }));
    a.download = "wedding.ics";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    setOpen(false);
  };
  return (
    <>
      <section id="closing" aria-label="Save the date" className={s.std}>
        <div className={`${s.photo} ${s.par}`} aria-hidden="true" style={{ background: DARK_ROOM, ...bgOf(url), backgroundSize: "cover", backgroundPosition: "center 35%" }} />
        <div className={s.shade} aria-hidden="true" />
        <div className={`${s.leak} ${s.loop}`} aria-hidden="true" />
        <Dust density={0.8} />
        <div className={s.inner}>
          {d.monthName && <div className={`${s.m} ${rv()}`}>{d.monthName}</div>}
          {d.dayNum && <div className={`${s.d} ${s.gold} ${rv(1)}`}>{d.dayNum}</div>}
          {d.year && <div className={`${s.y} ${rv(1)}`}>{d.year}</div>}
          <h2 className={`${s.s} ${rv(2)}`}>{c.closing.title}</h2>
          {c.closing.body && <p className={`${s.msg} ${rv(2)}`}>{c.closing.body}</p>}
          {d.cal && (
            <div className={`${s.cal} ${rv(3)}`} ref={box}>
              {open && (
                <div className={s.menu} id="wd-cal-menu">
                  <a href={d.cal.google} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>Google Calendar</a>
                  <button type="button" onClick={ics}>Apple / Outlook (.ics)</button>
                  <a href={d.cal.yahoo} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>Yahoo Calendar</a>
                </div>
              )}
              <button type="button" className={`${s.pill} ${s.glass}`} aria-expanded={open} aria-controls="wd-cal-menu" onClick={() => setOpen((v) => !v)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" focusable="false"><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4M12 13v5M9.5 15.5h5" /></svg>
                Add to calendar
              </button>
            </div>
          )}
        </div>
      </section>
      <footer className={s.foot}>
        <span className={s.footNames}>{c.partnerOne} <i className={s.gold}>&amp;</i> {c.partnerTwo}</span>
        <span>{d.dots}</span>
        <span>Made with love ♡</span>
      </footer>
    </>
  );
}
