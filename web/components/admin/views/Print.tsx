// @ts-nocheck
/* eslint-disable */
"use client";
// Ported from docs/dashboard-admin-prototype "Mula Admin v3" (lines 826–867). `v` is the prototype's renderVals() object (bound as V so prototype loop variables named v still work).
import { Fragment } from "react";

export function PrintView({ v: V }: { v: any }) {
  return (
    <>
      {V.p.print && (
        <>
          <div className="stg" style={{ display: "grid", gap: "24px" }}>
            <div className="ph" style={{ marginBottom: "0" }}>
              <div>
                <div className="eb">Print</div>
                <h1 className="h1">Invitations you can hold.</h1>
              </div>
              <div className="seg" role="tablist">
                {V.ptabs.map((x, _i) => (
                  <Fragment key={_i}>
                    <button className={x.on} data-v={x.id} onClick={V.setPtab} role="tab">
                      {x.n}
                    </button>
                  </Fragment>
                ))}
              </div>
            </div>
            {V.pCards && (
              <>
                <div className="split" style={{ gridTemplateColumns: "minmax(0,1.3fr) minmax(0,.9fr)", alignItems: "start" }}>
                  <div
                    style={{
                      display: "grid",
                      placeItems: "center",
                      padding: "clamp(24px,4vw,56px)",
                      borderRadius: "28px",
                      background: "var(--bg2)",
                      minHeight: "560px",
                    }}
                  >
                    <div
                      className="psheet"
                      style={{
                        aspectRatio: V.pr.ar,
                        width: V.pr.pw,
                        background: V.pr.bg,
                        color: V.pr.fg,
                        boxShadow: "var(--sh2)",
                        outline: `1px dashed color-mix(in oklab,${V.pr.fg} 22%,transparent)`,
                        outlineOffset: "-10px",
                        animation: "objin 1s var(--eo) both",
                      }}
                    >
                      {V.pr.front && (
                        <>
                          <div
                            style={{
                              position: "absolute",
                              inset: "0",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              textAlign: "center",
                              gap: "6%",
                              padding: "9%",
                            }}
                          >
                            <div className="arch" style={{ height: "42%", aspectRatio: "3/3.7", background: V.pr.photo }}></div>
                            <div style={{ display: "grid", gap: "8px" }}>
                              <div style={{ font: "500 9px var(--sans)", letterSpacing: ".2em", textTransform: "uppercase", opacity: ".7" }}>{V.pr.greet}</div>
                              <div style={{ fontFamily: V.pv.font, fontSize: V.pr.fs, lineHeight: "1" }}>
                                {V.ev.a}
                                {V.ev.amp && (
                                  <>
                                    <span className="it" style={{ color: V.pr.ac }}>
                                      &amp;
                                    </span>
                                  </>
                                )}
                                {V.ev.b}
                              </div>
                              <div style={{ fontSize: "10px", letterSpacing: ".14em", opacity: ".8" }}>{V.pr.date}</div>
                            </div>
                          </div>
                        </>
                      )}
                      {V.pr.back && (
                        <>
                          <div
                            style={{
                              position: "absolute",
                              inset: "0",
                              display: "grid",
                              alignContent: "center",
                              gap: "5%",
                              padding: "10%",
                              textAlign: "center",
                            }}
                          >
                            <div style={{ fontFamily: V.pv.font, fontStyle: "italic", fontSize: "15px" }}>{V.pr.line}</div>
                            <div style={{ display: "grid", gap: "10px" }}>
                              {V.pvEvents2.map((e, _i) => (
                                <Fragment key={_i}>
                                  <div>
                                    <div style={{ font: "500 8.5px var(--sans)", letterSpacing: ".18em", textTransform: "uppercase", opacity: ".7" }}>
                                      {e.name}
                                    </div>
                                    <div style={{ fontFamily: V.pv.font, fontSize: "17px" }}>
                                      {e.s} · {e.venue}
                                    </div>
                                  </div>
                                </Fragment>
                              ))}
                            </div>
                            <div style={{ display: "grid", justifyItems: "center", gap: "6px" }}>
                              <svg viewBox="0 0 29 29" width="56" height="56" shapeRendering="crispEdges">
                                <rect width="29" height="29" fill={V.pr.bg}></rect>
                                <path d={V.qrPath} fill={V.pr.fg}></path>
                              </svg>
                              <div style={{ fontSize: "9px", opacity: ".8" }}>
                                {V.pr.scan} · {V.pr.url}
                              </div>
                              <div style={{ fontSize: "9px", opacity: ".7" }}>{V.pr.reply}</div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="xs mut" style={{ marginTop: "18px" }}>
                      {V.pr.spec} · dashed line marks the 5 mm safe area
                    </div>
                  </div>
                  <div style={{ display: "grid", gap: "22px" }}>
                    <label className="f">
                      Invitation
                      <select className="inp" onChange={V.setPInv}>
                        {V.pInvOpts.map((o, _i) => (
                          <Fragment key={_i}>
                            <option value={o.id}>{o.n}</option>
                          </Fragment>
                        ))}
                      </select>
                    </label>
                    <div>
                      <div className="xs mut" style={{ marginBottom: "8px" }}>
                        Format
                      </div>
                      <div className="seg">
                        {V.pfmts.map((x, _i) => (
                          <Fragment key={_i}>
                            <button className={x.on} data-v={x.n} onClick={V.setPfmt}>
                              {x.n}
                            </button>
                          </Fragment>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="xs mut" style={{ marginBottom: "8px" }}>
                        Side
                      </div>
                      <div className="seg">
                        {V.psides.map((x, _i) => (
                          <Fragment key={_i}>
                            <button className={x.on} data-v={x.n} onClick={V.setPside}>
                              {x.n}
                            </button>
                          </Fragment>
                        ))}
                      </div>
                    </div>
                    <dl
                      style={{
                        display: "grid",
                        gridTemplateColumns: "auto 1fr",
                        gap: "10px 20px",
                        margin: "0",
                        fontSize: "14px",
                        borderTop: "1px solid var(--line)",
                        paddingTop: "16px",
                      }}
                    >
                      <dt className="mut">Size</dt>
                      <dd style={{ margin: "0" }}>{V.pr.spec}</dd>
                      <dt className="mut">Bleed</dt>
                      <dd style={{ margin: "0" }}>3 mm on every edge</dd>
                      <dt className="mut">Output</dt>
                      <dd style={{ margin: "0" }}>PDF, front and back as separate pages</dd>
                      <dt className="mut">Colour</dt>
                      <dd style={{ margin: "0" }}>Print-safe palette, fonts embedded</dd>
                    </dl>
                    <div className="row">
                      <button className="btn btn-p" onClick={V.printInv}>
                        Export PDF
                      </button>
                      <button className="btn" onClick={V.printInv}>
                        Print a test copy
                      </button>
                    </div>
                    <p className="xs mut" style={{ margin: "0" }}>
                      Tip: printers usually ask for 300 gsm uncoated card. The QR code on the back opens this invitation’s reply page.
                    </p>
                  </div>
                </div>
              </>
            )}
            {V.pLists && (
              <>
                <div className="split" style={{ gridTemplateColumns: "minmax(0,.9fr) minmax(0,1.3fr)", alignItems: "start" }}>
                  <div style={{ display: "grid", gap: "14px" }}>
                    {V.lscopes.map((s, _i) => (
                      <Fragment key={_i}>
                        <button
                          className={s.on}
                          style={{ textAlign: "left", padding: "18px 20px", display: "grid", gap: "2px" }}
                          data-v={s.id}
                          onClick={V.setLscope}
                        >
                          <span className="h2" style={{ fontSize: "20px" }}>
                            {s.n}
                          </span>
                          <span className="sm mut">{s.d}</span>
                        </button>
                      </Fragment>
                    ))}
                    <div className="row" style={{ marginTop: "8px" }}>
                      <button className="btn btn-p" onClick={V.printList}>
                        Export PDF
                      </button>
                      <button className="btn" onClick={V.csvList}>
                        Download CSV
                      </button>
                    </div>
                    <p className="xs mut" style={{ margin: "0" }}>
                      Exports use your full guest list.
                    </p>
                  </div>
                  <div style={{ padding: "clamp(18px,3vw,40px)", borderRadius: "28px", background: "var(--bg2)" }}>
                    <div
                      className="plist"
                      style={{
                        background: "#FFFFFF",
                        color: "#272523",
                        aspectRatio: "210/297",
                        width: "min(560px,100%)",
                        margin: "0 auto",
                        padding: "7% 8%",
                        boxShadow: "var(--sh2)",
                        overflow: "hidden",
                        fontSize: "11px",
                      }}
                    >
                      <div className="row sb" style={{ alignItems: "flex-end", borderBottom: "1px solid #272523", paddingBottom: "10px" }}>
                        <div>
                          <div style={{ font: "400 22px var(--serif)" }}>{V.plTitle}</div>
                          <div style={{ fontSize: "9px", color: "#6F685E", marginTop: "2px" }}>
                            {V.ev.host} · {V.ev.date}
                          </div>
                        </div>
                        <img src="/brand/admin/mula-symbol-ink.png" alt="" style={{ height: "18px" }} />
                      </div>
                      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
                        <thead>
                          <tr style={{ textAlign: "left", color: "#6F685E", fontSize: "8.5px", letterSpacing: ".1em", textTransform: "uppercase" }}>
                            {V.plCheck && (
                              <>
                                <th style={{ padding: "6px 4px", width: "18px" }}></th>
                              </>
                            )}
                            <th style={{ padding: "6px 4px" }}>Guest</th>
                            <th style={{ padding: "6px 4px" }}>Group</th>
                            <th style={{ padding: "6px 4px" }}>Party</th>
                            <th style={{ padding: "6px 4px" }}>Table</th>
                            <th style={{ padding: "6px 4px" }}>Reply</th>
                          </tr>
                        </thead>
                        <tbody>
                          {V.plRows.map((g, _i) => (
                            <Fragment key={_i}>
                              <tr style={{ borderTop: "1px solid #E3DED4" }}>
                                {V.plCheck && (
                                  <>
                                    <td style={{ padding: "6px 4px" }}>
                                      <span style={{ display: "inline-block", width: "10px", height: "10px", border: "1px solid #272523" }}></span>
                                    </td>
                                  </>
                                )}
                                <td style={{ padding: "6px 4px" }}>{g.name}</td>
                                <td style={{ padding: "6px 4px", color: "#6F685E" }}>{g.group}</td>
                                <td style={{ padding: "6px 4px" }}>{g.party}</td>
                                <td style={{ padding: "6px 4px" }}>{g.table}</td>
                                <td style={{ padding: "6px 4px", color: "#6F685E" }}>{g.st}</td>
                              </tr>
                            </Fragment>
                          ))}
                        </tbody>
                      </table>
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
