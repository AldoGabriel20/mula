// @ts-nocheck
/* eslint-disable */
"use client";
// Ported from docs/dashboard-admin-prototype "Mula Admin v3" (lines 280–409). `v` is the prototype's renderVals() object (bound as V so prototype loop variables named v still work).
import { Fragment } from "react";

export function HomeView({ v: V }: { v: any }) {
  return (
    <>
      {V.p.home && (
        <>
          {V.freshHome && (
            <>
              <div className="stg" style={{ display: "grid", gap: "56px" }}>
                <section className="hero">
                  <div style={{ display: "grid", gap: "24px", alignContent: "center" }}>
                    <div className="eb">Welcome to Mula, {V.me.first}</div>
                    <h1 className="d1">
                      Something
                      <br />
                      <span className="it" style={{ color: "var(--dot)" }}>
                        meaningful
                      </span>
                      <br />
                      begins here.
                    </h1>
                    <p className="lede">Tell us what you’re celebrating. Your invitation takes shape as you answer, and you can refine every detail later.</p>
                    <div className="row">
                      <button className="btn btn-p" onClick={V.openOb}>
                        Let’s begin
                      </button>
                      <button className="btn" data-p="design" onClick={V.go}>
                        Browse designs first
                      </button>
                    </div>
                    <ol style={{ listStyle: "none", margin: "16px 0 0", padding: "0", display: "grid", gap: "0", maxWidth: "520px" }}>
                      <li className="row" style={{ padding: "14px 0", borderTop: "1px solid var(--line)", flexWrap: "nowrap", gap: "18px" }}>
                        <span className="num" style={{ fontSize: "28px", color: "var(--dot)" }}>
                          1
                        </span>
                        <span>
                          <b style={{ fontWeight: "500" }}>Your celebration</b>
                          <br />
                          <span className="sm mut">What it is, whose it is, when and where</span>
                        </span>
                      </li>
                      <li className="row" style={{ padding: "14px 0", borderTop: "1px solid var(--line)", flexWrap: "nowrap", gap: "18px" }}>
                        <span className="num" style={{ fontSize: "28px", color: "var(--dot)" }}>
                          2
                        </span>
                        <span>
                          <b style={{ fontWeight: "500" }}>Your invitation</b>
                          <br />
                          <span className="sm mut">A design and the words guests will read</span>
                        </span>
                      </li>
                      <li className="row" style={{ padding: "14px 0", borderTop: "1px solid var(--line)", flexWrap: "nowrap", gap: "18px" }}>
                        <span className="num" style={{ fontSize: "28px", color: "var(--dot)" }}>
                          3
                        </span>
                        <span>
                          <b style={{ fontWeight: "500" }}>Your guests</b>
                          <br />
                          <span className="sm mut">The people you would love to see there</span>
                        </span>
                      </li>
                    </ol>
                  </div>
                  <div className="stage hero-stage" onMouseMove={V.tiltMove} onMouseLeave={V.tiltOut} onClick={V.openOb}>
                    <div className="halo"></div>
                    <div className="halo-dot"></div>
                    <div className="tilt inv-obj" style={{ background: "var(--sf)", border: "1px dashed var(--line2)", boxShadow: "none" }}>
                      <div className="inv-photo arch" style={{ border: "1px dashed var(--line2)", color: "var(--mut)" }}>
                        Your photo
                      </div>
                      <div className="lay2">
                        <div className="eb">You are invited</div>
                        <div className="serif" style={{ fontSize: "34px", lineHeight: "1.05", margin: "10px 0", color: "var(--mut)" }}>
                          Your names
                          <br />
                          here
                        </div>
                        <div className="xs mut" style={{ letterSpacing: ".2em" }}>
                          — · — · ——
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </>
          )}
          {V.fullHome && (
            <>
              <div className="stg" style={{ display: "grid", gap: "clamp(56px,8vw,104px)" }}>
                <section className="hero">
                  <div style={{ display: "grid", gap: "22px", alignContent: "center" }}>
                    <div className="eb">{V.greeting}</div>
                    <h1 className="d1">
                      <span>{V.ev.a}</span>
                      <br />
                      {V.ev.amp && (
                        <>
                          <span className="it" style={{ color: "var(--dot)" }}>
                            &amp;&#8202;
                          </span>
                        </>
                      )}
                      <span>{V.ev.b}</span>
                    </h1>
                    <p className="serif it" style={{ fontSize: "clamp(20px,2vw,27px)", margin: "0", color: "var(--ink2)", fontWeight: "300" }}>
                      {V.ev.tag}
                    </p>
                    <div className="row sm mut" style={{ gap: "8px 14px" }}>
                      <span>{V.ev.type}</span>
                      <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "var(--dot)" }}></span>
                      <span>{V.ev.date}</span>
                      <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "var(--dot)" }}></span>
                      <span>{V.ev.city}</span>
                    </div>
                    <div className="row" style={{ gap: "28px", marginTop: "14px", alignItems: "flex-end", flexWrap: "nowrap" }}>
                      <div>
                        <div className="num" style={{ fontSize: "clamp(60px,6.6vw,96px)" }} data-count={V.ev.days}>
                          {V.ev.days}
                        </div>
                        <div className="sm mut" style={{ marginTop: "6px" }}>
                          {V.L.days}
                        </div>
                      </div>
                      <div style={{ width: "1px", height: "84px", background: "var(--line2)" }}></div>
                      <div>
                        <div className="num" style={{ fontSize: "clamp(60px,6.6vw,96px)" }}>
                          <span data-count={V.ev.ready}>{V.ev.ready}</span>
                          <span style={{ fontSize: ".42em", color: "var(--dot)" }}>%</span>
                        </div>
                        <div className="sm mut" style={{ marginTop: "6px" }}>
                          {V.L.ready}
                        </div>
                      </div>
                    </div>
                    <div className="row" style={{ marginTop: "8px" }}>
                      <button className="btn btn-p" onClick={V.openPreview}>
                        {V.L.prev}
                      </button>
                      <button className="btn" data-p="invitations" onClick={V.go}>
                        {V.L.cont}
                      </button>
                    </div>
                  </div>
                  <div
                    className="stage hero-stage"
                    onMouseMove={V.tiltMove}
                    onMouseLeave={V.tiltOut}
                    onClick={V.openPreview}
                    role="button"
                    aria-label="Open invitation preview"
                  >
                    <div className="halo"></div>
                    <div className="halo-dot"></div>
                    <div className="tilt inv-obj" style={{ background: V.pv.bg, color: V.pv.fg }}>
                      <div className="inv-photo arch" style={{ background: V.pv.photo }}>
                        Cover photo
                      </div>
                      <div className="lay2">
                        <div className="xs" style={{ letterSpacing: ".16em", textTransform: "uppercase", opacity: ".7" }}>
                          {V.ev.greet}
                        </div>
                        <div style={{ fontFamily: V.pv.font, fontSize: "36px", lineHeight: "1.02", margin: "10px 0 12px" }}>
                          {V.ev.a}
                          <br />
                          {V.ev.amp && (
                            <>
                              <span className="it" style={{ color: V.pv.ac }}>
                                &amp;
                              </span>
                            </>
                          )}
                          {V.ev.b}
                        </div>
                        <div className="xs" style={{ letterSpacing: ".24em", opacity: ".8" }}>
                          {V.ev.dshort}
                        </div>
                      </div>
                      <div className="sheen"></div>
                    </div>
                    <div className="xs mut" style={{ position: "absolute", bottom: "0", letterSpacing: ".08em" }}>
                      Live preview · tap to open
                    </div>
                  </div>
                </section>
                <section className="duo">
                  <div>
                    <div className="row sb">
                      <div className="eb">{V.L.readiness}</div>
                      <span className="xs mut">Updated just now</span>
                    </div>
                    <div style={{ position: "relative", maxWidth: "340px", margin: "22px 0 10px" }}>
                      <svg
                        viewBox="0 0 240 136"
                        style={{ width: "100%", display: "block", overflow: "visible" }}
                        role="img"
                        aria-label={`${V.ev.ready} percent ready`}
                      >
                        <path d="M16 124 A104 104 0 0 1 224 124" fill="none" stroke="var(--line)" strokeWidth="10" strokeLinecap="round"></path>
                        <path
                          d="M16 124 A104 104 0 0 1 224 124"
                          fill="none"
                          stroke="var(--ink)"
                          strokeWidth="10"
                          strokeLinecap="round"
                          pathLength="100"
                          strokeDasharray={V.arch.dash}
                          style={{ animation: "draw 1.8s var(--eo) both .2s" }}
                        ></path>
                        <circle
                          cx={V.arch.x}
                          cy={V.arch.y}
                          r="11"
                          fill="var(--dot)"
                          stroke="var(--bg)"
                          strokeWidth="4"
                          style={{ animation: "pop .7s var(--sp) both 1.6s", transformBox: "fill-box", transformOrigin: "center" }}
                        ></circle>
                      </svg>
                      <div style={{ position: "absolute", left: "0", right: "0", bottom: "0", textAlign: "center" }}>
                        <div className="num" style={{ fontSize: "64px" }}>
                          <span data-count={V.ev.ready}>{V.ev.ready}</span>
                          <span style={{ fontSize: ".4em", color: "var(--dot)" }}>%</span>
                        </div>
                        <div className="sm mut">Your celebration is almost ready</div>
                      </div>
                    </div>
                    <div style={{ marginTop: "18px" }}>
                      {V.parts.map((r, _i) => (
                        <Fragment key={_i}>
                          <button className="part" data-p={r.go} onClick={V.go}>
                            <span>{r.n}</span>
                            <span style={{ display: "grid", gap: "5px" }}>
                              <span className="bar">
                                <i style={{ width: r.w }}></i>
                              </span>
                              <span className="xs mut">{r.note}</span>
                            </span>
                            <span className="sm" style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                              {r.v}
                            </span>
                          </button>
                        </Fragment>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="row sb" style={{ marginBottom: "18px" }}>
                      <div className="eb">{V.L.notes}</div>
                      <button className="btn btn-t btn-s" data-v="readiness" onClick={V.openAi}>
                        <svg className="ic" viewBox="0 0 20 20" style={{ width: "15px", color: "var(--dotd)" }}>
                          <path d={V.ic.ai}></path>
                        </svg>
                        Ask Mula AI
                      </button>
                    </div>
                    {V.notes.map((n, _i) => (
                      <Fragment key={_i}>
                        <article className={n.cls}>
                          <div className="eb" style={{ color: "var(--dotd)" }}>
                            {n.k}
                          </div>
                          <h2 className="h2">{n.t}</h2>
                          <p className="sm mut" style={{ margin: "0" }}>
                            {n.s}
                          </p>
                          <div className="row" style={{ marginTop: "6px" }}>
                            <button className="btn btn-p btn-s" data-v={n.id} onClick={V.noteAct}>
                              {n.a}
                            </button>
                            <button className="btn btn-t btn-s" data-v={n.id} onClick={V.noteLater}>
                              Later
                            </button>
                          </div>
                        </article>
                      </Fragment>
                    ))}
                    {V.noNotes && (
                      <>
                        <div className="note lead" style={{ textAlign: "center", justifyItems: "center" }}>
                          <div className="h2">You’re all caught up.</div>
                          <p className="sm mut" style={{ margin: "0" }}>
                            We’ll leave a note here when something needs you.
                          </p>
                          <button className="btn btn-t btn-s" onClick={V.resetNotes}>
                            Show earlier notes
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </section>
                <section>
                  <div className="row sb" style={{ alignItems: "flex-end", gap: "20px" }}>
                    <div>
                      <div className="eb">Guest response</div>
                      <h2 className="h1" style={{ marginTop: "12px" }}>
                        <span data-count={V.resp.confirmed}>{V.resp.confirmed}</span> {V.resp.confirmed === 1 ? "person is" : "people are"} coming.
                      </h2>
                    </div>
                    <button className="btn" data-p="guests" onClick={V.go}>
                      Open guest list
                    </button>
                  </div>
                  <div style={{ display: "flex", height: "10px", borderRadius: "99px", overflow: "hidden", gap: "3px", marginTop: "26px" }}>
                    <div style={{ flex: V.resp.confirmed || 0, background: "var(--ink)", transformOrigin: "left", animation: "grow 1.4s var(--eo) both" }}></div>
                    <div style={{ flex: V.resp.waiting || 0, background: "var(--dot)", transformOrigin: "left", animation: "grow 1.4s var(--eo) both .15s" }}></div>
                    <div style={{ flex: V.resp.declined || 0, background: "var(--line2)", transformOrigin: "left", animation: "grow 1.4s var(--eo) both .3s" }}></div>
                  </div>
                  <div className="row sm" style={{ gap: "8px 26px", marginTop: "12px" }}>
                    <span>
                      <b style={{ fontWeight: "600" }}>{V.resp.confirmed}</b> <span className="mut">confirmed</span>
                    </span>
                    <span>
                      <b style={{ fontWeight: "600" }}>{V.resp.waiting}</b> <span className="mut">waiting to reply</span>
                    </span>
                    <span>
                      <b style={{ fontWeight: "600" }}>{V.resp.declined}</b> <span className="mut">can’t make it</span>
                    </span>
                    <span className="mut">of {V.resp.total} invited</span>
                  </div>
                  <div className="jr" aria-label="Guest journey">
                    {V.journey.map((j, _i) => (
                      <Fragment key={_i}>
                        <div className={j.cls}>
                          <span className="jarc"></span>
                          <div className="eb">{j.n}</div>
                          <div className="num" style={{ fontSize: "clamp(30px,3vw,42px)", margin: "8px 0 4px" }}>
                            {j.v}
                          </div>
                          <div className="xs mut">{j.s}</div>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                </section>
                <section>
                  <div className="row sb">
                    <div className="eb">
                      The road to {V.ev.day} {V.ev.mon}
                    </div>
                    <button className="btn btn-t btn-s" data-p="todo" onClick={V.go}>
                      All tasks
                    </button>
                  </div>
                  <div className="tl">
                    <div className="tl-line"></div>
                    <div className="tl-fill" style={{ width: "18%" }}></div>
                    {V.ms.map((m, _i) => (
                      <Fragment key={_i}>
                        <div className={m.cls} style={{ left: m.x }}>
                          <span className="md xs mut">{m.d}</span>
                          <span className="mk"></span>
                          <span className="lb sm">{m.l}</span>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                  <div className="row" style={{ gap: "8px", marginTop: "22px" }}>
                    <span className="xs mut" style={{ marginRight: "6px" }}>
                      Done lately
                    </span>
                    {V.recent.map((r, _i) => (
                      <Fragment key={_i}>
                        <span className="tick">{r.t}</span>
                      </Fragment>
                    ))}
                  </div>
                </section>
                <section className="duo">
                  <div>
                    <div className="row sb" style={{ marginBottom: "8px" }}>
                      <div className="eb">On the day</div>
                      <button className="btn btn-t btn-s" data-p="events" onClick={V.go}>
                        Edit schedule
                      </button>
                    </div>
                    {!V.schedule.length && (
                      <div className="sm mut" style={{ borderTop: "1px solid var(--line)", padding: "16px 0" }}>
                        Add your first moment to see the day take shape.
                      </div>
                    )}
                    {V.schedule.map((s, _i) => (
                      <Fragment key={_i}>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "92px minmax(0,1fr)",
                            gap: "18px",
                            padding: "16px 0",
                            borderTop: "1px solid var(--line)",
                          }}
                        >
                          <div className="num" style={{ fontSize: "30px" }}>
                            {s.s}
                          </div>
                          <div>
                            <div style={{ fontWeight: "500" }}>{s.name}</div>
                            <div className="sm mut">{s.venue}</div>
                          </div>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                  <div>
                    <div className="row sb" style={{ marginBottom: "8px" }}>
                      <div className="eb">Around the workspace</div>
                      <button className="btn btn-t btn-s" data-p="team" onClick={V.go}>
                        Team
                      </button>
                    </div>
                    {!V.activity.length && (
                      <div className="sm mut" style={{ borderTop: "1px solid var(--line)", padding: "16px 0" }}>
                        Replies and updates from your guests and team show up here.
                      </div>
                    )}
                    {V.activity.map((a, _i) => (
                      <Fragment key={_i}>
                        <div className="row" style={{ padding: "14px 0", borderTop: "1px solid var(--line)", flexWrap: "nowrap", gap: "14px" }}>
                          <span className="av" style={{ background: a.c, border: "0" }}>
                            {a.i}
                          </span>
                          <span style={{ flex: "1", minWidth: "0" }} className="sm">
                            <b style={{ fontWeight: "600" }}>{a.n}</b> {a.w}
                          </span>
                          <span className="xs mut" style={{ whiteSpace: "nowrap" }}>
                            {a.t}
                          </span>
                        </div>
                      </Fragment>
                    ))}
                    <div className="row" style={{ marginTop: "18px", gap: "8px" }}>
                      <button className="btn btn-s" onClick={V.openAddGuest}>
                        Add guest
                      </button>
                      <button className="btn btn-s" data-p="checkin" onClick={V.go}>
                        QR codes
                      </button>
                      <button className="btn btn-s" data-p="eventday" onClick={V.go}>
                        Rehearse event day
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
