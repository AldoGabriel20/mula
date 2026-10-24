"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useCountdown } from "@/lib/kit/behaviors/useCountdown";
import { useLightbox } from "@/lib/kit/behaviors/useLightbox";
import { mapHref } from "@/lib/kit/model";
import { createStore } from "@/lib/kit/store";
import { Icon, PauseIcon, PlayIcon, Rings } from "./art";
import { DEFAULT_COPY } from "./config";
import { useWd } from "./context";
import { iconFor } from "./derive";
import { dl, Dust, Split } from "./fx";
import s from "./we-do.module.css";

/** Reveal classes: `rv(2)` = reveal with the second stagger step. */
export const rv = (step = 0) => (step ? `${s.rv} ${s[`d${step}`]}` : s.rv);
export const bgOf = (url?: string | null): CSSProperties => (url ? { backgroundImage: `url(${JSON.stringify(url)})` } : {});
/** A warm, candlelit backdrop for when the hosts have not added a photograph yet (`--room` in the stylesheet). */
export const DARK_ROOM = "var(--room)";

/** A row: faded backdrop photo on wide screens + the paper column. */
export function Sec({ id, label, side, className = "", colClass = "", children }: { id?: string; label?: string; side?: string | null; className?: string; colClass?: string; children: ReactNode }) {
  return (
    <section id={id} aria-label={label} className={`${s.sec} ${className}`}>
      {side && <div className={s.bg} aria-hidden="true" style={bgOf(side)} />}
      <div className={`${s.col} ${colClass}`}>{children}</div>
    </section>
  );
}
export const The = () => <span className={`${s.the} ${s.gold}`} aria-hidden="true">the</span>;

/**
 * Section heading: "(03)" (a CSS counter), the title rising out of a mask with an italic "the", an optional italic
 * line, and the same word huge and outlined behind it, drifting sideways as the row scrolls past.
 */
export function Head({ title, sub, after }: { title: string; sub?: string; after?: ReactNode }) {
  return (
    <header className={s.head}>
      <span className={s.ghost} aria-hidden="true">{title}</span>
      <div className={`${s.num} ${rv()}`} aria-hidden="true" />
      <h2 className={`${s.title} ${rv(1)}`}><span><The />{title}</span></h2>
      {after}
      {sub && <p className={`${s.sub} ${rv(2)}`}>{sub}</p>}
    </header>
  );
}

// ---- 1. hero ----------------------------------------------------------------------------------
export function Hero({ side }: { side: string | null }) {
  const { config: c, d } = useWd();
  const [first, ...rest] = c.heroTitle.split(/\s+/);
  const known = c.guestName !== DEFAULT_COPY.guestName;
  return (
    <section id="top" aria-label="Invitation" className={`${s.sec} ${s.hero}`}>
      {side && <div className={s.bg} aria-hidden="true" style={bgOf(side)} />}
      <div className={s.col}>
        <div className={s.photo} aria-hidden="true" style={{ background: DARK_ROOM, ...bgOf(c.heroPhoto?.url), backgroundSize: "cover", backgroundPosition: "center 30%" }} />
        <div className={s.shade} aria-hidden="true" />
        <div className={`${s.leak} ${s.loop}`} aria-hidden="true" />
        <Dust />
        <div className={s.inner}>
          {known && <p className={`${s.dear} ${s.hx}`} style={dl(0)}>Dear {c.guestName}</p>}
          <div className={s.wedo}>
            <svg className={s.heart} viewBox="0 0 150 230" fill="none" aria-hidden="true" focusable="false">
              <path d="M70 228 C 62 200, 40 170, 22 120 C 6 76, 8 34, 34 22 C 58 12, 72 40, 74 62 C 78 34, 96 8, 120 14 C 146 22, 146 66, 126 112 C 110 150, 88 186, 52 214" stroke="url(#wd-gold)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h1 className={s.wedoTxt} tabIndex={-1}><span>{first}</span>{rest.length > 0 && <span>{rest.join(" ")}</span>}</h1>
          </div>
          <div className={`${s.together} ${s.hx}`} style={dl(3)}>{c.together}</div>
          <div className={s.names}>
            <span><Split text={c.partnerOne} /></span>
            <i className={`${s.hx} ${s.gold}`} style={dl(5)}>&amp;</i>
            <span><Split text={c.partnerTwo} base={c.partnerOne.length + 3} /></span>
          </div>
          <div className={`${s.invite} ${s.hx}`} style={dl(7)}>{c.inviteLine}</div>
          {d.dayNum && (
            <div className={`${s.dateblock} ${s.hx}`} style={dl(8)}>
              <div className={s.side}>{d.dayName}</div>
              <div className={s.mid}><div className={s.m}>{d.monthName}</div><div className={s.d}>{d.dayNum}</div><div className={s.y}>{d.year}</div></div>
              <div className={s.side}>{d.timeText}</div>
            </div>
          )}
          {c.address && <div className={`${s.addr} ${s.hx}`} style={dl(9)}>{c.address}</div>}
          {c.heroLine && <p className={`${s.line} ${s.hx}`} style={dl(10)}>{c.heroLine}</p>}
        </div>
        <div className={`${s.scrollhint} ${s.hx}`} style={dl(11)} aria-hidden="true"><span>Scroll</span><i /></div>
      </div>
    </section>
  );
}

