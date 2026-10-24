"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useCountdown } from "@/lib/kit/behaviors/useCountdown";
import { useLightbox } from "@/lib/kit/behaviors/useLightbox";
import { mapHref } from "@/lib/kit/model";
import { createStore } from "@/lib/kit/store";
import { Icon, NoteIcon, PauseIcon, PlayIcon, Rings } from "./art";
import { iconFor } from "./derive";
import { useWd } from "./context";
import s from "./we-do.module.css";

/** Reveal classes: `rv(2)` = reveal with the second stagger step. */
export const rv = (step = 0) => (step ? `${s.rv} ${s[`d${step}`]}` : s.rv);
export const bgOf = (url?: string | null): CSSProperties => (url ? { backgroundImage: `url(${JSON.stringify(url)})` } : {});
const GRAY = "radial-gradient(60% 38% at 50% 24%,#a3a3a3,rgba(163,163,163,0) 70%),linear-gradient(170deg,#5a5a5a,#1c1c1c)";

/** A wide-screen row: faded backdrop photo + the 400px paper column. */
export function Sec({ id, label, side, className = "", colClass = "", children }: { id?: string; label?: string; side?: string | null; className?: string; colClass?: string; children: ReactNode }) {
  return (
    <section id={id} aria-label={label} className={`${s.sec} ${className}`}>
      {side && <div className={s.bg} aria-hidden="true" style={bgOf(side)} />}
      <div className={`${s.col} ${colClass}`}>{children}</div>
    </section>
  );
}
export const The = () => <span className={s.the} aria-hidden="true">the</span>;

// ---- 1. hero ----------------------------------------------------------------------------------
const LIGHTS: [number, number, number, number][] = [[20, 79, 3.2, 0], [62, 91, 3.4, 0.4], [110, 92, 3, 0.9], [152, 77, 3.5, 0.2], [198, 57, 3.2, 1.2], [244, 39, 3.4, 0.6], [292, 27, 3, 1.6], [340, 20, 3.4, 0.3], [98, 85, 2.6, 1.1], [182, 66, 2.8, 0.7], [270, 31, 2.6, 1.4], [372, 10, 3, 0.5]];

function Garland({ mirror }: { mirror?: boolean }) {
  return (
    <svg className={`${s.lights} ${mirror ? s.lightsR : ""}`} viewBox="0 0 400 110" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M0 70 Q90 105 190 60 T400 10" fill="none" stroke="#c9c2a8" strokeWidth=".8" opacity=".7" />
      <path d="M40 95 Q150 70 250 40 T400 0" fill="none" stroke="#c9c2a8" strokeWidth=".8" opacity=".6" />
      {LIGHTS.map(([x, y, r, delay], i) => <circle key={i} className={`${s.b} ${s.loop}`} cx={x} cy={y} r={r} style={{ animationDelay: `${delay}s` }} />)}
    </svg>
  );
}

export function Hero({ side }: { side: string | null }) {
  const { config: c, d } = useWd();
  const [first, ...rest] = c.heroTitle.split(/\s+/);
  const known = c.guestName !== "Our Beloved Guest";
  return (
    <section id="top" aria-label="Invitation" className={`${s.sec} ${s.hero}`}>
      {side && <div className={s.bg} aria-hidden="true" style={bgOf(side)} />}
      <div className={s.col}>
        <div className={s.photo} aria-hidden="true" style={{ background: GRAY, ...bgOf(c.heroPhoto?.url), backgroundSize: "cover", backgroundPosition: "center 30%" }} />
        <Garland />
        <Garland mirror />
        <div className={s.inner}>
          <div className={`${s.wedo} ${rv()}`}>
            <svg className={s.heart} viewBox="0 0 150 230" fill="none" aria-hidden="true" focusable="false">
              <path d="M70 228 C 62 200, 40 170, 22 120 C 6 76, 8 34, 34 22 C 58 12, 72 40, 74 62 C 78 34, 96 8, 120 14 C 146 22, 146 66, 126 112 C 110 150, 88 186, 52 214" stroke="#c6a979" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h1 className={s.wedoTxt}><span>{first}</span>{rest.length > 0 && <span>{rest.join(" ")}</span>}</h1>
          </div>
          {known && <div className={`${s.together} ${rv(1)}`} style={{ marginBottom: 6 }}>Dear {c.guestName}</div>}
          <div className={`${s.together} ${rv(1)}`}>{c.together}</div>
          <div className={`${s.names} ${rv(1)}`}><span>{c.partnerOne}</span><i>and</i><span>{c.partnerTwo}</span></div>
          <div className={`${s.invite} ${rv(2)}`}>{c.inviteLine}</div>
          {d.dayNum && (
            <div className={`${s.dateblock} ${rv(3)}`}>
              <div className={s.side}>{d.dayName}</div>
              <div className={s.mid}><div className={s.m}>{d.monthName}</div><div className={s.d}>{d.dayNum}</div><div className={s.y}>{d.year}</div></div>
              <div className={s.side}>{d.timeText}</div>
            </div>
          )}
          {c.address && <div className={`${s.addr} ${rv(4)}`}>{c.address}</div>}
          {c.heroLine && <p className={`${s.line} ${rv(4)}`}>{c.heroLine}</p>}
        </div>
        <div className={s.scrollhint} aria-hidden="true" />
      </div>
    </section>
  );
}

