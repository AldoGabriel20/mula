"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { copyText } from "@/lib/kit/behaviors/copyText";
import { useCountdown } from "@/lib/kit/behaviors/useCountdown";
import { useLightbox } from "@/lib/kit/behaviors/useLightbox";
import { useRsvp } from "@/lib/kit/behaviors/useRsvp";
import { useWishes } from "@/lib/kit/behaviors/useWishes";
import { mapHref } from "@/lib/kit/model";
import { createStore } from "@/lib/kit/store";
import { lake, pocket } from "./art";
import { DEFAULT_COPY } from "./config";
import { useAr } from "./context";
import { Bq, Frame, Seal, rv, useDepth } from "./fx";
import s from "./arunika.module.css";

const bg = (u: string): CSSProperties => ({ backgroundImage: `url(${JSON.stringify(u)})` });
/** Where each placeholder polaroid crops the painted lake: [background-size, background-position]. */
const CROPS: [string, string][] = [["210% auto", "35% 88%"], ["230% auto", "12% 60%"], ["260% auto", "86% 80%"], ["cover", "center"]];
/** A photo, or a crop of the painted lake when the hosts have none yet. */
function Shot({ url, crop, bw = true, className = "" }: { url?: string; crop: number; bw?: boolean; className?: string }) {
  const [size, pos] = CROPS[crop % CROPS.length];
  const style = url ? { ...bg(url), backgroundSize: "cover", backgroundPosition: "center 30%" } : { backgroundImage: lake(), backgroundSize: size, backgroundPosition: pos };
  return <div className={`${s.shot} ${url && bw ? s.bw : ""} ${className}`} style={style} />;
}
/** z = how high the paper sits (parallax depth), r = its rotation, i = when it lands. */
const at = (z: number, r: number, i: number, extra?: CSSProperties) => ({ "--z": z, "--r": `${r}deg`, "--i": i, ...extra }) as CSSProperties;

/** A section heading: small caps, a big script word, an optional line under it. */
function Head({ kicker, title, sub, light = false }: { kicker: string; title: string; sub?: string; light?: boolean }) {
  return (
    <header className={`${s.head} ${light ? s.headLight : ""}`}>
      <span className={`${s.hKick} ${rv()}`}>{kicker}</span>
      <h2 className={`${s.hTitle} ${rv(1)}`}>{title}</h2>
      {sub && <p className={`${s.hSub} ${rv(2)}`}>{sub}</p>}
      <span className={`${s.orn} ${rv(2)}`} aria-hidden="true" />
    </header>
  );
}

