// @ts-nocheck
/* eslint-disable */
"use client";
// Ported from docs/dashboard-admin-prototype "Mula Admin v3" (lines 984–1124). `v` is the prototype's renderVals() object (bound as V so prototype loop variables named v still work).
import { Fragment } from "react";

export function OverlaysView({ v: V }: { v: any }) {
  return (
    <>
      <nav className="bnav" aria-label="Primary">
        {V.bnav.map((b, _i) => (
          <Fragment key={_i}>
            <button className={b.on} data-p={b.id} onClick={b.fn}>
              <svg className="ic" viewBox="0 0 20 20" style={{ width: "20px", height: "20px" }}>
                <path d={b.ic}></path>
              </svg>
              {b.n}
            </button>
          </Fragment>
        ))}
      </nav>
      {V.moreOpen && (
        <>
          <div className="scrim" style={{ placeItems: "end center", padding: "0" }} onClick={V.closeAll}>
            <div
              className="mod"
              style={{ borderRadius: "26px 26px 0 0", width: "100%", maxWidth: "640px", padding: "22px 20px calc(24px + env(safe-area-inset-bottom))" }}
              onClick={V.stop}
            >
              <div style={{ width: "40px", height: "4px", borderRadius: "9px", background: "var(--line2)", margin: "0 auto 18px" }}></div>
              <div className="row sb" style={{ marginBottom: "14px" }}>
                <span>
                  <img className="logo-l" src="/brand/admin/mula-lockup-ink.png" alt="mula" style={{ height: "24px" }} />
                  <img className="logo-d" src="/brand/admin/mula-lockup-light.png" alt="mula" style={{ height: "24px" }} />
                </span>
                <button className="btn btn-t btn-i" onClick={V.toggleTheme} aria-label="Switch light or dark">
                  <svg className="ic" viewBox="0 0 20 20">
                    <path d={V.themeIc}></path>
                  </svg>
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "8px" }}>
                {V.allNav.map((n, _i) => (
                  <Fragment key={_i}>
                    <button className="btn" style={{ justifyContent: "flex-start", borderRadius: "14px" }} data-p={n.id} onClick={V.go}>
                      {n.label}
                    </button>
                  </Fragment>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
      {V.notifOpen && (
        <>
          <div style={{ position: "fixed", inset: "0", zIndex: "49" }} onClick={V.toggleNotif}></div>
          <div className="pan" role="dialog" aria-label="Updates">
            <div className="row sb" style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
              <b style={{ fontWeight: "500" }}>Updates</b>
              <button className="btn btn-t btn-s" onClick={V.readAll}>
                Mark all as read
              </button>
            </div>
            {V.notifs.map((n, _i) => (
              <Fragment key={_i}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--line)", display: "flex", gap: "12px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", marginTop: "7px", flex: "none", background: n.dot }}></span>
                  <div>
                    <div className="sm">{n.t}</div>
                    <div className="xs mut">{n.w}</div>
                  </div>
                </div>
              </Fragment>
            ))}
          </div>
        </>
      )}
      {V.searchOpen && (
        <>
          <div className="scrim" style={{ alignItems: "start", paddingTop: "12vh" }} onClick={V.closeAll}>
            <div className="mod" style={{ padding: "10px", width: "min(600px,100%)" }} onClick={V.stop} role="dialog" aria-label="Search">
              <div className="row" style={{ flexWrap: "nowrap", padding: "0 8px" }}>
                <svg className="ic" viewBox="0 0 20 20" style={{ color: "var(--mut)" }}>
                  <path d={V.ic.search}></path>
                </svg>
                <input
                  className="inp"
                  style={{ border: "0", boxShadow: "none", background: "transparent", fontSize: "17px", minHeight: "52px" }}
                  autoFocus
                  placeholder="Guests, moments, tasks, payments, guides…"
                  value={V.sq}
                  onChange={V.setSq}
                  aria-label="Search everything"
                />
                <kbd className="xs mut" style={{ border: "1px solid var(--line)", borderRadius: "6px", padding: "2px 6px" }}>
                  esc
                </kbd>
              </div>
              <div style={{ borderTop: "1px solid var(--line)", paddingTop: "6px" }}>
                {V.sres.map((r, _i) => (
                  <Fragment key={_i}>
                    <button className="nv" style={{ minHeight: "48px" }} data-p={r.go} onClick={V.go}>
                      <span>{r.t}</span>
                      <span className="nb">{r.k}</span>
                    </button>
                  </Fragment>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
      {V.modalGuest && (
        <>
          <div className="scrim" onClick={V.closeAll}>
            <form className="mod" onClick={V.stop} onSubmit={V.addGuest} style={{ display: "grid", gap: "16px" }} aria-label="Add guest">
              <div>
                <div className="eb">Guest list</div>
                <h2 className="h1" style={{ fontSize: "34px", marginTop: "8px" }}>
                  Who would you love to see?
                </h2>
              </div>
              <label className="f">
                Name
                <input className="inp" required autoFocus data-k="name" value={V.ng.name} onChange={V.setNg} autoComplete="off" />
              </label>
              <label className="f">
                Phone or WhatsApp
                <input className="inp" type="tel" placeholder="+62" data-k="phone" value={V.ng.phone} onChange={V.setNg} />
              </label>{" "}
              <label className="f">
                Group
                <select className="inp" data-k="group" onChange={V.setNg}>
                  <option>Friends</option>
                  <option>Family</option>
                  <option>Colleagues</option>
                  <option>VIP</option>
                </select>
              </label>
              <div className="row" style={{ justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-t" onClick={V.closeAll}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-p">
                  Add guest
                </button>
              </div>
            </form>
          </div>
        </>
      )}
      {V.guestOpen && (
        <>
          <div className="scrim" style={{ padding: "0", background: "rgba(12,11,10,.3)" }} onClick={V.closeAll}></div>
          <aside className="drw" role="dialog" aria-label="Guest details" style={{ display: "grid", gap: "22px", alignContent: "start" }}>
            <div className="row sb">
              <span className="eb">Guest</span>
              <button className="btn btn-t btn-s" onClick={V.closeAll}>
                Close
              </button>
            </div>
            <div className="row" style={{ gap: "16px", flexWrap: "nowrap" }}>
              <span className="av" style={{ background: V.gd.c, border: "0", width: "56px", height: "56px", fontSize: "18px" }}>
                {V.gd.i}
              </span>
              <div>
                <h2 className="h1" style={{ fontSize: "34px" }}>
                  {V.gd.name}
                </h2>
                <div className="row" style={{ marginTop: "8px", gap: "6px" }}>
                  <span className={`bdg ${V.gd.cls}`}>{V.gd.st}</span>
                  <span className="bdg b-mu">{V.gd.group}</span>
                </div>
              </div>
            </div>
            <div style={{ display: "grid", paddingLeft: "6px" }}>
              {V.gd.jr.map((j, _i) => (
                <Fragment key={_i}>
                  <div className={j.on} style={{ padding: "0 0 18px 24px", borderLeft: "1.5px solid var(--line2)", marginLeft: "5px" }}>
                    <div style={{ fontWeight: "500", fontSize: "14px", marginTop: "-4px" }}>{j.n}</div>
                    <div className="xs mut">{j.w}</div>
                  </div>
                </Fragment>
              ))}
            </div>
            <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "10px 20px", margin: "0", fontSize: "14px" }}>
              <dt className="mut">Contact</dt>
              <dd style={{ margin: "0" }}>{V.gd.phone}</dd>
              <dt className="mut">Coming as</dt>
              <dd style={{ margin: "0" }}>{V.gd.plus}</dd>
              <dt className="mut">Table</dt>
              <dd style={{ margin: "0" }}>{V.gd.table}</dd>
              <dt className="mut">Delivery</dt>
              <dd style={{ margin: "0" }}>WhatsApp · delivered</dd>
            </dl>
            <label className="f">
              Notes
              <textarea className="inp" data-f="notes" placeholder="Dietary needs, seating, anything to remember" defaultValue={V.gd.note} />
            </label>
            <div>
              <div className="xs mut" style={{ marginBottom: "8px" }}>
                Change reply
              </div>
              <div className="row" style={{ gap: "6px" }}>
                {V.stOpts.map((s, _i) => (
                  <Fragment key={_i}>
                    <button className={s.on} data-v={s.s} onClick={V.setGSt}>
                      {s.s}
                    </button>
                  </Fragment>
                ))}
              </div>
            </div>
            <div className="row">
              <button className="btn btn-p" onClick={V.resend}>
                Resend invitation
              </button>
              <button className="btn" onClick={V.saveGuest}>
                Save
              </button>
            </div>
          </aside>
        </>
      )}
      {V.txOpen && (
        <>
          <div className="scrim" onClick={V.closeAll}>
            <div className="mod" onClick={V.stop} style={{ display: "grid", gap: "14px" }} role="dialog" aria-label="Receipt">
              <img className="logo-l" src="/brand/admin/mula-lockup-ink.png" alt="mula" style={{ height: "22px" }} />
              <img className="logo-d" src="/brand/admin/mula-lockup-light.png" alt="mula" style={{ height: "22px" }} />
              <div className="eb" style={{ marginTop: "8px" }}>
                Receipt · {V.tx.id}
              </div>
              <h2 className="h1" style={{ fontSize: "32px" }}>
                {V.tx.desc}
              </h2>
              <dl
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  gap: "10px 20px",
                  margin: "0",
                  fontSize: "14px",
                  borderTop: "1px solid var(--line)",
                  paddingTop: "14px",
                }}
              >
                <dt className="mut">Date</dt>
                <dd style={{ margin: "0" }}>{V.tx.date}</dd>
                <dt className="mut">Paid with</dt>
                <dd style={{ margin: "0" }}>{V.tx.method}</dd>
                <dt className="mut">Status</dt>
                <dd style={{ margin: "0" }}>
                  <span className={`bdg ${V.tx.cls}`}>{V.tx.st}</span>
                </dd>
              </dl>
              <div className="row sb" style={{ borderTop: "1px solid var(--line)", paddingTop: "14px" }}>
                <span className="mut">Total</span>
                <span className="num" style={{ fontSize: "36px" }}>
                  {V.tx.amt}
                </span>
              </div>
              <div className="row">
                <button className="btn btn-p" onClick={V.dlInv}>
                  Download invoice
                </button>
                <button className="btn btn-t" onClick={V.closeAll}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      {V.previewOpen && (
        <>
          <div className="pvw" role="dialog" aria-label="Invitation preview">
            <div
              className="row"
              style={{ padding: "14px 20px", gap: "12px", justifyContent: "space-between", borderBottom: "1px solid rgba(238,233,223,.08)" }}
            >
              <div className="row" style={{ gap: "12px" }}>
                <img src="/brand/admin/mula-symbol-light.png" alt="mula" style={{ height: "24px" }} />
                <div className="seg dk">
                  {V.persps.map((d, _i) => (
                    <Fragment key={_i}>
                      <button className={d.on} data-v={d.n} onClick={V.setPersp}>
                        {d.n} view
                      </button>
                    </Fragment>
                  ))}
                </div>
              </div>
              <div className="row" style={{ gap: "10px" }}>
                <div className="seg dk" aria-label="Invitation language">
                  {V.pvLangs.map((l, _i) => (
                    <Fragment key={_i}>
                      <button className={l.on} data-v={l.k} onClick={V.setPlang} style={{ padding: "0 11px" }}>
                        {l.n}
                      </button>
                    </Fragment>
                  ))}
                </div>
                <div className="seg dk">
                  {V.devs.map((d, _i) => (
                    <Fragment key={_i}>
                      <button className={d.on} data-v={d.n} onClick={V.setDev}>
                        {d.n}
                      </button>
                    </Fragment>
                  ))}
                </div>
                <select
                  className="inp hidem"
                  style={{
                    width: "auto",
                    minHeight: "38px",
                    background: "rgba(238,233,223,.06)",
                    borderColor: "rgba(238,233,223,.14)",
                    color: "#EEE9DF",
                    borderRadius: "99px",
                  }}
                  onChange={V.setPvg}
                  aria-label="Preview as guest"
                >
                  {V.pvGuests.map((g, _i) => (
                    <Fragment key={_i}>
                      <option value={g.i}>As {g.n}</option>
                    </Fragment>
                  ))}
                </select>
              </div>
              <div className="row" style={{ gap: "8px" }}>
                <button className="btn btn-s hidem" style={{ color: "#EEE9DF", borderColor: "rgba(238,233,223,.2)" }} onClick={V.reopen}>
                  Replay opening
                </button>
                <button className="btn btn-s" style={{ color: "#EEE9DF", borderColor: "rgba(238,233,223,.2)" }} onClick={V.shareP}>
                  Share preview
                </button>
                <button className="btn btn-s" style={{ background: "#EEE9DF", color: "#12110F", border: "0" }} onClick={V.closeAll}>
                  Close
                </button>
              </div>
            </div>
            <div className="pvst" onMouseMove={V.tiltMove} onMouseLeave={V.tiltOut}>
              <div className="pv-arch"></div>
              <div className="pv-dot"></div>
              <div className={V.devCls}>
                <div className="screen" style={{ background: V.pv.bg, color: V.pv.fg }}>
                  {V.closed && (
                    <>
                      <div
                        style={{
                          minHeight: "100%",
                          display: "grid",
                          alignContent: "center",
                          justifyItems: "center",
                          textAlign: "center",
                          padding: "40px 28px",
                          gap: "18px",
                          animation: "fade .8s var(--eo)",
                        }}
                      >
                        <div className="sm" style={{ opacity: ".75" }}>
                          {V.iv.dear}
                        </div>
                        <div
                          className="arch"
                          style={{ width: "min(240px,62%)", aspectRatio: "3/3.7", background: V.pv.photo, animation: "objin 1.4s var(--eo) both .1s" }}
                        ></div>
                        <div className="xs" style={{ letterSpacing: ".18em", textTransform: "uppercase", opacity: ".7" }}>
                          {V.ev.greet}
                        </div>
                        <div style={{ fontFamily: V.pv.font, fontSize: "clamp(40px,6vw,56px)", lineHeight: "1", fontWeight: "300" }}>
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
                        <div className="xs" style={{ letterSpacing: ".26em", opacity: ".8" }}>
                          {V.ev.dshort}
                        </div>
                        <button className="btn" style={{ marginTop: "12px", background: V.pv.fg, color: V.pv.bg, border: "0" }} onClick={V.openInv}>
                          {V.iv.open}
                        </button>
                        {V.host && (
                          <>
                            <span className="ann">Cover · complete · personalised per guest</span>
                          </>
                        )}
                      </div>
                    </>
                  )}
                  {V.opened && (
                    <>
                      <div className={V.pvFlip} style={{ padding: "44px 26px 60px", display: "grid", gap: "44px", textAlign: "center" }}>
                        <div style={{ display: "grid", gap: "16px", justifyItems: "center" }}>
                          <div className="arch" style={{ width: "min(260px,70%)", aspectRatio: "3/3.8", background: V.pv.photo }}></div>
                          <div style={{ fontFamily: V.pv.font, fontSize: "30px", lineHeight: "1.15", fontStyle: "italic", fontWeight: "300" }}>{V.ev.line}</div>
                          <p style={{ margin: "0", opacity: ".75", maxWidth: "34ch" }}>{V.iv.msg}</p>
                        </div>
                        {V.host && (
                          <>
                            <span className="ann" style={{ "--c": "#DDB474" }}>
                              Gallery · empty · hidden from guests until you add photos
                            </span>
                          </>
                        )}
                        <div style={{ display: "grid", gap: "6px" }}>
                          <div className="xs" style={{ letterSpacing: ".18em", textTransform: "uppercase", opacity: ".7" }}>
                            {V.iv.save}
                          </div>
                          <div style={{ fontFamily: V.pv.font, fontSize: "44px", lineHeight: "1", fontWeight: "300" }}>{V.iv.date}</div>
                          <div className="sm" style={{ opacity: ".7" }}>
                            {V.ev.days} {V.iv.days}
                          </div>
                        </div>
                        <div style={{ display: "grid", gap: "12px" }}>
                          {V.pvEvents.map((e, _i) => (
                            <Fragment key={_i}>
                              <div
                                style={{
                                  border: "1px solid color-mix(in oklab,currentColor 18%,transparent)",
                                  borderRadius: "20px",
                                  padding: "22px",
                                  display: "grid",
                                  gap: "6px",
                                }}
                              >
                                <div className="xs" style={{ letterSpacing: ".16em", textTransform: "uppercase", opacity: ".7" }}>
                                  {e.name}
                                </div>
                                <div style={{ fontFamily: V.pv.font, fontSize: "30px", lineHeight: "1" }}>{e.s}</div>
                                <div className="sm">{e.venue}</div>
                                <div className="xs" style={{ opacity: ".7" }}>
                                  {e.addr} · {e.dress}
                                </div>
                                <div className="row" style={{ justifyContent: "center", marginTop: "8px", gap: "6px" }}>
                                  <button className="btn btn-s" style={{ borderColor: "currentColor", color: "inherit" }} onClick={V.shareP}>
                                    {V.iv.cal}
                                  </button>
                                  <button className="btn btn-s" style={{ borderColor: "currentColor", color: "inherit" }} onClick={V.shareP}>
                                    {V.iv.map}
                                  </button>
                                </div>
                              </div>
                            </Fragment>
                          ))}
                        </div>
                        {V.host && (
                          <>
                            <span className="ann">RSVP · closes 25 Nov · 205 replies so far</span>
                          </>
                        )}
                        <div style={{ display: "grid", gap: "14px", justifyItems: "center" }}>
                          <div style={{ fontFamily: V.pv.font, fontSize: "32px" }}>{V.iv.join}</div>
                          {V.rsvpOpen && (
                            <>
                              <div className="row" style={{ justifyContent: "center" }}>
                                <button className="btn" style={{ background: V.pv.fg, color: V.pv.bg, border: "0" }} onClick={V.rsvpYes}>
                                  {V.iv.yes}
                                </button>
                                <button className="btn" style={{ borderColor: "currentColor", color: "inherit" }} onClick={V.rsvpNo}>
                                  {V.iv.no}
                                </button>
                              </div>
                            </>
                          )}
                          {V.rsvpYesDone && (
                            <>
                              <div style={{ display: "grid", gap: "6px", justifyItems: "center", animation: "rise .7s var(--eo) both" }}>
                                <svg width="56" height="36" viewBox="0 0 64 40" fill="none">
                                  <path
                                    d="M8 38V24a24 24 0 0 1 48 0v14"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    pathLength="100"
                                    style={{ strokeDasharray: "100", animation: "drawp 1.2s var(--eo) both" }}
                                  ></path>
                                  <circle cx="8" cy="34" r="5" fill={V.pv.ac}></circle>
                                </svg>
                                <div style={{ fontFamily: V.pv.font, fontSize: "24px" }}>{V.iv.seeyou}</div>
                                <div className="xs" style={{ opacity: ".7" }}>
                                  This is a preview. No reply was recorded.
                                </div>
                              </div>
                            </>
                          )}
                          {V.rsvpNoDone && (
                            <>
                              <div style={{ display: "grid", gap: "6px", animation: "rise .7s var(--eo) both" }}>
                                <div style={{ fontFamily: V.pv.font, fontSize: "24px" }}>{V.iv.missed}</div>
                                <div className="xs" style={{ opacity: ".7" }}>
                                  You can still watch the live stream. Preview only.
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                        <div style={{ display: "grid", gap: "12px" }}>
                          <div style={{ fontFamily: V.pv.font, fontSize: "28px" }}>{V.iv.gift}</div>
                          {V.pvGifts.map((g, _i) => (
                            <Fragment key={_i}>
                              <div
                                className="row sb"
                                style={{
                                  border: "1px solid color-mix(in oklab,currentColor 18%,transparent)",
                                  borderRadius: "16px",
                                  padding: "14px 18px",
                                  textAlign: "left",
                                }}
                              >
                                <span>
                                  <span className="xs" style={{ opacity: ".7" }}>
                                    {g.title}
                                  </span>
                                  <br />
                                  <b style={{ fontWeight: "600" }}>{g.copy}</b>
                                </span>
                                <button className="btn btn-s" style={{ borderColor: "currentColor", color: "inherit" }} data-v={g.copy} onClick={V.copy}>
                                  Copy
                                </button>
                              </div>
                            </Fragment>
                          ))}
                        </div>
                        <div style={{ display: "grid", gap: "12px" }}>
                          <div style={{ fontFamily: V.pv.font, fontSize: "28px" }}>{V.iv.wishes}</div>
                          {V.pvWishes.map((w, _i) => (
                            <Fragment key={_i}>
                              <div style={{ textAlign: "left", padding: "16px 0", borderTop: "1px solid color-mix(in oklab,currentColor 15%,transparent)" }}>
                                <div style={{ fontFamily: V.pv.font, fontStyle: "italic", fontSize: "18px" }}>“{w.t}”</div>
                                <div className="xs" style={{ opacity: ".7", marginTop: "6px" }}>
                                  {w.n}
                                </div>
                              </div>
                            </Fragment>
                          ))}
                        </div>
                        <div style={{ display: "grid", gap: "14px", justifyItems: "center", paddingTop: "20px" }}>
                          <div style={{ fontFamily: V.pv.font, fontSize: "24px", fontStyle: "italic", fontWeight: "300" }}>{V.ev.close}</div>
                          <div className="xs" style={{ opacity: ".55", letterSpacing: ".1em" }}>
                            Made with mula
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      {V.obOpen && (
        <>
          <div className="ob" role="dialog" aria-label="Create your celebration">
            <div
              style={{
                display: "grid",
                gridTemplateRows: "auto auto 1fr auto",
                gap: "26px",
                padding: "clamp(20px,4vw,48px)",
                overflow: "auto",
                minHeight: "0",
              }}
            >
              <div className="row sb">
                <img className="logo-l" src="/brand/admin/mula-lockup-ink.png" alt="mula" style={{ height: "26px" }} />
                <img className="logo-d" src="/brand/admin/mula-lockup-light.png" alt="mula" style={{ height: "26px" }} />
                <button className="btn btn-t btn-s" onClick={V.closeAll}>
                  Save and exit
                </button>
              </div>
              <div style={{ display: "grid", gap: "10px" }}>
                <div className="row" style={{ gap: "6px", flexWrap: "nowrap" }}>
                  {V.obTicks.map((t, _i) => (
                    <Fragment key={_i}>
                      <span className="obt">
                        <i style={{}}></i>
                      </span>
                    </Fragment>
                  ))}
                </div>
                <div className="xs mut">Step {V.ob.n} of 8</div>
              </div>
              <div style={{ alignSelf: "center", display: "grid", gap: "20px", maxWidth: "540px", width: "100%" }}>
                <div className="mo" style={{ marginBottom: "6px" }}>
                  <div className="row" style={{ gap: "14px", flexWrap: "nowrap", padding: "12px", borderRadius: "16px", background: V.pv.bg, color: V.pv.fg }}>
                    <span className="arch" style={{ width: "40px", height: "50px", flex: "none", background: V.pv.photo }}></span>
                    <span style={{ minWidth: "0" }}>
                      <span className="xs" style={{ opacity: ".7" }}>
                        {V.obObj.greet}
                      </span>
                      <br />
                      <span className="serif" style={{ fontSize: "20px" }}>
                        {V.obObj.names}
                      </span>
                      <br />
                      <span className="xs" style={{ opacity: ".7" }}>
                        {V.obObj.date}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="eb" style={{ color: "var(--dotd)" }}>
                  {V.ob.kick}
                </div>
                <h1 className="h1">{V.ob.h}</h1>
                <p className="lede" style={{ margin: "0" }}>
                  {V.ob.p}
                </p>
                {V.ob.choice && (
                  <>
                    <div className="row" style={{ gap: "8px" }}>
                      {V.obTypes.map((t, _i) => (
                        <Fragment key={_i}>
                          <button className={t.on} style={{ minHeight: "46px", padding: "0 18px", fontSize: "14px" }} data-v={t.n} onClick={V.setObType}>
                            {t.n}
                          </button>
                        </Fragment>
                      ))}
                    </div>
                  </>
                )}
                {V.ob.names && (
                  <>
                    <input
                      className="inp"
                      style={{ minHeight: "58px", fontSize: "20px", fontFamily: "var(--serif)" }}
                      placeholder="e.g. Raden & Cilla"
                      value={V.obNames}
                      onChange={V.setObNames}
                      aria-label="Names"
                      autoFocus
                    />
                  </>
                )}
                {V.ob.date && (
                  <>
                    <input
                      className="inp"
                      style={{ minHeight: "58px", fontSize: "18px" }}
                      type="date"
                      value={V.obDate}
                      onChange={V.setObDate}
                      aria-label="Date"
                    />
                  </>
                )}
                {V.ob.venue && (
                  <>
                    <input
                      className="inp"
                      style={{ minHeight: "58px", fontSize: "18px" }}
                      placeholder="Venue name"
                      value={V.obVenue}
                      onChange={V.setObVenue}
                      aria-label="Venue"
                    />
                  </>
                )}
                {V.ob.pal && (
                  <>
                    <div className="row" style={{ gap: "16px" }}>
                      {V.obPalOpts.map((o, _i) => (
                        <Fragment key={_i}>
                          <button
                            data-v={o.i}
                            onClick={V.setPal}
                            style={{ display: "grid", gap: "8px", justifyItems: "center", border: "0", background: "none", padding: "0" }}
                            aria-label={`${o.n} palette`}
                          >
                            <span
                              style={{
                                width: "64px",
                                height: "64px",
                                borderRadius: "50%",
                                background: `linear-gradient(135deg,${o.bg} 50%,${o.ac} 50%)`,
                                border: "1px solid var(--line)",
                              }}
                            ></span>
                            <span className="xs">{o.n}</span>
                          </button>
                        </Fragment>
                      ))}
                    </div>
                  </>
                )}
                {V.ob.guests && (
                  <>
                    <form className="row" style={{ flexWrap: "nowrap" }} onSubmit={V.addObG}>
                      <input className="inp" style={{ minHeight: "52px" }} placeholder="Guest name" value={V.obG} onChange={V.setObG} aria-label="Guest name" />
                      <button className="btn" type="submit">
                        Add
                      </button>
                    </form>
                    <div className="row" style={{ gap: "6px" }}>
                      {V.obGuests.map((g, _i) => (
                        <Fragment key={_i}>
                          <span className="tick">{g.n}</span>
                        </Fragment>
                      ))}
                    </div>
                  </>
                )}
                {V.ob.review && (
                  <>
                    <dl
                      style={{
                        display: "grid",
                        gridTemplateColumns: "auto 1fr",
                        gap: "12px 24px",
                        margin: "0",
                        fontSize: "15px",
                        borderTop: "1px solid var(--line)",
                        paddingTop: "16px",
                      }}
                    >
                      <dt className="mut">Celebration</dt>
                      <dd style={{ margin: "0" }}>{V.obObj.type}</dd>
                      <dt className="mut">Names</dt>
                      <dd style={{ margin: "0" }}>{V.obObj.names}</dd>
                      <dt className="mut">Date</dt>
                      <dd style={{ margin: "0" }}>{V.obObj.date}</dd>
                      <dt className="mut">Place</dt>
                      <dd style={{ margin: "0" }}>{V.obObj.venue}</dd>
                      <dt className="mut">Design</dt>
                      <dd style={{ margin: "0" }}>{V.obObj.design}</dd>
                      <dt className="mut">Guests</dt>
                      <dd style={{ margin: "0" }}>{V.obObj.guests}</dd>
                    </dl>
                  </>
                )}
                {V.ob.done && (
                  <>
                    <p className="serif it" style={{ fontSize: "22px", margin: "0", color: "var(--ink2)", fontWeight: "300" }}>
                      From here, a new story unfolds.
                    </p>
                  </>
                )}
              </div>
              <div className="row sb" style={{ position: "sticky", bottom: "0", background: "var(--bg)", padding: "12px 0" }}>
                <button className="btn btn-t" onClick={V.obBack}>
                  Back
                </button>
                <button className="btn btn-p" onClick={V.obNext}>
                  {V.ob.cta}
                </button>
              </div>
            </div>
            <div className="obst stage" onMouseMove={V.tiltMove} onMouseLeave={V.tiltOut}>
              <div className="halo" style={{ borderColor: "rgba(238,233,223,.12)" }}></div>
              <div className="halo-dot" style={{ background: "#B8AB97" }}></div>
              <div className="tilt inv-obj" style={{ background: V.pv.bg, color: V.pv.fg, boxShadow: "0 60px 100px -30px rgba(0,0,0,.85)" }}>
                <div className="inv-photo arch" style={{ background: V.pv.photo }}>
                  Your photo
                </div>
                <div className="lay2">
                  <div className="xs" style={{ letterSpacing: ".16em", textTransform: "uppercase", opacity: ".7" }}>
                    {V.obObj.greet}
                  </div>
                  <div style={{ fontFamily: V.pv.font, fontSize: "32px", lineHeight: "1.05", margin: "10px 0 12px" }}>{V.obObj.names}</div>
                  <div className="xs" style={{ letterSpacing: ".12em", opacity: ".8" }}>
                    {V.obObj.date}
                  </div>
                  <div className="xs" style={{ opacity: ".6", marginTop: "4px" }}>
                    {V.obObj.venue}
                  </div>
                </div>
                <div className="sheen"></div>
              </div>
              <div className="xs" style={{ position: "absolute", bottom: "28px", color: "#A39B8E", letterSpacing: ".08em" }}>
                Your invitation, taking shape
              </div>
            </div>
          </div>
        </>
      )}
      {V.celebrate && (
        <>
          <div className="cel" onClick={V.closeAll} role="status">
            {V.celebPkg && (
              <>
                <div style={{ display: "grid", gap: "20px", justifyItems: "center", maxWidth: "520px" }} onClick={V.stop}>
                  <svg width="150" height="96" viewBox="0 0 64 40" fill="none">
                    <path d="M8 38V24a24 24 0 0 1 48 0v14" stroke="var(--ink)" strokeWidth="2.4" strokeLinecap="round" pathLength="100"></path>
                    <circle
                      cx="8"
                      cy="34"
                      r="4.5"
                      fill="var(--dot)"
                      style={{ animation: "pop .7s var(--sp) both 1.2s", transformBox: "fill-box", transformOrigin: "center" }}
                    ></circle>
                  </svg>
                  <div className="eb" style={{ animation: "rise .9s var(--eo) both .4s" }}>
                    Payment completed
                  </div>
                  <h2 className="h1" style={{ animation: "rise .9s var(--eo) both .5s" }}>
                    Advanced Event is yours.
                  </h2>
                  <div className="row" style={{ justifyContent: "center", gap: "8px", animation: "rise .9s var(--eo) both .7s" }}>
                    <span className="tick">Mula AI</span>
                    <span className="tick">10 invitations</span>
                    <span className="tick">All three languages</span>
                    <span className="tick">Check-in and ushers</span>
                    <span className="tick">Personal concierge</span>
                  </div>
                  <div className="row" style={{ justifyContent: "center", animation: "rise .9s var(--eo) both .9s" }}>
                    <button className="btn btn-p" onClick={V.openAiFromCeleb}>
                      Try Mula AI
                    </button>
                    <button className="btn" onClick={V.closeAll}>
                      View receipt
                    </button>
                  </div>
                </div>
              </>
            )}
            {V.celebPub && (
              <>
                <div style={{ display: "grid", gap: "20px", justifyItems: "center" }}>
                  <svg width="150" height="96" viewBox="0 0 64 40" fill="none">
                    <path d="M8 38V24a24 24 0 0 1 48 0v14" stroke="var(--ink)" strokeWidth="2.4" strokeLinecap="round" pathLength="100"></path>
                    <circle
                      cx="8"
                      cy="34"
                      r="4.5"
                      fill="var(--dot)"
                      style={{ animation: "pop .7s var(--sp) both 1.2s", transformBox: "fill-box", transformOrigin: "center" }}
                    ></circle>
                  </svg>
                  <h2 className="h1" style={{ animation: "rise .9s var(--eo) both .5s" }}>
                    Your invitation is live.
                  </h2>
                  <p className="serif it" style={{ margin: "0", fontSize: "20px", color: "var(--mut)", animation: "rise .9s var(--eo) both .7s" }}>
                    From here, a new story unfolds.
                  </p>
                  <button className="btn btn-p" style={{ animation: "rise .9s var(--eo) both .9s" }} onClick={V.shareP}>
                    Copy invitation link
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
      {V.newInv && (
        <>
          <div className="scrim" onClick={V.closeAll}>
            <form
              className="mod"
              onClick={V.stop}
              onSubmit={V.createInv}
              style={{ display: "grid", gap: "16px", width: "min(520px,100%)" }}
              aria-label="New invitation"
            >
              <div>
                <div className="eb">{V.ev.host}</div>
                <h2 className="h1" style={{ fontSize: "34px", marginTop: "8px" }}>
                  A new invitation.
                </h2>
                <p className="sm mut" style={{ margin: "8px 0 0" }}>
                  Same event, its own audience, language, design and link.
                </p>
              </div>
              {V.atLimit && (
                <>
                  <div style={{ display: "grid", gap: "12px", padding: "20px", borderRadius: "16px", background: "var(--bg2)" }}>
                    <div className="h2" style={{ fontSize: "21px" }}>
                      You’re using all {V.invLimit} invitations in {V.pkgName}.
                    </div>
                    <p className="sm mut" style={{ margin: "0" }}>
                      Archive one you no longer need, or upgrade to Advanced Event for up to 10 invitations in all three languages.
                    </p>
                    <div className="row">
                      <button type="button" className="btn btn-p btn-s" onClick={V.upgrade}>
                        Upgrade · Rp 450.000
                      </button>
                      <button type="button" className="btn btn-t btn-s" onClick={V.closeAll}>
                        Not now
                      </button>
                    </div>
                  </div>
                </>
              )}
              <label className="f">
                Name it for yourself
                <input className="inp" required data-k="name" value={V.ni.name} onChange={V.setNi} placeholder="e.g. Office friends" />
              </label>{" "}
              <label className="f">
                Who it’s for
                <select className="inp" data-k="aud" onChange={V.setNi}>
                  <option>Friends</option>
                  <option>Family</option>
                  <option>Colleagues</option>
                  <option>VIP</option>
                  <option>Everyone</option>
                </select>
              </label>{" "}
              <label className="f">
                Language for guests
                <select className="inp" data-k="lang" onChange={V.setNi}>
                  <option value="en">English</option>
                  <option value="id">Bahasa Indonesia</option>
                  <option value="ms">Bahasa Melayu</option>
                </select>
              </label>
              <div className="row" style={{ justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-t" onClick={V.closeAll}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-p" disabled={V.atLimit}>
                  Create invitation
                </button>
              </div>
            </form>
          </div>
        </>
      )}
      {V.regOpen && (
        <>
          <div className="scrim" onClick={V.closeAll}>
            <form
              className="mod"
              onClick={V.stop}
              onSubmit={V.addReg}
              style={{ display: "grid", gap: "14px", width: "min(540px,100%)" }}
              aria-label="Add a gift"
            >
              <div>
                <div className="eb">Registry</div>
                <h2 className="h1" style={{ fontSize: "34px", marginTop: "8px" }}>
                  Something you’d love.
                </h2>
              </div>
              <button
                type="button"
                className="arch"
                style={{ height: "150px", width: "130px", border: "1px dashed var(--line2)", background: "var(--bg2)", color: "var(--mut)", fontSize: "12px" }}
                onClick={V.toastGallery}
              >
                Add a photo
              </button>{" "}
              <label className="f">
                Gift
                <input className="inp" required data-k="name" value={V.nr.name} onChange={V.setNr} placeholder="e.g. Linen bedding set" />
              </label>{" "}
              <label className="f">
                A line for guests
                <textarea
                  className="inp"
                  style={{ minHeight: "70px" }}
                  data-k="desc"
                  value={V.nr.desc}
                  onChange={V.setNr}
                  placeholder="Why it matters, size, colour"
                ></textarea>
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: "12px" }}>
                <label className="f">
                  Price (Rp)
                  <input className="inp" inputMode="numeric" data-k="price" value={V.nr.price} onChange={V.setNr} placeholder="1.850.000" />
                </label>
                <label className="f">
                  How many
                  <input className="inp" type="number" min="1" data-k="qty" value={V.nr.qty} onChange={V.setNr} />
                </label>
              </div>
              <label className="f">
                <span className="row sb">
                  Where to buy <span className="bdg b-mu">{V.nrStore}</span>
                </span>
                <input
                  className="inp"
                  type="url"
                  data-k="url"
                  value={V.nr.url}
                  onChange={V.setNr}
                  placeholder="Paste a Shopee, Tokopedia, TikTok Shop or any link"
                />
              </label>
              <p className="xs mut" style={{ margin: "0" }}>
                Leave the link empty to let guests contribute to it instead.
              </p>
              <div className="row" style={{ justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-t" onClick={V.closeAll}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-p">
                  Add to registry
                </button>
              </div>
            </form>
          </div>
        </>
      )}
      {V.aiOpen && (
        <>
          <div className="scrim" style={{ padding: "0", background: "rgba(12,11,10,.28)" }} onClick={V.closeAll}></div>
          <aside
            className="drw"
            role="dialog"
            aria-label="Mula AI"
            style={{ width: "min(560px,100%)", display: "grid", gap: "22px", alignContent: "start", padding: "28px clamp(20px,3vw,32px)" }}
          >
            <div className="row sb">
              <div className="row" style={{ gap: "12px", flexWrap: "nowrap" }}>
                <svg viewBox="0 0 64 40" width="44" fill="none">
                  <path d="M8 38V24a24 24 0 0 1 48 0v14" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round"></path>
                  <circle cx="8" cy="34" r="5" fill="var(--dot)"></circle>
                </svg>
                <div>
                  <div className="h2">Mula AI</div>
                  <div className="xs mut">Advanced Event</div>
                </div>
              </div>
              <button className="btn btn-t btn-s" onClick={V.closeAll}>
                Close
              </button>
            </div>
            <div className="xs mut" style={{ padding: "12px 16px", borderRadius: "14px", background: "var(--bg2)" }}>
              Knows your event: <b style={{ color: "var(--ink)", fontWeight: "500" }}>{V.ev.host}</b> · {V.ev.type} · {V.resp.total} guests · {V.ev.days} days to go · 3
              invitations
            </div>
            {V.aiLocked && (
              <>
                <div style={{ display: "grid", gap: "16px", padding: "24px", border: "1px solid var(--line)", borderRadius: "20px", background: "var(--sf)" }}>
                  <div className="eb" style={{ color: "var(--dotd)" }}>
                    Included in Advanced Event
                  </div>
                  <div className="h1" style={{ fontSize: "30px" }}>
                    A second pair of hands for the details.
                  </div>
                  <ul style={{ margin: "0", padding: "0", listStyle: "none", display: "grid", fontSize: "14px" }}>
                    <li style={{ padding: "10px 0", borderTop: "1px solid var(--line)" }}>Invitation copy in your tone, in three languages</li>
                    <li style={{ padding: "10px 0", borderTop: "1px solid var(--line)" }}>Follow-up messages for guests who haven’t replied</li>
                    <li style={{ padding: "10px 0", borderTop: "1px solid var(--line)" }}>Checklists and readiness reviews built from your event</li>
                    <li style={{ padding: "10px 0", borderTop: "1px solid var(--line)" }}>Design suggestions for each invitation</li>
                  </ul>
                  <div className="row">
                    <button className="btn btn-p" onClick={V.upgrade}>
                      Upgrade · Rp 450.000
                    </button>
                    <button className="btn btn-t" data-p="packages" onClick={V.go}>
                      Compare packages
                    </button>
                  </div>
                  <div className="xs mut">One payment for this event. You pay only the difference from One-Time Event.</div>
                </div>
              </>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: "8px" }}>
              {V.aiTasks.map((a, _i) => (
                <Fragment key={_i}>
                  <button className={a.on} data-v={a.id} onClick={V.pickAi} disabled={V.aiLocked}>
                    <span style={{ fontWeight: "500", fontSize: "14px" }}>{a.n}</span>
                    <span className="xs mut">{a.d}</span>
                  </button>
                </Fragment>
              ))}
            </div>
            {V.aiFree && (
              <>
                <form
                  className="row"
                  style={{ flexWrap: "nowrap", padding: "6px 6px 6px 18px", border: "1px solid var(--line2)", borderRadius: "99px", background: "var(--rs)" }}
                  onSubmit={V.askAi}
                >
                  <input
                    style={{
                      flex: "1",
                      border: "0",
                      background: "transparent",
                      font: "inherit",
                      color: "inherit",
                      minHeight: "40px",
                      outline: "none",
                      minWidth: "0",
                    }}
                    placeholder="Or tell Mula AI what you need…"
                    value={V.aiQ}
                    onChange={V.setAiQ}
                    aria-label="Ask Mula AI"
                  />
                  <button className="btn btn-p btn-s" type="submit">
                    Ask
                  </button>
                </form>
                {V.isCopy && (
                  <>
                    <div className="row" style={{ gap: "6px" }}>
                      <span className="xs mut" style={{ marginRight: "4px" }}>
                        Tone
                      </span>
                      {V.tones.map((o, _i) => (
                        <Fragment key={_i}>
                          <button className={o.on} data-v={o.n} onClick={V.setTone}>
                            {o.n}
                          </button>
                        </Fragment>
                      ))}
                    </div>
                  </>
                )}
                {V.aiBusy && (
                  <>
                    <div style={{ display: "grid", justifyItems: "center", gap: "12px", padding: "40px 0" }}>
                      <svg viewBox="0 0 64 40" width="72" fill="none">
                        <path
                          className="aiarc"
                          d="M8 38V24a24 24 0 0 1 48 0v14"
                          stroke="var(--ink)"
                          strokeWidth="2.6"
                          strokeLinecap="round"
                          pathLength="100"
                        ></path>
                        <circle cx="8" cy="34" r="4.5" fill="var(--dot)">
                          <animate attributename="opacity" values="1;.3;1" dur="1.6s" repeatcount="indefinite"></animate>
                        </circle>
                      </svg>
                      <div className="sm mut">Reading your event…</div>
                    </div>
                  </>
                )}
                {V.aiIdle && (
                  <>
                    <p className="sm mut" style={{ margin: "0", textAlign: "center", padding: "20px 0" }}>
                      Choose something above. Drafts are suggestions; nothing changes until you choose to use one.
                    </p>
                  </>
                )}
                {V.aiShown && (
                  <>
                    <div className="stg" style={{ display: "grid", gap: "12px" }}>
                      <div className="eb">{V.ao.h}</div>
                      {V.ao.items.map((o, _i) => (
                        <Fragment key={_i}>
                          <article
                            style={{
                              display: "grid",
                              gap: "10px",
                              padding: "20px",
                              border: "1px solid var(--line)",
                              borderRadius: "18px",
                              background: "var(--sf)",
                            }}
                          >
                            <div className="xs mut">{o.h}</div>
                            <div className="serif" style={{ fontSize: "20px", lineHeight: "1.35", fontWeight: "300" }}>
                              {o.t}
                            </div>
                            {o.a && (
                              <>
                                <div className="row" style={{ gap: "6px" }}>
                                  <button className="btn btn-s" data-k={o.k} data-v={o.v} onClick={V.aiAct}>
                                    {o.a}
                                  </button>
                                </div>
                              </>
                            )}
                          </article>
                        </Fragment>
                      ))}
                      <div className="xs mut" style={{ textAlign: "center" }}>
                        Mula AI can make mistakes. Read drafts before sending them to guests.
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </aside>
        </>
      )}
    </>
  );
}