// ---- 2. our song ---------------------------------------------------------------------------------
export function Player({ side }: { side: string | null }) {
  const { config: c, d, music } = useWd();
  if (!c.show.music || !music.track) return null;
  const playing = music.state === "playing";
  const label = playing ? "Pause music" : music.state === "loading" ? "Loading music" : music.state === "error" ? "Music unavailable. Tap to try again." : "Play music";
  return (
    <Sec id="music" label="Music" side={side}>
      <div className={s.player}>
        <div className={`${s.np} ${rv()}`} data-playing={playing ? "" : undefined}>
          <div className={s.deck} aria-hidden="true">
            <div className={`${s.vinyl} ${s.loop}`}><span>{d.ini1}<i>&amp;</i>{d.ini2}</span></div>
            <div className={s.arm} />
          </div>
          <div className={s.npText}>
            <div className={s.kicker}>Our song</div>
            <div className={s.npTitle}>{music.track.title}</div>
            {music.track.credit && <div className={s.npBy}>{music.track.credit}</div>}
            <div className={s.eq} aria-hidden="true">{[0, 1, 2, 3, 4].map((i) => <span key={i} className={s.loop} style={{ animationDelay: `${i * -0.23}s` }} />)}</div>
          </div>
          <button type="button" className={s.play} onClick={music.toggle} aria-label={label} aria-pressed={playing}>{playing ? <PauseIcon size={22} /> : <PlayIcon size={24} />}</button>
          <span role="status" className={s.sr}>{music.state === "error" ? "The music could not be loaded." : ""}</span>
        </div>
      </div>
    </Sec>
  );
}

// ---- 3. countdown --------------------------------------------------------------------------------
/** Digits that flip down in 3D when they change (each digit re-mounts under a new key). */
const Flip = ({ v }: { v: string }) => (
  <span className={s.flip}>{[...v].map((ch, i) => <span key={`${i}${ch}`} className={s.fd}>{ch}</span>)}</span>
);

