// @ts-nocheck
/* eslint-disable */
"use client";
// Ported from docs/dashboard-admin-prototype "Mula Admin v3" (lines 1159–1169). `v` is the prototype's renderVals() object (bound as V so prototype loop variables named v still work).
import { Fragment } from "react";

export function PrintRootView({ v: V }: { v: any }) {
  return (
    <>
      <div className="print-root" aria-hidden="true">
        {V.pmInvite && (
          <>
            <div className="psheet" style={{ width: V.pr.wmm, height: V.pr.hmm, background: V.pr.bg, color: V.pr.fg }}>
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
                  padding: "10%",
                }}
              >
                <div className="arch" style={{ height: "42%", aspectRatio: "3/3.7", background: V.pr.photo }}></div>
                <div style={{ display: "grid", gap: "3mm" }}>
                  <div style={{ font: "500 7pt var(--sans)", letterSpacing: ".2em", textTransform: "uppercase", opacity: ".7" }}>{V.pr.greet}</div>
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
                  <div style={{ fontSize: "8pt", letterSpacing: ".14em", opacity: ".8" }}>{V.pr.date}</div>
                </div>
              </div>
            </div>
            <div className="psheet" style={{ width: V.pr.wmm, height: V.pr.hmm, background: V.pr.bg, color: V.pr.fg }}>
              <div style={{ position: "absolute", inset: "0", display: "grid", alignContent: "center", gap: "6mm", padding: "12%", textAlign: "center" }}>
                <div style={{ fontFamily: V.pv.font, fontStyle: "italic", fontSize: "12pt" }}>{V.pr.line}</div>
                {V.pvEvents2.map((e, _i) => (
                  <Fragment key={_i}>
                    <div>
                      <div style={{ font: "500 6.5pt var(--sans)", letterSpacing: ".18em", textTransform: "uppercase", opacity: ".7" }}>{e.name}</div>
                      <div style={{ fontFamily: V.pv.font, fontSize: "12pt" }}>
                        {e.s} · {e.venue}
                      </div>
                    </div>
                  </Fragment>
                ))}
                <div style={{ display: "grid", justifyItems: "center", gap: "2mm" }}>
                  <svg viewBox="0 0 29 29" width="70" height="70" shapeRendering="crispEdges">
                    <rect width="29" height="29" fill={V.pr.bg}></rect>
                    <path d={V.qrPath} fill={V.pr.fg}></path>
                  </svg>
                  <div style={{ fontSize: "7pt", opacity: ".8" }}>
                    {V.pr.scan} · {V.pr.url}
                  </div>
                  <div style={{ fontSize: "7pt", opacity: ".7" }}>{V.pr.reply}</div>
                </div>
              </div>
            </div>
          </>
        )}
        {V.pmList && (
          <>
            <div className="plist">
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "1pt solid #272523", paddingBottom: "3mm" }}
              >
                <div>
                  <div style={{ font: "400 20pt var(--serif)" }}>{V.plTitle}</div>
                  <div style={{ fontSize: "8pt", color: "#6F685E" }}>
                    {V.ev.host} · {V.ev.date}
                  </div>
                </div>
                <img src="/brand/admin/mula-symbol-ink.png" alt="" style={{ height: "7mm" }} />
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "4mm" }}>
                <thead>
                  <tr style={{ textAlign: "left", fontSize: "7pt", letterSpacing: ".1em", textTransform: "uppercase", color: "#6F685E" }}>
                    {V.plCheck && (
                      <>
                        <th style={{ padding: "2mm 1mm", width: "6mm" }}></th>
                      </>
                    )}
                    <th style={{ padding: "2mm 1mm" }}>Guest</th>
                    <th style={{ padding: "2mm 1mm" }}>Group</th>
                    <th style={{ padding: "2mm 1mm" }}>Party</th>
                    <th style={{ padding: "2mm 1mm" }}>Table</th>
                    <th style={{ padding: "2mm 1mm" }}>Reply</th>
                    <th style={{ padding: "2mm 1mm" }}>Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {V.plRows.map((g, _i) => (
                    <Fragment key={_i}>
                      <tr style={{ borderTop: ".5pt solid #CFC8BB", breakInside: "avoid" }}>
                        {V.plCheck && (
                          <>
                            <td style={{ padding: "2mm 1mm" }}>
                              <span style={{ display: "inline-block", width: "3.5mm", height: "3.5mm", border: ".75pt solid #272523" }}></span>
                            </td>
                          </>
                        )}
                        <td style={{ padding: "2mm 1mm" }}>{g.name}</td>
                        <td style={{ padding: "2mm 1mm" }}>{g.group}</td>
                        <td style={{ padding: "2mm 1mm" }}>{g.party}</td>
                        <td style={{ padding: "2mm 1mm" }}>{g.table}</td>
                        <td style={{ padding: "2mm 1mm" }}>{g.st}</td>
                        <td style={{ padding: "2mm 1mm" }}>{g.phone}</td>
                      </tr>
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}