// ---- 2. music player + floating button -----------------------------------------------------------
export function Player({ side }: { side: string | null }) {
  const { config: c, music } = useWd();
  const [passed, setPassed] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setPassed(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  if (!c.show.music || !music.track) return null;
  const playing = music.state === "playing";
  const label = playing ? "Pause music" : music.state === "loading" ? "Loading music" : music.state === "error" ? "Music unavailable. Tap to try again." : "Play music";
  return (
    <>
      <Sec id="music" label="Music" side={side}>
        <div ref={ref} className={s.player}>
          <div className={rv()}>
            <button type="button" className={s.play} onClick={music.toggle} aria-label={label} aria-pressed={playing}>{playing ? <PauseIcon /> : <PlayIcon />}</button>
          </div>
          <div className={`${s.bar} ${rv(1)}`} aria-hidden="true"><span className={playing ? `${s.on} ${s.loop}` : ""} /></div>
          <div className={`${s.track} ${rv(1)}`}>{music.track.title}{music.track.credit ? ` · ${music.track.credit}` : ""}</div>
          <span role="status" className={s.sr}>{music.state === "error" ? "The music could not be loaded." : ""}</span>
        </div>
      </Sec>
      <button type="button" className={`${s.fab} ${passed ? s.show : ""} ${playing ? s.spin : ""}`} onClick={music.toggle} aria-label={label} aria-pressed={playing} tabIndex={passed ? 0 : -1}><NoteIcon /></button>
    </>
  );
}

// ---- 3. countdown --------------------------------------------------------------------------------
export function Countdown({ side }: { side: string | null }) {
  const { config: c } = useWd();
  const t = useCountdown(c.weddingDate);
  const days = t.d === "—" ? "—" : t.d > 99 ? String(t.d) : String(t.d).padStart(2, "0");
  const unit = (n: string, l: string, extra = "") => (
    <>
      <div className={s.u}><div className={`${s.n} ${extra}`}>{n}</div><div className={s.l}>{l}</div></div>
    </>
  );
  return (
    <Sec id="countdown" label="Countdown" side={side}>
      <div className={s.countdown}>
        <div className={s.cdMain}>
        <div className={rv()}><The /></div>
        <h2 className={`${s.title} ${rv(1)}`}>Countdown</h2>
        <div className={`${s.sub} ${rv(2)}`}>to forever has begun...</div>
        {t.ended && t.ready ? (
          <p className={`${s.ended} ${rv(3)}`}>{t.endedText}</p>
        ) : (
          <div role="timer" aria-label="Time until the wedding" className={`${s.timer} ${rv(3)}`}>
            {unit(days, "Days")}<div className={s.c} aria-hidden="true">:</div>
            {unit(t.h, "Hours")}<div className={s.c} aria-hidden="true">:</div>
            {unit(t.m, "Minutes")}<div className={s.c} aria-hidden="true">:</div>
            {unit(t.s, "Seconds", s.secs)}
          </div>
        )}
        </div>
        <div className={s.cantwait}>
          <svg className={s.bigheart} viewBox="0 0 330 420" fill="none" aria-hidden="true" focusable="false"><path d="M120 418 C 60 330, 20 250, 30 150 C 38 70, 70 30, 112 36 C 150 42, 162 100, 160 160 C 170 80, 210 6, 262 10 C 320 16, 330 90, 300 170 C 270 250, 200 330, 10 410" stroke="var(--k-accent-soft)" strokeWidth="16" strokeLinecap="round" opacity=".6" /></svg>
          <Rings className={`${s.rings} ${rv()}`} />
          <p className={rv(1)}>We can&apos;t wait<br />to celebrate<br />with you!</p>
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
        <div className={rv()}><The /></div>
        <h2 className={`${s.title} ${rv(1)}`}>Venue</h2>
        <div className={s.vlist}>
        {d.venues.map((e, i) => {
          const name = e.venue || e.title;
          return (
            <div key={i} className={i ? s.moreVenue : undefined}>
              {e.label && <div className={`${s.kicker} ${rv(1)}`}>{e.label}</div>}
              <h3 className={rv(1)}>{name}</h3>
              {(e.description || e.address) && <p className={`${s.desc} ${rv(2)}`}>{e.description || e.address}</p>}
              {e.photo && <div className={`${s.ph} ${rv(2)}`} role="img" aria-label={e.photo.alt} style={bgOf(e.photo.url)} />}
              {(e.venue || e.address || e.mapUrl) && (
                <a className={`${s.pill} ${s.maps} ${rv(3)}`} href={mapHref(e.mapUrl, e.venue, e.address)} target="_blank" rel="noopener noreferrer" aria-label={`Open ${name} in Google Maps (new tab)`}>
                  <span className={s.pin} aria-hidden="true"><svg width="26" height="34" viewBox="0 0 24 32"><path d="M12 0C5.4 0 0 5.3 0 11.9 0 20.8 12 32 12 32s12-11.2 12-20.1C24 5.3 18.6 0 12 0z" fill="#000" /><circle cx="12" cy="11.5" r="4.5" fill="#fff" /></svg></span>
                  Google Maps
                </a>
              )}
            </div>
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
        <div className={`${s.dayHead} ${rv()}`}>
          <div><The /><h2 className={s.title}>Day</h2></div>
          <Rings />
        </div>
        <ol className={s.tl}>
          {c.events.map((e, i) => (
            <li key={i} className={`${s.ev} ${rv(i % 3)}`}>
              <Icon name={iconFor(e.title, i)} className={s.ic} />
              <div className={s.dot} aria-hidden="true" />
              <div>{d.rowTime(e) && <div className={s.evt}>{d.rowTime(e)}</div>}<div className={s.evn}>{e.title}</div></div>
            </li>
          ))}
        </ol>
      </div>
    </Sec>
  );
}

// ---- 6. details + story --------------------------------------------------------------------------
function Notes({ id, heading, items, side, photo, children }: { id: string; heading: string; items: { title: string; text: string }[]; side: string | null; photo?: string | null; children?: ReactNode }) {
  return (
    <Sec id={id} label={heading} side={side} className={s.details}>
      {photo && <div className={s.photo} aria-hidden="true" style={bgOf(photo)} />}
      <div className={s.wrap}>
        <div className={`${s.hd} ${rv()}`}><The /><h2 className={s.title}>{heading}</h2></div>
        {children}
        {items.map((x, i) => (
          <div key={i}>
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
    <Notes id="details" heading="Details" items={items} side={side} photo={c.events.find((e) => e.photo)?.photo?.url ?? null}>
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
    <Notes id="story" heading={title || "Story"} items={chapters} side={side}>
      {shots.length > 0 && <div className={`${s.pair} ${rv()}`}>{shots.map((p, i) => <div key={i} className={s.shot} role="img" aria-label={p.alt} style={bgOf(p.url)} />)}</div>}
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
      <Sec id="gallery" label="Gallery" side={side}>
        <div className={s.gal}>
          <div className={rv()}><The /></div>
          <h2 className={`${s.title} ${rv(1)}`}>Gallery</h2>
          <ul className={s.grid}>
            {photos.map((p, i) => (
              <li key={i} className={`${s.cell} ${rv(i % 3)}`}>
                {p.url && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element -- signed, expiring API URL */}
                    <img src={p.url} alt="" loading="lazy" />
                    <button type="button" aria-label={`View photo ${i + 1} full screen${p.alt ? `: ${p.alt}` : ""}`} onClick={() => lb.open(i)} />
                  </>
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
