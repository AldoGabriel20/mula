// @ts-nocheck
/* eslint-disable */
"use client";
// Ported from docs/dashboard-admin-prototype "Mula Admin v3" (lines 713–758). `v` is the prototype's renderVals() object (bound as V so prototype loop variables named v still work).
import { Fragment } from "react";

export function CheckinView({ v: V }: { v: any }) {
  return (
    <>
      {V.p.checkin && (
        <>
          <div className="stg" style={{ display: "grid", gap: "24px" }}>
            <div className="ph" style={{ marginBottom: "0" }}>
              <div>
                <div className="eb">Check-in</div>
                <h1 className="h1">Welcome everyone smoothly at the door.</h1>
              </div>
              <div className="seg" role="tablist">
                {V.ckTabs.map((t, _i) => (
                  <Fragment key={_i}>
                    <button className={t.on} data-v={t.id} onClick={V.setCk} role="tab">
                      {t.n}
                    </button>
                  </Fragment>
                ))}
              </div>
            </div>
            {V.ckQr && (
              <>
                <div className="row" style={{ gap: "6px" }}>
                  {V.qrTabs.map((q, _i) => (
                    <Fragment key={_i}>
                      <button className={q.on} data-v={q.id} onClick={V.setQr}>
                        {q.n}
                      </button>
                    </Fragment>
                  ))}
                </div>
                <div className="split" style={{ alignItems: "center", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)" }}>
                  <div style={{ display: "grid", placeItems: "center", padding: "clamp(20px,4vw,48px)", borderRadius: "28px", background: "var(--bg2)" }}>
                    <div className="sign">
                      <img src="/brand/admin/mula-symbol-ink.png" alt="" style={{ height: "26px", opacity: ".85" }} />
                      <div style={{ font: "500 11px var(--sans)", letterSpacing: ".16em", textTransform: "uppercase", color: "#6F685E" }}>{V.qrTitle}</div>
                      <svg viewBox="0 0 29 29" width="210" height="210" shapeRendering="crispEdges" role="img" aria-label="QR code">
                        <rect width="29" height="29" fill="#FBFAF7"></rect>
                        <path d={V.qrPath} fill="#272523"></path>
                      </svg>
                      <div className="serif" style={{ fontSize: "28px", lineHeight: "1.05" }}>
                        {V.ev.host}
                      </div>
                      <div style={{ fontSize: "12px", letterSpacing: ".22em", color: "#6F685E" }}>{V.ev.dshort}</div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gap: "22px" }}>
                    <p className="lede">{V.qrHint}</p>
                    <div className="row">
                      <button className="btn btn-p" onClick={V.qrDl}>
                        Download
                      </button>
                      <button className="btn" onClick={V.qrPrint}>
                        Print
                      </button>
                      <button className="btn btn-t" onClick={V.qrRegen}>
                        Regenerate
                      </button>
                    </div>
                    <ol style={{ listStyle: "none", padding: "0", margin: "8px 0 0", display: "grid" }}>
                      <li
                        className="row"
                        style={{ padding: "16px 0", borderTop: "1px solid var(--line)", flexWrap: "nowrap", gap: "18px", alignItems: "flex-start" }}
                      >
                        <span className="num" style={{ fontSize: "30px", color: "var(--dot)" }}>
                          1
                        </span>
                        <span>Guests open their phone camera and point it at the code. No app needed.</span>
                      </li>
                      <li
                        className="row"
                        style={{ padding: "16px 0", borderTop: "1px solid var(--line)", flexWrap: "nowrap", gap: "18px", alignItems: "flex-start" }}
                      >
                        <span className="num" style={{ fontSize: "30px", color: "var(--dot)" }}>
                          2
                        </span>
                        <span>The invitation opens, or for check-in codes, their personal pass appears.</span>
                      </li>
                      <li
                        className="row"
                        style={{ padding: "16px 0", borderTop: "1px solid var(--line)", flexWrap: "nowrap", gap: "18px", alignItems: "flex-start" }}
                      >
                        <span className="num" style={{ fontSize: "30px", color: "var(--dot)" }}>
                          3
                        </span>
                        <span>At the entrance, an usher scans the pass and sees their table.</span>
                      </li>
                    </ol>
                    <p className="xs mut" style={{ margin: "0" }}>
                      Works on printed cards, entrance signage and table cards. Regenerating makes earlier codes stop working.
                    </p>
                  </div>
                </div>
              </>
            )}
            {V.ckUsh && (
              <>
                <div className="split" style={{ alignItems: "start" }}>
                  <div style={{ display: "grid", gap: "28px" }}>
                    <section>
                      <div className="row sb" style={{ marginBottom: "6px" }}>
                        <h2 className="h2">Ushers</h2>
                        <button className="btn btn-s" onClick={V.toastUsher}>
                          Add usher
                        </button>
                      </div>
                      {V.ushers.map((u, _i) => (
                        <Fragment key={_i}>
                          <div className="row" style={{ padding: "14px 0", borderTop: "1px solid var(--line)", flexWrap: "nowrap", gap: "14px" }}>
                            <span className="av" style={{ background: u.c, border: "0" }}>
                              {u.i}
                            </span>
                            <div style={{ flex: "1", minWidth: "0" }}>
                              <b style={{ fontWeight: "500" }}>{u.n}</b>
                              <div className="xs mut">{u.ev}</div>
                            </div>
                            <span className="bdg b-mu">{u.r}</span>
                          </div>
                        </Fragment>
                      ))}
                    </section>
                    <section style={{ display: "grid", gap: "16px" }}>
                      <h2 className="h2">What ushers can do</h2>
                      {V.perms.map((x, _i) => (
                        <Fragment key={_i}>
                          <div className="row sb" style={{ gap: "16px", flexWrap: "nowrap" }}>
                            <div>
                              <div style={{ fontWeight: "500", fontSize: "14px" }}>{x.n}</div>
                              <div className="sm mut">{x.d}</div>
                            </div>
                            <button className={x.on} role="switch" aria-checked={x.ar} aria-label={x.n} data-v={x.k} onClick={V.togPerm}></button>
                          </div>
                        </Fragment>
                      ))}
                    </section>
                  </div>
                  <div style={{ display: "grid", justifyItems: "center", gap: "10px" }}>
                    <span className="eb">The usher’s phone</span>
                    <div
                      style={{
                        border: "9px solid #1B1A19",
                        borderRadius: "40px",
                        background: "#12110F",
                        color: "#EEE9DF",
                        padding: "22px 18px",
                        display: "grid",
                        gap: "14px",
                        width: "min(340px,100%)",
                        boxShadow: "var(--sh2)",
                      }}
                    >
                      <div className="row sb">
                        <b style={{ fontWeight: "500" }}>Reception</b>
                        <span className="bdg" style={{ background: "rgba(163,194,158,.15)", color: "#A3C29E" }}>
                          {V.checked} / {V.expected} in
                        </span>
                      </div>
                      <div
                        style={{
                          aspectRatio: "1",
                          borderRadius: "20px",
                          background: "radial-gradient(circle at 50% 40%,#2A2622,#0D0C0B)",
                          display: "grid",
                          placeItems: "center",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: "62%",
                            aspectRatio: "1",
                            border: "2px solid #B8AB97",
                            borderRadius: "18px",
                            display: "grid",
                            placeItems: "center",
                            fontSize: "12px",
                            color: "#A39B8E",
                          }}
                        >
                          Point at the guest’s code
                        </div>
                        <div
                          style={{
                            position: "absolute",
                            left: "19%",
                            right: "19%",
                            height: "2px",
                            background: "#B8AB97",
                            top: "30%",
                            animation: "floaty 2.4s ease-in-out infinite",
                            boxShadow: "0 0 18px #B8AB97",
                          }}
                        ></div>
                      </div>
                      <input
                        className="inp"
                        style={{ background: "#211F1D", borderColor: "rgba(238,233,223,.15)", color: "#EEE9DF" }}
                        placeholder="Or search by name"
                        value={V.uq}
                        onChange={V.setUq}
                        aria-label="Find a guest"
                      />
                      {V.uguests.map((g, _i) => (
                        <Fragment key={_i}>
                          <div className="row sb" style={{ borderTop: "1px solid rgba(238,233,223,.1)", paddingTop: "12px", flexWrap: "nowrap" }}>
                            <div>
                              <b style={{ fontWeight: "500" }}>{g.name}</b>
                              <div className="xs" style={{ color: "#A39B8E" }}>
                                Table {g.table} · {g.party} people
                              </div>
                            </div>
                            <button
                              className="btn btn-s"
                              style={{ background: "#EEE9DF", color: "#12110F", border: "0", minHeight: "44px" }}
                              data-v={g.id}
                              onClick={V.checkIn}
                            >
                              Check in
                            </button>
                          </div>
                        </Fragment>
                      ))}
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