// ---- 1. the collage ------------------------------------------------------------------------------
export function Collage() {
  const { config: c, d } = useAr();
  const depth = useDepth<HTMLDivElement>();
  const known = c.guestName !== DEFAULT_COPY.guestName;
  const liner = useMemo(() => ({ backgroundImage: lake() }), []);
  const pocketSvg = useMemo(() => ({ __html: pocket("var(--env)", "var(--env-lip)") }), []);
  const story = c.show.story ? "#story" : null;
  const pola = (cls: string, z: number, r: number, i: number, k: number, cap: ReactNode, label?: string) => {
    const body = (
      <>
        <Shot url={c.photos[k]} crop={k} bw={k > 0} />
        <span className={s.polaCap}>{cap}</span>
      </>
    );
    return story && label ? (
      <a className={`${s.ci} ${s.pola} ${cls}`} style={at(z, r, i)} href={story} aria-label={label}>{body}</a>
    ) : (
      <div className={`${s.ci} ${s.pola} ${cls}`} style={at(z, r, i)} aria-hidden="true">{body}</div>
    );
  };
  return (
    <section id="top" aria-label="Invitation" className={s.home}>
      <h1 className={s.sr} tabIndex={-1}>The wedding of {c.partnerOne} and {c.partnerTwo}</h1>
      {known && <p className={`${s.dear} ${s.hx}`}>Dear {c.guestName}</p>}
      {/* wide screens: the words beside the collage, held in place while it scrolls past */}
      <div className={s.aside} aria-hidden="true">
        <span className={`${s.hKick} ${s.hx}`}>The wedding of</span>
        <span className={`${s.asNames} ${s.hx}`}>{c.partnerOne}<i>&amp;</i>{c.partnerTwo}</span>
        {d.short && <span className={`${s.asDate} ${s.hx}`}>{[d.weekday, d.short].filter(Boolean).join(" · ")}</span>}
        <span className={`${s.asVenue} ${s.hx}`}>{c.venue}</span>
      </div>
      <div className={s.collageWrap} ref={depth}>
        <div className={s.collage}>
          <div className={`${s.ci} ${s.cEnv}`} style={at(1, -2, 0)} aria-hidden="true">
            <div className={`${s.env} ${s.envOpen}`}>
              <div className={s.envBack}><div className={s.liner} style={liner} /></div>
              <div className={s.pocket} dangerouslySetInnerHTML={pocketSvg} />
              <div className={s.flap}><div className={s.flapFront} /><div className={s.flapBack}><div className={s.liner} style={liner} /></div></div>
              <Seal seed={7} className={s.envSeal} />
            </div>
          </div>
          <Bq seed={11} o={{ callaAng: -38, hang: 4, hangLen: 1.2 }} className={s.ci} style={at(5, 0, 6, { left: "-1cqw", top: "36cqw", width: "36cqw", zIndex: 6 })} />
          <Bq seed={23} o={{ flip: true, callaAng: -30, hang: 3, white: true }} className={s.ci} style={at(5, 0, 7, { left: "63cqw", top: "26cqw", width: "35cqw", zIndex: 6 })} />

          <article className={`${s.ci} ${s.card} ${s.cNamesCard}`} style={at(3, -1.5, 1)}>
            <Frame light />
            <p className={s.lead}>{c.inviteLine}</p>
            <p className={s.n}>{c.partnerOne}</p>
            <p className={s.amp} aria-hidden="true">&amp;</p>
            <p className={s.n}>{c.partnerTwo}</p>
            {[[16, 7], [51, 8.5, 1], [82, 10], [9, 13, 1], [9, 72], [88, 58, 1], [84, 86], [52, 90, 1], [21, 91], [10, 44, 1]].map(([l, t, sm], i) => (
              <span key={i} className={`${s.pearl} ${sm ? s.pearlSm : ""}`} style={{ left: `${l}%`, top: `${t}%` }} aria-hidden="true" />
            ))}
          </article>

          <article className={`${s.ci} ${s.card} ${s.cDate}`} style={at(2, 1.2, 2)}>
            <Frame />
            {d.weekday && <p className={s.wd}>{d.weekday}</p>}
            <p className={s.dd}>{d.dayNum}</p>
            <p className={s.mm}>{d.monthName}</p>
            <p className={s.yy}>{d.year}</p>
            <p className={s.v}>
              {d.time && <>At {d.time}<br /></>}
              {c.venue}
              {c.address && <><br /><small>{c.address}</small></>}
            </p>
          </article>

          <Bq seed={37} o={{ callaAng: -20, hang: 3, hangLen: 1.4, callas: 2 }} className={s.ci} style={at(6, 0, 8, { left: "37cqw", top: "108cqw", width: "31cqw", zIndex: 7 })} />
          <a className={`${s.ci} ${s.card} ${s.cDetails}`} style={at(4, 0, 3)} href="#details" aria-label="Tap for the details">
            <span className={s.k}>Tap for the</span>
            <span className={s.sc}>Details</span>
          </a>
          <a className={`${s.ci} ${s.card} ${s.cRsvp}`} style={at(3, 2, 4)} href="#rsvp" aria-label="Kindly RSVP here">
            <Frame />
            <span className={s.sc}>Kindly</span>
            <span className={s.rs}><b>R</b>SVP</span>
            <span className={s.sc}>Here</span>
          </a>
          <Seal seed={5} className={s.ci} style={at(5, -8, 5, { left: "2.5cqw", top: "145.5cqw", width: "15cqw", zIndex: 6 })} />
          <div className={`${s.ci} ${s.strip}`} style={at(2, 0, 5, { backgroundImage: lake() })} aria-hidden="true" />

          {pola(s.pVenue, 2, 1.5, 6, 0, <i>{c.venue}</i>)}
          <Bq seed={58} o={{ callaAng: 40, callas: 3, hang: 2 }} className={s.ci} style={at(6, 0, 9, { left: "42cqw", top: "162cqw", width: "33cqw", zIndex: 6 })} />
          {pola(s.pOne, 3, -4, 7, 1, story ? "Tap for" : <i>forever</i>, "Read our love story")}
          {pola(s.pTwo, 4, -3, 8, 2, story ? <>Our <i>Love</i> Story</> : <>{d.ini1} <i>&amp;</i> {d.ini2}</>, "Our love story")}
        </div>
      </div>
      <div className={`${s.scrollHint} ${s.hx}`} aria-hidden="true"><span>Scroll</span><i /></div>
    </section>
  );
}

