// @ts-nocheck
/* eslint-disable */
"use client";
// Ported from docs/dashboard-admin-prototype "Mula Admin v3" (lines 585–649). `v` is the prototype's renderVals() object (bound as V so prototype loop variables named v still work).
import { Fragment } from "react";

export function DesignView({ v: V }: { v: any }) {
  return (
    <>
      {V.p.design && (
        <>
          <div className="stg" style={{ display: "grid", gap: "28px" }}>
            <div className="ph" style={{ marginBottom: "0" }}>
              <div>
                <div className="eb">Design · {V.ci.name}</div>
                <h1 className="h1">Choose how your story looks.</h1>
              </div>
              <div className="seg" role="tablist">
                {V.dmodes.map((m, _i) => (
                  <Fragment key={_i}>
                    <button className={m.on} data-v={m.id} onClick={V.setDmode} role="tab">
                      {m.n}
                    </button>
                  </Fragment>
                ))}
              </div>
            </div>
            {V.dTpl && (
              <>
                <div style={{ display: "grid", gap: "28px" }}>
                  <section className="studio">
                    <div
                      className="stage"
                      style={{ display: "grid", placeItems: "center", minHeight: "520px", padding: "30px" }}
                      onMouseMove={V.tiltMove}
                      onMouseLeave={V.tiltOut}
                    >
                      <div className="halo" style={{ borderColor: "rgba(238,233,223,.12)" }}></div>
                      <div className="halo-dot" style={{ background: "#B8AB97" }}></div>
                      <div
                        className="tilt inv-obj"
                        style={{ background: V.pv.bg, color: V.pv.fg, width: "min(290px,70%)", boxShadow: "0 60px 100px -30px rgba(0,0,0,.85)" }}
                      >
                        <div className="inv-photo arch" style={{ background: V.pv.photo }}>
                          Cover photo
                        </div>
                        <div className="lay2">
                          <div className="xs" style={{ letterSpacing: ".16em", textTransform: "uppercase", opacity: ".85" }}>
                            {V.ev.greet}
                          </div>
                          <div style={{ fontFamily: V.pv.font, fontSize: "34px", lineHeight: "1.02", margin: "10px 0 12px" }}>
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
                    </div>
                    <div style={{ padding: "clamp(24px,4vw,48px)", display: "grid", gap: "26px", alignContent: "center" }}>
                      <div>
                        <div className="eb" style={{ color: "#A39B8E" }}>
                          In use
                        </div>
                        <div className="h1" style={{ marginTop: "8px", fontSize: "clamp(34px,3.6vw,48px)" }}>
                          {V.designName}
                        </div>
                      </div>
                      <div>
                        <div className="xs" style={{ color: "#A39B8E", marginBottom: "10px" }}>
                          Palette
                        </div>
                        <div className="row" style={{ gap: "12px" }}>
                          {V.palOpts.map((o, _i) => (
                            <Fragment key={_i}>
                              <button
                                data-v={o.i}
                                onClick={V.setPal}
                                aria-label={`${o.n} palette`}
                                style={{
                                  width: "52px",
                                  height: "52px",
                                  borderRadius: "50%",
                                  border: "0",
                                  padding: "0",
                                  background: `linear-gradient(135deg,${o.bg} 50%,${o.ac} 50%)`,
                                  transition: "outline-offset .3s",
                                }}
                              ></button>
                            </Fragment>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="xs" style={{ color: "#A39B8E", marginBottom: "10px" }}>
                          Type
                        </div>
                        <div className="seg dk">
                          {V.fonts.map((f, _i) => (
                            <Fragment key={_i}>
                              <button className={f.on} data-v={f.n} onClick={V.setFont}>
                                {f.n}
                              </button>
                            </Fragment>
                          ))}
                        </div>
                      </div>
                      <div className="row">
                        <button className="btn" style={{ background: "#EEE9DF", color: "#12110F", borderColor: "#EEE9DF" }} onClick={V.save}>
                          Save design
                        </button>
                        <button className="btn" style={{ color: "#EEE9DF", borderColor: "rgba(238,233,223,.25)" }} onClick={V.openPreview}>
                          Preview on a phone
                        </button>
                      </div>
                    </div>
                  </section>
                  <div className="row sb" style={{ marginTop: "24px", alignItems: "flex-end" }}>
                    <h2 className="h2">More designs</h2>
                    <input
                      className="inp"
                      placeholder="Search designs"
                      value={V.dq}
                      onChange={V.setDq}
                      aria-label="Search designs"
                      style={{ maxWidth: "300px" }}
                    />
                  </div>
                  <div className="row" style={{ gap: "6px" }}>
                    {V.dcats.map((c, _i) => (
                      <Fragment key={_i}>
                        <button className={c.on} data-v={c.n} onClick={V.setDcat}>
                          {c.n}
                        </button>
                      </Fragment>
                    ))}
                  </div>
                  {V.noDesigns && (
                    <>
                      <p className="mut">No designs match yet. Try another category.</p>
                    </>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,250px),1fr))", gap: "clamp(18px,2vw,28px)" }}>
                    {V.designs.map((d, _i) => (
                      <Fragment key={_i}>
                        <article className="dcard">
                          <div className="dthumb" style={{ background: d.bg, color: d.fg }}>
                            {d.cur && (
                              <>
                                <span className="bdg" style={{ position: "absolute", top: "14px", left: "14px", background: d.fg, color: d.bg }}>
                                  In use
                                </span>
                              </>
                            )}
                            <div className="dthumb-in">
                              <div className="arch" style={{ width: "78%", aspectRatio: "3/3.4", background: d.photo }}></div>
                              <div className="xs" style={{ letterSpacing: ".16em", textTransform: "uppercase", opacity: ".85" }}>
                                {d.cat}
                              </div>
                              <div className="serif" style={{ fontSize: "28px", lineHeight: "1.02" }}>
                                {d.mock}
                              </div>
                            </div>
                          </div>
                          <div style={{ padding: "14px 2px 0", display: "grid", gap: "10px" }}>
                            <div className="row sb">
                              <b style={{ fontWeight: "500" }}>{d.name}</b>
                              <span className="xs mut">{d.tags}</span>
                            </div>
                            <div className="row" style={{ gap: "6px" }}>
                              <button className="btn btn-s" onClick={V.openPreview}>
                                Preview
                              </button>
                              <button className="btn btn-p btn-s" data-v={d.name} data-pal={d.pal} onClick={V.useDesign}>
                                Use this design
                              </button>
                            </div>
                          </div>
                        </article>
                      </Fragment>
                    ))}
                  </div>
                </div>
              </>
            )}
            {V.dCus && (
              <>
                <div
                  style={{ display: "grid", gridTemplateColumns: "minmax(0,340px) minmax(0,1fr)", gap: "clamp(18px,3vw,40px)", alignItems: "start" }}
                  className="cus"
                >
                  <div className="card" style={{ display: "grid", gap: "20px", position: "sticky", top: "90px", padding: "22px" }}>
                    <div className="row sb">
                      <div>
                        <div className="eb">Custom studio</div>
                        <div className="h2" style={{ marginTop: "6px" }}>
                          {V.ci.name}
                        </div>
                      </div>
                      <button className="btn btn-t btn-s" data-v="design" onClick={V.openAi}>
                        <svg className="ic" viewBox="0 0 20 20" style={{ width: "15px", color: "var(--dotd)" }}>
                          <path d={V.ic.ai}></path>
                        </svg>
                        Ideas
                      </button>
                    </div>
                    <div className="row" style={{ gap: "4px" }} role="tablist">
                      {V.ctabs.map((c, _i) => (
                        <Fragment key={_i}>
                          <button
                            className={`chip ${c.on}`}
                            style={{ minHeight: "32px", padding: "0 12px", fontSize: "12.5px" }}
                            data-v={c.n}
                            onClick={V.setCtab}
                            role="tab"
                          >
                            {c.n}
                          </button>
                        </Fragment>
                      ))}
                    </div>
                    {V.ct.layout && (
                      <>
                        <div style={{ display: "grid", gap: "10px" }}>
                          <div className="sm mut">How the cover is composed.</div>
                          <div className="row" style={{ gap: "6px" }}>
                            {V.layOpts.map((o, _i) => (
                              <Fragment key={_i}>
                                <button className={o.on} data-k={o.k} data-v={o.n} onClick={V.setCuOpt}>
                                  {o.n}
                                </button>
                              </Fragment>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                    {V.ct.type && (
                      <>
                        <div style={{ display: "grid", gap: "14px" }}>
                          <div>
                            <div className="xs mut" style={{ marginBottom: "8px" }}>
                              Typeface
                            </div>
                            <div className="seg">
                              {V.fonts.map((f, _i) => (
                                <Fragment key={_i}>
                                  <button className={f.on} data-v={f.n} onClick={V.setFont}>
                                    {f.n}
                                  </button>
                                </Fragment>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="xs mut" style={{ marginBottom: "8px" }}>
                              Scale of the names
                            </div>
                            <div className="row" style={{ gap: "6px" }}>
                              {V.scaleOpts.map((o, _i) => (
                                <Fragment key={_i}>
                                  <button className={o.on} data-k={o.k} data-v={o.n} onClick={V.setCuOpt}>
                                    {o.n}
                                  </button>
                                </Fragment>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                    {V.ct.colour && (
                      <>
                        <div style={{ display: "grid", gap: "10px" }}>
                          <div className="sm mut">Six palettes, each tuned for contrast on phones and in print.</div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px" }}>
                            {V.allPals.map((o, _i) => (
                              <Fragment key={_i}>
                                <button
                                  data-v={o.i}
                                  onClick={V.setPal}
                                  style={{ display: "grid", gap: "6px", justifyItems: "center", border: "0", background: "none", padding: "4px" }}
                                  aria-label={`${o.n} palette`}
                                >
                                  <span
                                    style={{
                                      width: "100%",
                                      aspectRatio: "1.4",
                                      borderRadius: "12px",
                                      background: o.bg,
                                      border: "1px solid var(--line)",
                                      display: "grid",
                                      placeItems: "center",
                                    }}
                                  >
                                    <span style={{ font: "400 18px var(--serif)", color: o.fg }}>
                                      Aa<span style={{ color: o.ac }}>.</span>
                                    </span>
                                  </span>
                                  <span className="xs">{o.n}</span>
                                </button>
                              </Fragment>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                    {V.ct.images && (
                      <>
                        <div style={{ display: "grid", gap: "14px" }}>
                          <div>
                            <div className="xs mut" style={{ marginBottom: "8px" }}>
                              Photo frame
                            </div>
                            <div className="row" style={{ gap: "6px" }}>
                              {V.frameOpts.map((o, _i) => (
                                <Fragment key={_i}>
                                  <button className={o.on} data-k={o.k} data-v={o.n} onClick={V.setCuOpt}>
                                    {o.n}
                                  </button>
                                </Fragment>
                              ))}
                            </div>
                          </div>
                          <button className="btn" onClick={V.toastGallery} style={{ borderStyle: "dashed" }}>
                            Replace cover photo
                          </button>
                          <div className="xs mut">Gallery: 0 of 24 photos. Portrait photos work best.</div>
                        </div>
                      </>
                    )}
                    {V.ct.sections && (
                      <>
                        <div style={{ display: "grid" }}>
                          {V.cSecs.map((s, _i) => (
                            <Fragment key={_i}>
                              <div className="row" style={{ padding: "8px 0", borderTop: "1px solid var(--line)", flexWrap: "nowrap", gap: "8px" }}>
                                <button
                                  className="btn btn-t btn-i"
                                  style={{ minHeight: "32px", width: "32px" }}
                                  data-v={s.i}
                                  onClick={V.secUp}
                                  aria-label={`Move ${s.n} up`}
                                >
                                  ↑
                                </button>
                                <span style={{ flex: "1" }} className="sm">
                                  {s.n}
                                </span>
                                <button className={s.on} role="switch" aria-checked={s.ar} aria-label={`Show ${s.n}`} data-v={s.i} onClick={V.togSec}></button>
                              </div>
                            </Fragment>
                          ))}
                        </div>
                      </>
                    )}
                    {V.ct.motion && (
                      <>
                        <div style={{ display: "grid", gap: "12px" }}>
                          <div className="sm mut">How the invitation opens for guests. Reduced-motion devices always get the still version.</div>
                          <div className="row" style={{ gap: "6px" }}>
                            {V.motOpts.map((o, _i) => (
                              <Fragment key={_i}>
                                <button className={o.on} data-k={o.k} data-v={o.n} onClick={V.setCuOpt}>
                                  {o.n}
                                </button>
                              </Fragment>
                            ))}
                          </div>
                          <button className="btn btn-s" style={{ justifySelf: "start" }} onClick={V.replay}>
                            Replay
                          </button>
                        </div>
                      </>
                    )}
                    <div className="row" style={{ borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
                      <button className="btn btn-p" onClick={V.saveCustom}>
                        Save design
                      </button>
                      <button className="btn btn-t" onClick={V.openPreview}>
                        Preview
                      </button>
                    </div>
                  </div>
                  <div className="studio" style={{ gridTemplateColumns: "1fr", minHeight: "640px" }}>
                    <div
                      className="stage"
                      style={{ display: "grid", placeItems: "center", padding: "clamp(24px,4vw,48px)" }}
                      onMouseMove={V.tiltMove}
                      onMouseLeave={V.tiltOut}
                    >
                      <div className="pv-arch" style={{ width: "min(520px,80%)" }}></div>
                      <div className="tilt phone" style={{ width: "min(320px,80%)", background: V.pv.bg, color: V.pv.fg, position: "relative" }}>
                        {V.cu.std && (
                          <>
                            <div
                              className={V.cu.anim}
                              style={{
                                height: "100%",
                                display: "grid",
                                alignContent: "center",
                                justifyItems: V.cu.just,
                                textAlign: V.cu.align,
                                padding: "28px 24px",
                                gap: "14px",
                              }}
                            >
                              <div style={{ width: V.cu.pw, aspectRatio: V.cu.ar, borderRadius: V.cu.radius, background: V.pv.photo }}></div>
                              <div className="xs" style={{ letterSpacing: ".16em", textTransform: "uppercase", opacity: ".85" }}>
                                {V.ev.greet}
                              </div>
                              <div style={{ fontFamily: V.pv.font, fontSize: V.cu.size, lineHeight: "1.02" }}>
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
                              <div style={{ fontFamily: V.pv.font, fontStyle: "italic", fontSize: "14px", opacity: ".8" }}>{V.ev.line}</div>
                              <div className="xs" style={{ letterSpacing: ".24em", opacity: ".8" }}>
                                {V.ev.dshort}
                              </div>
                            </div>
                          </>
                        )}
                        {V.cu.full && (
                          <>
                            <div
                              className={V.cu.anim}
                              style={{
                                height: "100%",
                                position: "relative",
                                display: "grid",
                                alignContent: "end",
                                padding: "28px 24px",
                                gap: "10px",
                                color: "#fff",
                                background: V.pv.photo,
                              }}
                            >
                              <div style={{ position: "absolute", inset: "0", background: "linear-gradient(180deg,transparent 35%,rgba(0,0,0,.55))" }}></div>
                              <div style={{ position: "relative", display: "grid", gap: "10px" }}>
                                <div className="xs" style={{ letterSpacing: ".16em", textTransform: "uppercase", opacity: ".85" }}>
                                  {V.ev.greet}
                                </div>
                                <div style={{ fontFamily: V.pv.font, fontSize: V.cu.size, lineHeight: "1.02" }}>
                                  {V.ev.a}
                                  <br />
                                  {V.ev.amp && (
                                    <>
                                      <span className="it">&amp;</span>
                                    </>
                                  )}
                                  {V.ev.b}
                                </div>
                                <div className="xs" style={{ letterSpacing: ".24em", opacity: ".85" }}>
                                  {V.ev.dshort}
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                        <div className="sheen"></div>
                      </div>
                      <div className="xs" style={{ position: "absolute", bottom: "20px", color: "#A39B8E" }}>
                        {V.cu0.layout} · {V.cu0.frame} frame · {V.cu0.motion}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