export function Countdown({ side }: { side: string | null }) {
  const { config: c } = useWd();
  const t = useCountdown(c.weddingDate);
  const days = t.d === "—" ? "—" : t.d > 99 ? String(t.d) : String(t.d).padStart(2, "0");
  const units: [string, string][] = [[days, "Days"], [String(t.h), "Hours"], [String(t.m), "Minutes"], [String(t.s), "Seconds"]];
  return (
    <Sec id="countdown" label="Countdown" side={side} colClass={s.dark}>
      <div className={s.countdown}>
        <div className={s.cdMain}>
          <Head title="Countdown" sub="to forever has begun…" />
          {t.ended && t.ready ? (
            <p className={`${s.ended} ${rv(3)}`}>{t.endedText}</p>
          ) : (
            <div role="timer" aria-label="Time until the wedding" className={`${s.timer} ${rv(3)}`}>
              {units.map(([n, l], i) => (
                <div key={l} className={`${s.tile} ${i === 3 ? s.secs : ""}`}>
                  <Flip v={n} />
                  <div className={s.l}>{l}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className={s.cantwait}>
          <svg className={s.bigheart} viewBox="0 0 330 420" fill="none" aria-hidden="true" focusable="false"><path pathLength={1} d="M120 418 C 60 330, 20 250, 30 150 C 38 70, 70 30, 112 36 C 150 42, 162 100, 160 160 C 170 80, 210 6, 262 10 C 320 16, 330 90, 300 170 C 270 250, 200 330, 10 410" stroke="url(#wd-gold)" strokeWidth="10" strokeLinecap="round" /></svg>
          <Rings className={`${s.rings} ${rv()}`} />
          <p className={`${s.gold} ${rv(1)}`}>We can&apos;t wait<br />to celebrate<br />with you!</p>
        </div>
      </div>
    </Sec>
  );
}

// ---- 4. venue ------------------------------------------------------------------------------------
export function Venue({ side }: { side: string | null }) {
  const { d } = useWd();
  return (
    <Sec id="venue" label="Venue" side={side}>
      <div className={s.venue}>
        <Head title="Venue" sub="where we say I do" />
        <div className={s.vlist}>
          {d.venues.map((e, i) => {
            const name = e.venue || e.title;
            return (
              <article key={i} className={s.vcard}>
                <div className={`${s.arch} ${rv(1)}`}>
                  {e.photo ? (
                    <div className={`${s.archImg} ${s.par}`} role="img" aria-label={e.photo.alt} style={bgOf(e.photo.url)} />
                  ) : (
                    <div className={s.archEmpty} aria-hidden="true"><span className={s.gold}>{d.ini1}</span><i className={s.gold}>&amp;</i><span className={s.gold}>{d.ini2}</span></div>
                  )}
                </div>
                <div className={s.vtext}>
                  {e.label && <div className={`${s.kicker} ${rv(1)}`}>{e.label}</div>}
                  <h3 className={rv(1)}>{name}</h3>
                  {e.description && <p className={`${s.desc} ${rv(2)}`}>{e.description}</p>}
                  {e.address && e.address !== name && <p className={`${s.vaddr} ${rv(2)}`}>{e.address}</p>}
                  {(e.venue || e.address || e.mapUrl) && (
                    <a className={`${s.pill} ${s.maps} ${rv(3)}`} href={mapHref(e.mapUrl, e.venue, e.address)} target="_blank" rel="noopener noreferrer" aria-label={`Open ${name} in Google Maps (new tab)`}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" focusable="false"><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.4" /></svg>
                      Open in Maps
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </Sec>
  );
}

// ---- 5. the day (timeline) -----------------------------------------------------------------------
export function Day({ side }: { side: string | null }) {
  const { config: c, d } = useWd();
  return (
    <Sec id="day" label="The day" side={side}>
      <div className={s.day}>
        <Rings className={s.wm} />
        <Head title="Day" sub="how the celebration unfolds" after={<Rings className={`${s.headRings} ${rv(2)}`} />} />
        <ol className={s.tl}>
          {c.events.map((e, i) => (
            <li key={i} className={`${s.ev} ${rv(i % 3)}`}>
              <span className={s.ic}><Icon name={iconFor(e.title, i)} /></span>
              <span className={s.dot} aria-hidden="true" />
              <div>
                {d.rowTime(e) && <div className={s.evt}>{d.rowTime(e)}</div>}
                <div className={s.evn}>{e.title}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Sec>
  );
}

// ---- 6. details + story --------------------------------------------------------------------------
function Notes({ id, heading, sub, items, side, photo, aside, children }: { id: string; heading: string; sub?: string; items: { title: string; text: string }[]; side: string | null; photo?: string | null; aside?: ReactNode; children?: ReactNode }) {
  return (
    <Sec id={id} label={heading} side={side} className={s.details}>
      {photo && <div className={s.photo} aria-hidden="true" style={bgOf(photo)} />}
      <div className={s.wrap}>
        <Head title={heading} sub={sub} />
        {aside}
        {children}
        {items.map((x, i) => (
          <div key={i} className={s.detRow}>
            {i > 0 && <div className={`${s.vline} ${rv()}`} aria-hidden="true"><span /></div>}
            <div className={`${s.det} ${rv()}`}>{x.title && <h3>{x.title}</h3>}{x.text && <p>{x.text}</p>}</div>
          </div>
        ))}
      </div>
    </Sec>
  );
}

export function Details({ side }: { side: string | null }) {
  const { config: c } = useWd();
  const items = [
    ...(c.dressCode ? [{ title: "Dress Code", text: c.dressCode }] : []),
    ...c.events.filter((e) => e.venueNote).map((e) => ({ title: e.title, text: e.venueNote })),
  ];
  if (!items.length && !c.show.gift) return null;
  return (
    <Notes id="details" heading="Details" sub="a few things to know" items={items} side={side} photo={c.events.find((e) => e.photo)?.photo?.url ?? null}>
      {c.show.gift && (
        <a className={`${s.pill} ${s.reg} ${rv()}`} href="#gift" onClick={(e) => { e.preventDefault(); document.getElementById("gift")?.scrollIntoView({ behavior: "smooth" }); }}>Wedding Registry</a>
      )}
    </Notes>
  );
}

export function Story({ side }: { side: string | null }) {
  const { config: c } = useWd();
  if (!c.show.story) return null;
  const { title, body, chapters, photos } = c.story;
  const shots = photos.filter((p): p is NonNullable<typeof p> => !!p);
  return (
    <Notes
      id="story"
      heading={title || "Story"}
      sub="how it all began"
      items={chapters}
      side={side}
      aside={shots.length > 0 && <div className={`${s.pola} ${rv()}`}>{shots.map((p, i) => <figure key={i} className={s.polaShot}><div role="img" aria-label={p.alt} style={bgOf(p.url)} /></figure>)}</div>}
    >
      {body && <p className={`${s.storyBody} ${rv()}`}>{body}</p>}
    </Notes>
  );
}

// ---- gallery + lightbox --------------------------------------------------------------------------
export function Gallery({ side }: { side: string | null }) {
  const { config: c, engine } = useWd();
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
      <Sec id="gallery" label="Gallery" side={side} colClass={s.dark}>
        <div className={s.gal}>
          <Head title="Gallery" sub="moments we keep" />
          <ul className={s.grid}>
            {photos.map((p, i) => (
              <li key={i} className={`${s.cell} ${rv(i % 3)}`}>
                {p.url ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element -- signed, expiring API URL */}
                    <img src={p.url} alt="" loading="lazy" />
                    <button type="button" aria-label={`View photo ${i + 1} full screen${p.alt ? `: ${p.alt}` : ""}`} onClick={() => lb.open(i)} />
                  </>
                ) : (
                  <span className={s.cellCap}>{p.alt}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </Sec>
      {cur && (
        <div role="dialog" aria-modal="true" aria-label="Photo viewer" className={s.lb} onClick={(e) => e.target === e.currentTarget && lb.close()}>
          <figure>
            {cur.url ? (
              // eslint-disable-next-line @next/next/no-img-element -- signed, expiring API URL
              <img src={cur.url} alt={cur.alt} />
            ) : (
              <p>This photograph is unavailable.</p>
            )}
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