// ---- 2. countdown over the lake ------------------------------------------------------------------
const Flip = ({ v }: { v: string }) => <span className={s.flip}>{[...v].map((ch, i) => <span key={`${i}${ch}`} className={s.fd}>{ch}</span>)}</span>;

function CalendarButton() {
  const { d, engine } = useAr();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement | null>(null);
  const menuId = useId();
  useEffect(() => {
    if (!open) return;
    const off1 = engine.listen(document, "pointerdown", (e) => !box.current?.contains(e.target as Node) && setOpen(false));
    const off2 = engine.listen(document, "keydown", (e) => e.key === "Escape" && setOpen(false));
    return () => (off1(), off2());
  }, [open, engine]);
  if (!d.cal) return null;
  const cal = d.cal;
  const ics = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([cal.ics], { type: "text/calendar" }));
    a.download = "wedding.ics";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    setOpen(false);
  };
  return (
    <div className={s.cal} ref={box}>
      {open && (
        <div className={s.menu} id={menuId}>
          <a href={cal.google} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>Google Calendar</a>
          <button type="button" onClick={ics}>Apple / Outlook (.ics)</button>
        </div>
      )}
      <button type="button" className={s.ghostBtn} aria-expanded={open} aria-controls={menuId} onClick={() => setOpen((v) => !v)}>Add to calendar</button>
    </div>
  );
}

export function Countdown() {
  const { config: c, d } = useAr();
  const t = useCountdown(c.weddingDate);
  const days = t.d === "—" ? "—" : String(t.d);
  const units: [string, string][] = [[days, "Days"], [String(t.h), "Hours"], [String(t.m), "Minutes"], [String(t.s), "Seconds"]];
  return (
    <section id="countdown" aria-label="Countdown" className={s.cd}>
      <div className={`${s.cdBg} ${s.loop}`} aria-hidden="true" style={{ backgroundImage: lake() }} />
      <div className={`${s.mist} ${s.loop}`} aria-hidden="true" />
      <div className={s.cdIn}>
        <h2 className={`${s.cdTitle} ${rv()}`}>{c.heroLine}</h2>
        {t.ended && t.ready ? (
          <p className={`${s.ended} ${rv(1)}`}>{t.endedText}</p>
        ) : (
          <div role="timer" aria-label="Time until the wedding" className={`${s.timer} ${rv(1)}`}>
            {units.map(([n, l]) => (
              <div key={l} className={s.unit}>
                <Flip v={n} />
                <span className={s.ul}>{l}</span>
              </div>
            ))}
          </div>
        )}
        <p className={`${s.cdNames} ${rv(2)}`}>{c.partnerOne} &amp; {c.partnerTwo}</p>
        {d.short && <p className={`${s.cdDate} ${rv(2)}`}>{d.short}</p>}
        <div className={rv(3)}><CalendarButton /></div>
      </div>
    </section>
  );
}

