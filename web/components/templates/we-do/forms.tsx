"use client";

import { useEffect, useId, useRef, useState } from "react";
import { copyText } from "@/lib/kit/behaviors/copyText";
import { useRsvp } from "@/lib/kit/behaviors/useRsvp";
import { useWishes } from "@/lib/kit/behaviors/useWishes";
import { DEFAULT_COPY } from "./config";
import { useWd } from "./context";
import { bgOf, rv, Sec, The } from "./sections";
import s from "./we-do.module.css";

// ---- gift ----------------------------------------------------------------------------------------
export function Gift({ side }: { side: string | null }) {
  const { config: c } = useWd();
  const [done, setDone] = useState<{ i: number; ok: boolean } | null>(null);
  if (!c.show.gift) return null;
  const copy = async (i: number) => setDone({ i, ok: await copyText(c.gift.methods[i].number.replace(/\s+/g, "")) });
  return (
    <Sec id="gift" label="Gift" side={side}>
      <div className={s.gift}>
        <div className={rv()}><The /></div>
        <h2 className={`${s.title} ${rv(1)}`}>{c.gift.title || "Gift"}</h2>
        <p className={`${s.note} ${rv(2)}`}>{c.gift.note}</p>
        <div className={s.cards}>
        {c.gift.methods.map((m, i) => (
          <div key={i} className={`${s.card} ${rv(2)}`}>
            <b>{m.bank}</b>
            <span>{m.kind === "wallet" ? "E-wallet" : "Bank transfer"} · {m.holder}</span>
            <code>{m.number}</code>
            <button type="button" className={`${s.pill} ${s.copy}`} onClick={() => copy(i)}>Copy number</button>
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
  const flower = (
    <svg viewBox="0 0 80 70" aria-hidden="true" focusable="false"><use href="#wd-flower" /></svg>
  );
  return (
    <Sec id="rsvp" label="RSVP" side={side}>
      <div className={s.rsvp}>
        <div className={s.rsvpArt}>
        <div className={`${s.please} ${rv()}`} aria-hidden="true"><span>please</span></div>
        <h2 className={s.sr}>RSVP</h2>
        <div className={`${s.foil} ${rv(1)}`} aria-hidden="true">
          {["R", "S", "V", "P"].map((l) => <div key={l} className={s.L}>{l}{flower}</div>)}
        </div>
        {d.rsvpBy && <div className={`${s.by} ${rv()}`}>{d.rsvpBy}</div>}
        </div>
        <div className={s.rsvpBody}>
        <div className={`${s.ready} ${rv()}`}>{c.rsvp.title || "Ready to party?"}</div>
        <p className={rv(1)}>{rvp.body}</p>
        <button type="button" className={`${s.rsvpbtn} ${rv(2)}`} onClick={go} aria-label="RSVP: go to the reply form">
          <svg viewBox="0 0 24 30" aria-hidden="true" focusable="false"><path d="M8 2h8v14h6L12 28 2 16h6z" fill="url(#wd-gold)" /></svg>RSVP<svg viewBox="0 0 24 30" aria-hidden="true" focusable="false"><path d="M8 2h8v14h6L12 28 2 16h6z" fill="url(#wd-gold)" /></svg>
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
                <label className="t" htmlFor={`${uid}-name`} style={{ display: "block", fontFamily: "var(--serif)", fontSize: 18, marginBottom: 8 }}>Full name *</label>
                <input id={`${uid}-name`} type="text" value={f.name} readOnly={rvp.nameLocked} onChange={(e) => f.editName(e.target.value)} autoComplete="name" maxLength={80} aria-invalid={!!f.errors.name} aria-describedby={`${uid}-e-name`} placeholder="As written on your invitation" />
                <span id={`${uid}-e-name`} role="alert" className={s.err}>{f.errors.name}</span>
              </div>
              <fieldset className={s.q} aria-describedby={`${uid}-e-att`} style={{ margin: "10px 0 0" }}>
                <legend className="t" style={{ fontFamily: "var(--serif)", fontSize: 18, padding: 0 }}>Will you attend? *</legend>
                <label className={s.opt}><input type="radio" name={`${uid}-att`} checked={f.attend === "yes"} onChange={() => f.chooseAttend("yes")} /> Joyfully accept — I&apos;ll be there!</label>
                <label className={s.opt}><input type="radio" name={`${uid}-att`} checked={f.attend === "no"} onChange={() => f.chooseAttend("no")} /> Sadly, I won&apos;t be able to attend.</label>
                <span id={`${uid}-e-att`} role="alert" className={s.err}>{f.errors.attend}</span>
              </fieldset>
              {f.yes && f.maxGuests > 1 && (
                <div className={s.q}>
                  <span id={`${uid}-g`} style={{ display: "block", fontFamily: "var(--serif)", fontSize: 18, marginBottom: 8 }}>Number of guests (including you)</span>
                  <div className={s.step} role="group" aria-labelledby={`${uid}-g`}>
                    <button type="button" aria-label="Fewer guests" disabled={f.guests <= 1} onClick={() => f.stepGuests(-1)}>−</button>
                    <output aria-live="polite">{f.guests}</output>
                    <button type="button" aria-label="More guests" disabled={f.guests >= f.maxGuests} onClick={() => f.stepGuests(1)}>+</button>
                  </div>
                </div>
              )}
              <div className={s.q}>
                <label htmlFor={`${uid}-note`} style={{ display: "block", fontFamily: "var(--serif)", fontSize: 18, marginBottom: 8 }}>Wishes &amp; prayers (optional)</label>
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
      <div className={`${s.thanks} ${rv()}`} aria-hidden="true"><span>thank you</span></div>
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
    <Sec id="wishes" label="Kind words" side={side}>
      <div className={s.wishes}>
        <div className={s.wRead}>
        <div className={rv()}><The /></div>
        <h2 className={`${s.title} ${rv(1)}`}>{c.wishesTitle || "Wishes"}</h2>
        <div className={s.wcard} aria-live="polite">
          {cur ? (
            <>
              <blockquote>“{cur.message}”</blockquote>
              <cite>{cur.name}{(cur as { relation?: string }).relation ? ` · ${(cur as { relation?: string }).relation}` : ""}</cite>
            </>
          ) : w.loading ? <blockquote>Loading kind words…</blockquote> : w.failed ? <button type="button" className={s.submit} onClick={w.reload}>Could not load. Try again</button> : <blockquote>Be the first to leave kind words.</blockquote>}
        </div>
        {w.count > 1 && (
          <div className={s.wnav}>
            <button type="button" aria-label="Previous wish" onClick={() => w.step(-1)}>‹</button>
            <span>{w.pos + 1} / {w.count}</span>
            <button type="button" aria-label="Next wish" onClick={() => w.step(1)}>›</button>
          </div>
        )}
        </div>
        <form className={`${s.wform} ${s.rf}`} onSubmit={w.submit} noValidate>
          {!c.rsvp.nameLocked && (
            <div className={s.q}>
              <label htmlFor={`${uid}-n`} style={{ display: "block", fontFamily: "var(--serif)", fontSize: 18, marginBottom: 8 }}>Your name</label>
              <input id={`${uid}-n`} type="text" maxLength={60} value={w.name} onChange={(e) => w.editName(e.target.value)} autoComplete="name" aria-invalid={!!w.errors.name} />
              <span role="alert" className={s.err}>{w.errors.name}</span>
            </div>
          )}
          <div className={s.q}>
            <label htmlFor={`${uid}-t`} style={{ display: "block", fontFamily: "var(--serif)", fontSize: 18, marginBottom: 8 }}>Your wish</label>
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
        <div className={s.photo} aria-hidden="true" style={{ background: "linear-gradient(170deg,#6f6f6f,#232323)", ...bgOf(url), backgroundSize: "cover", backgroundPosition: "center 35%" }} />
        <div className={s.inner}>
          {d.monthName && <div className={`${s.m} ${rv()}`}>{d.monthName}</div>}
          {d.dayNum && <div className={`${s.d} ${rv(1)}`}>{d.dayNum}</div>}
          <h2 className={`${s.s} ${rv(2)}`} style={{ margin: "4px 0 0", fontWeight: 400 }}>{c.closing.title}</h2>
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
              <button type="button" className={s.pill} aria-expanded={open} aria-controls="wd-cal-menu" onClick={() => setOpen((v) => !v)}>
                <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="2" y="4" width="17" height="16" rx="2" fill="#111" /><rect x="5" y="2" width="2" height="4" rx="1" fill="#111" /><rect x="14" y="2" width="2" height="4" rx="1" fill="#111" /><g fill="#fff"><rect x="5" y="10" width="2.5" height="2.5" /><rect x="9" y="10" width="2.5" height="2.5" /><rect x="13" y="10" width="2.5" height="2.5" /><rect x="5" y="14" width="2.5" height="2.5" /><rect x="9" y="14" width="2.5" height="2.5" /></g><circle cx="18.5" cy="18.5" r="5" fill="#111" stroke="#fff" strokeWidth="1.2" /><path d="M18.5 16v5M16 18.5h5" stroke="#fff" strokeWidth="1.5" /></svg>
                Add to calendar
              </button>
            </div>
          )}
        </div>
      </section>
      <footer className={s.foot}><span>Made with love ♡</span><span>{c.partnerOne} &amp; {c.partnerTwo}</span></footer>
    </>
  );
}