// ---- 3. love story -------------------------------------------------------------------------------
export function Story() {
  const { config: c } = useAr();
  if (!c.show.story) return null;
  const { title, body, chapters, photos } = c.story;
  return (
    <section id="story" aria-label="Our love story" className={s.sec}>
      <Bq seed={91} o={{ callaAng: 30, hang: 3 }} className={`${s.hBq} ${s.hBqL}`} />
      <Bq seed={92} o={{ flip: true, callaAng: 30, hang: 3 }} className={`${s.hBq} ${s.hBqR}`} />
      <Head kicker="Our" title={title || "Love Story"} sub="How it all began" />
      <div className={s.wrap}>
        {body && <p className={`${s.lede} ${rv()}`}>{body}</p>}
        <ol className={s.story}>
          {chapters.map((ch, i) => (
            <li key={i} className={`${s.chapter} ${i % 2 ? s.rev : ""} ${rv()}`}>
              <figure className={s.pol} style={{ "--r": `${[-3, 2.5, -2, 3][i % 4]}deg` } as CSSProperties}>
                <Shot url={photos[i]?.url ?? c.photos[i + 1]} crop={i + 1} bw={i % 2 === 0} />
                <figcaption>{ch.title}</figcaption>
              </figure>
              <div className={s.txt}>
                {ch.when && <span className={s.yr}>{ch.when}</span>}
                <h3>{ch.title}</h3>
                {ch.text && <p>{ch.text}</p>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ---- 4. the finer details ------------------------------------------------------------------------
export function Details() {
  const { config: c, d } = useAr();
  return (
    <section id="details" aria-label="The details" className={s.sec}>
      <Bq seed={71} o={{ callaAng: 30, hang: 3 }} className={`${s.hBq} ${s.hBqL}`} />
      <Bq seed={72} o={{ flip: true, callaAng: 30, hang: 3 }} className={`${s.hBq} ${s.hBqR}`} />
      <Head kicker="The finer" title="Details" sub={[d.weekday, [d.dayNum, d.monthName, d.year].filter(Boolean).join(" ")].filter(Boolean).join(" · ")} />
      <div className={s.wrap}>
        <div className={`${s.paper} ${rv()}`}>
          <Frame />
          <div className={s.h3}><span className={s.h3s}>Order of the Day</span><span className={s.h3c}>Wedding day timeline</span></div>
          <ol className={s.tl}>
            {c.events.map((e, i) => (
              <li key={i} className={rv(i % 3)}>
                <span className={s.tlT}>{d.rowTime(e)}</span>
                <span className={s.tlDot} aria-hidden="true" />
                <span className={s.tlE}>{e.title}{e.description && <small>{e.description}</small>}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className={s.h3}><span className={`${s.h3s} ${rv()}`}>Where &amp; When</span><span className={`${s.h3c} ${rv(1)}`}>Getting there</span></div>
        <div className={s.grid2}>
          {d.venues.map((e, i) => {
            const name = e.venue || e.title;
            return (
              <article key={i} className={`${s.info} ${rv(i % 2)}`}>
                <Shot url={e.photo?.url} crop={3} bw={false} className={s.thumb} />
                <p className={s.icT}>{e.label || e.title}</p>
                <h3 className={s.icS}>{name}</h3>
                {d.rowTime(e) && <p className={s.icTime}>{d.rowTime(e)}</p>}
                {e.address && e.address !== name && <p className={s.body}>{e.address}</p>}
                {e.venueNote && <p className={`${s.body} ${s.muted}`}>{e.venueNote}</p>}
                {(e.venue || e.address || e.mapUrl) && (
                  <a className={s.btn} href={mapHref(e.mapUrl, e.venue, e.address)} target="_blank" rel="noopener noreferrer" aria-label={`View ${name} on the map (new tab)`}>View Map</a>
                )}
              </article>
            );
          })}
        </div>

        {c.dressCode && (
          <div className={`${s.paper} ${s.dark} ${rv()}`}>
            <Frame light />
            <div className={s.h3}><span className={s.h3s}>Dress Code</span><span className={s.h3c}>What to wear</span></div>
            <p className={s.bodyC}>{c.dressCode}</p>
            <ul className={s.palette} aria-label="Our colours">
              {[["Olive", "var(--k-ink-soft)"], ["Wine", "var(--k-accent)"], ["Rose", "var(--k-accent-soft)"], ["Sage", "var(--k-line)"], ["Champagne", "var(--champagne)"]].map(([n, v]) => (
                <li key={n} className={s.sw}><i style={{ background: v }} />{n}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

// ---- 5. gallery + lightbox -----------------------------------------------------------------------
export function Gallery() {
  const { config: c, engine } = useAr();
  const photos = c.gallery;
  const [store] = useState(() => createStore<number | null>(null));
  const keyRef = useRef<((e: KeyboardEvent) => boolean) | null>(null);
  const setKeyHandler = useCallback((fn: ((e: KeyboardEvent) => boolean) | null) => void (keyRef.current = fn), []);
  useEffect(() => engine.listen(document, "keydown", (e) => void (keyRef.current?.(e) && e.preventDefault())), [engine]);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const filled = photos.map((p, i) => (p.url ? i : -1)).filter((i) => i >= 0);
  const lb = useLightbox({ store, filled, engine, focusRef: closeRef, setKeyHandler });
  if (!c.show.gallery || photos.length === 0) return null;
  const cur = lb.index === null ? null : photos[lb.index];
  const k = lb.index === null ? 0 : Math.max(0, filled.indexOf(lb.index));
  return (
    <>
      <section id="gallery" aria-label="Gallery" className={`${s.sec} ${s.secTint}`}>
        <Head kicker="Captured" title="Moments" sub="A few of our favourite frames" />
        <ul className={s.gal}>
          {photos.map((p, i) => (
            <li key={i} className={`${s.cell} ${rv(i % 3)}`} style={{ "--r": `${[-2, 1.5, -1, 2.5, -2.5][i % 5]}deg` } as CSSProperties}>
              <Shot url={p.url ?? undefined} crop={i} />
              {p.url ? <button type="button" aria-label={`View photo ${i + 1} full screen${p.alt ? `: ${p.alt}` : ""}`} onClick={() => lb.open(i)} /> : <span className={s.cellCap}>{p.alt}</span>}
            </li>
          ))}
        </ul>
      </section>
      {cur && (
        <div role="dialog" aria-modal="true" aria-label="Photo viewer" className={s.lb} onClick={(e) => e.target === e.currentTarget && lb.close()}>
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element -- signed, expiring API URL */}
            {cur.url ? <img src={cur.url} alt={cur.alt} /> : <p>This photograph is unavailable.</p>}
            <figcaption>{`${String(k + 1).padStart(2, "0")} / ${String(Math.max(1, filled.length)).padStart(2, "0")}${cur.alt ? ` · ${cur.alt}` : ""}`}</figcaption>
          </figure>
          <button ref={closeRef} type="button" className={s.lbBtn} style={{ top: 16, right: 16 }} onClick={lb.close} aria-label="Close photo viewer">✕</button>
          <button type="button" className={s.lbBtn} style={{ left: 8, top: "50%", translate: "0 -50%" }} onClick={() => lb.step(-1)} aria-label="Previous photo">‹</button>
          <button type="button" className={s.lbBtn} style={{ right: 8, top: "50%", translate: "0 -50%" }} onClick={() => lb.step(1)} aria-label="Next photo">›</button>
        </div>
      )}
    </>
  );
}

// ---- 6. gift -------------------------------------------------------------------------------------
export function Gift() {
  const { config: c, d } = useAr();
  const [done, setDone] = useState<{ i: number; ok: boolean } | null>(null);
  if (!c.show.gift) return null;
  const copy = async (i: number) => setDone({ i, ok: await copyText(c.gift.methods[i].number.replace(/\s+/g, "")) });
  return (
    <section id="gift" aria-label="Gift" className={s.sec}>
      <Head kicker="With gratitude" title={c.gift.title || "Gift Registry"} />
      <div className={s.wrap}>
        <p className={`${s.bodyC} ${rv()}`}>{c.gift.note}</p>
        <div className={s.gifts}>
          {c.gift.methods.map((m, i) => (
            <div key={i} className={`${s.gcard} ${rv(1 + (i % 2))}`}>
              <div className={s.gEnv}>
                <span className={s.gKind}>{m.kind === "wallet" ? "E-wallet" : "Bank transfer"}</span>
                <b className={s.gBank}>{m.bank}</b>
                <code className={s.gNum}>{m.number}</code>
                <span className={s.gHolder}>{m.holder}</span>
                <Seal seed={40 + i} className={s.gSeal} />
                <span className={s.gMono} aria-hidden="true">{d.ini1}&amp;{d.ini2}</span>
              </div>
              <button type="button" className={`${s.btn} ${s.btnWine}`} onClick={() => copy(i)}>{done?.i === i && done.ok ? "Copied ✓" : "Copy number"}</button>
            </div>
          ))}
        </div>
        <p role="status" className={s.sr}>{done ? (done.ok ? "Account number copied to your clipboard." : "Copy is not available here. Please copy the number manually.") : ""}</p>
      </div>
    </section>
  );
}

// ---- 7. rsvp -------------------------------------------------------------------------------------
export function Rsvp() {
  const { config: c, d, mode, token } = useAr();
  const rvp = c.rsvp;
  const uid = useId();
  const prefill = rvp.nameLocked || c.guestName !== DEFAULT_COPY.guestName ? c.guestName : "";
  const f = useRsvp({ mode, token, status: rvp.status, partySize: rvp.partySize, maxParty: rvp.maxParty, prefillName: prefill });
  const thanks = useRef<HTMLParagraphElement | null>(null);
  const wasDone = useRef(f.done);
  useEffect(() => {
    if (f.done && !wasDone.current) thanks.current?.focus({ preventScroll: true });
    wasDone.current = f.done;
  }, [f.done]);
  return (
    <section id="rsvp" aria-label="RSVP" className={`${s.sec} ${s.secTint}`}>
      <Bq seed={81} o={{ callaAng: 30, hang: 3 }} className={`${s.hBq} ${s.hBqL}`} />
      <Bq seed={82} o={{ flip: true, callaAng: 30, hang: 3 }} className={`${s.hBq} ${s.hBqR}`} />
      <Head kicker="Kindly" title={c.rsvp.title || "RSVP"} sub={d.rsvpBy ? `Please reply ${d.rsvpBy}` : undefined} />
      <div className={s.wrap}>
        <div className={`${s.paper} ${s.rsvpCard} ${rv()}`}>
          <Frame />
          <Seal seed={9} className={s.rsvpSeal} />
          {f.done ? (
            <div className={s.sent}>
              <Seal seed={12} className={s.sentSeal} />
              <p className={s.sentT}>{f.attend === "no" ? "Thank you" : "See you there!"}</p>
              <p ref={thanks} tabIndex={-1} className={s.bodyC} style={{ outline: "none" }}>
                {f.attend === "no" ? `We will miss you${f.firstName ? `, ${f.firstName}` : ""}. Thank you for letting us know.` : `Thank you${f.firstName ? `, ${f.firstName}` : ""}! Your confirmation is received ♡`}
              </p>
              {f.status === "demo" && <p className={s.hint}>{mode === "preview" ? "This is a preview: nothing was sent." : "This is a demo: nothing was sent."}</p>}
              {mode === "live" && token && <button type="button" className={s.linkBtn} onClick={f.edit}>Change my reply</button>}
            </div>
          ) : rvp.mode === "notice" ? (
            <p className={s.bodyC}>Please open the personal link your hosts sent you to reply.</p>
          ) : (
            <form className={s.form} onSubmit={f.submit} noValidate aria-busy={f.sending}>
              <p className={s.hint}>{rvp.body}</p>
              <div className={s.q}>
                <label className={s.t} htmlFor={`${uid}-name`}>Full name *</label>
                <input id={`${uid}-name`} type="text" value={f.name} readOnly={rvp.nameLocked} onChange={(e) => f.editName(e.target.value)} autoComplete="name" maxLength={80} aria-invalid={!!f.errors.name} aria-describedby={`${uid}-e-name`} placeholder="As written on your invitation" />
                <span id={`${uid}-e-name`} role="alert" className={s.err}>{f.errors.name}</span>
              </div>
              <fieldset className={s.q} aria-describedby={`${uid}-e-att`}>
                <legend className={s.t}>Will you attend? *</legend>
                <div className={s.choice}>
                  <label className={s.opt}><input type="radio" name={`${uid}-att`} checked={f.attend === "yes"} onChange={() => f.chooseAttend("yes")} /> <span>Joyfully accept</span></label>
                  <label className={s.opt}><input type="radio" name={`${uid}-att`} checked={f.attend === "no"} onChange={() => f.chooseAttend("no")} /> <span>Regretfully decline</span></label>
                </div>
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
                <label className={s.t} htmlFor={`${uid}-note`}>A note for the couple (optional)</label>
                <textarea id={`${uid}-note`} rows={3} maxLength={300} value={f.message} onChange={(e) => f.editMessage(e.target.value)} placeholder="Dietary needs, a song that gets you dancing, or kind words" />
                <span role="alert" className={s.err}>{f.errors.message}</span>
              </div>
              <button className={`${s.btn} ${s.btnWine} ${s.submit}`} type="submit" disabled={f.sending}>{f.sending ? "Sending…" : "Send RSVP"}</button>
              {f.status === "error" && <span role="alert" className={s.err}>{f.failure}</span>}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

// ---- 8. wishes -----------------------------------------------------------------------------------
export function Wishes() {
  const { config: c, mode, token } = useAr();
  const uid = useId();
  const w = useWishes({ mode, token, nameLocked: c.rsvp.nameLocked, guestName: c.guestName, samples: c.sampleWishes });
  if (!c.show.wishes) return null;
  const cur = w.all[w.pos];
  const relation = (cur as { relation?: string } | undefined)?.relation;
  const msg = w.status === "local" ? `Thank you, ${w.thanks}. Your wish is shown on this device only.` : w.status === "sent" ? `Thank you, ${w.thanks}. Your wish has been shared with the couple.` : w.status === "error" ? "We could not send your wish. Please try again." : "";
  return (
    <section id="wishes" aria-label="Kind words" className={s.sec}>
      <Head kicker="Kind" title={c.wishesTitle || "Wishes"} sub="Words from the people we love" />
      <div className={`${s.wrap} ${s.wishes}`}>
        <div>
          <div className={`${s.wcard} ${rv()}`} aria-live="polite">
            <span className={s.qm} aria-hidden="true">“</span>
            {cur ? (
              <>
                <blockquote key={cur.id}>{cur.message}</blockquote>
                <cite>{cur.name}{relation ? ` · ${relation}` : ""}</cite>
              </>
            ) : w.loading ? <blockquote>Loading kind words…</blockquote> : w.failed ? <button type="button" className={s.btn} onClick={w.reload}>Could not load. Try again</button> : <blockquote>Be the first to leave kind words.</blockquote>}
          </div>
          {w.count > 1 && (
            <div className={s.wnav}>
              <button type="button" aria-label="Previous wish" onClick={() => w.step(-1)}>‹</button>
              <span>{String(w.pos + 1).padStart(2, "0")} / {String(w.count).padStart(2, "0")}</span>
              <button type="button" aria-label="Next wish" onClick={() => w.step(1)}>›</button>
            </div>
          )}
        </div>
        <form className={`${s.paper} ${s.form} ${rv(1)}`} onSubmit={w.submit} noValidate>
          <Frame />
          <h3 className={s.formT}>Leave a wish</h3>
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
          <button type="submit" className={`${s.btn} ${s.submit}`} disabled={w.sending}>{w.sending ? "Sending…" : "Send wish"}</button>
          <p role="status" className={s.hint}>{msg}</p>
        </form>
      </div>
    </section>
  );
}

// ---- 9. closing ----------------------------------------------------------------------------------
export function Closing() {
  const { config: c, d } = useAr();
  return (
    <>
      <section id="closing" aria-label="Closing" className={s.closing}>
        <div className={`${s.cdBg} ${s.loop}`} aria-hidden="true" style={{ backgroundImage: lake() }} />
        <div className={`${s.mist} ${s.loop}`} aria-hidden="true" />
        <Bq seed={58} o={{ callaAng: 40, callas: 3, hang: 2 }} className={`${s.endBq} ${rv()}`} />
        <div className={s.cdIn}>
          <h2 className={`${s.cdTitle} ${rv(1)}`}>{c.closing.title}</h2>
          {c.closing.body && <p className={`${s.endMsg} ${rv(1)}`}>{c.closing.body}</p>}
          <p className={`${s.cdNames} ${rv(2)}`}>{c.partnerOne} &amp; {c.partnerTwo}</p>
          {d.short && <p className={`${s.cdDate} ${rv(2)}`}>{d.short}</p>}
          <div className={rv(3)}><CalendarButton /></div>
        </div>
      </section>
      <footer className={s.foot}>
        <span className={s.footMono}>{d.ini1} <i>&amp;</i> {d.ini2}</span>
        <span>With love{d.short ? ` · ${d.short}` : ""}</span>
      </footer>
    </>
  );
}

// ---- floating nav --------------------------------------------------------------------------------
const NOTE = <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M9 3v12.3A3.5 3.5 0 1 0 11 18V8h7V3z" /></svg>;

/** A floating pill: jump links plus the music switch. It appears past the collage and is `inert` while hidden. */
export function Dock() {
  const { config: c, music, opened } = useAr();
  const [shown, setShown] = useState(false);
  const [active, setActive] = useState("top");
  const nav = useRef<HTMLElement | null>(null);
  const items = [["top", "Home"], ["details", "Details"], ["rsvp", "RSVP"], ...(c.show.wishes ? [["wishes", "Wishes"]] : [])] as [string, string][];
  useEffect(() => {
    const top = document.getElementById("top");
    if (!top || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setShown(!e.isIntersecting), { rootMargin: "0px 0px -60% 0px" });
    io.observe(top);
    const spy = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)), { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("[data-template='arunika'] section[id]").forEach((el) => spy.observe(el));
    return () => (io.disconnect(), spy.disconnect());
  }, []);
  const visible = opened && shown;
  useEffect(() => {
    if (visible) nav.current?.removeAttribute("inert");
    else nav.current?.setAttribute("inert", "");
  }, [visible]);
  const playing = music.state === "playing";
  const hasMusic = c.show.music && !!music.track;
  const label = playing ? "Pause music" : music.state === "loading" ? "Loading music" : music.state === "error" ? "Music unavailable. Tap to try again." : "Play music";
  return (
    <nav ref={nav} className={`${s.dock} ${visible ? s.dockOn : ""}`} aria-label="Invitation sections">
      {items.map(([id, name]) => (
        <a key={id} href={`#${id}`} className={s.dockLink} aria-current={active === id ? "true" : undefined}>{name}</a>
      ))}
      {hasMusic && (
        <button type="button" className={`${s.dockMusic} ${playing ? s.spin : ""}`} onClick={music.toggle} aria-label={label} aria-pressed={playing}>{NOTE}</button>
      )}
    </nav>
  );
}
