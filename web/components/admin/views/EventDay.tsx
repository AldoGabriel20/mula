// @ts-nocheck
/* eslint-disable */
"use client";
// Ported from docs/dashboard-admin-prototype "Mula Admin v3" (lines 696–711). `v` is the prototype's renderVals() object (bound as V so prototype loop variables named v still work).
import { Fragment } from "react";

export function EventDayView({ v: V }: { v: any }) {
  return (
    <>
      {V.p.eventday && (
        <>
          <div className="stg" style={{ display: "grid", gap: "18px" }}>
            <div className="row sb" style={{ padding: "14px 14px 14px 22px", borderRadius: "99px", border: "1px solid var(--line)", background: "var(--sf)" }}>
              <span className="row" style={{ gap: "12px", flexWrap: "nowrap" }}>
                {V.sim && (
                  <>
                    <span className="ldot"></span>
                  </>
                )}
                <span className="sm">
                  <b style={{ fontWeight: "600" }}>Rehearsal.</b>{" "}
                  <span className="mut">
                    Event day opens on {V.ev.day} {V.ev.mon}. Try it now so you know how it works.
                  </span>
                </span>
              </span>
              <button className="btn btn-p btn-s" onClick={V.toggleSim}>
                {V.simLabel}
              </button>
            </div>
            <div className="ph" style={{ margin: "16px 0 8px", alignItems: "flex-end" }}>
              <div>
                <div className="eb">Event day · Reception · 18:00</div>
                <div className="row" style={{ alignItems: "flex-end", gap: "18px", marginTop: "12px" }}>
                  <span className="num" style={{ fontSize: "clamp(84px,11vw,150px)" }}>
                    {V.checked}
                  </span>
                  <span style={{ paddingBottom: "18px" }}>
                    <span className="h2">have arrived</span>
                    <br />
                    <span className="sm mut">
                      of {V.expected} expected · {V.notYet} still on their way
                    </span>
                  </span>
                </div>
              </div>
              <div className="row">
                <button className="btn" data-p="checkin" onClick={V.go}>
                  Open scanner
                </button>
                <button className="btn" data-p="live" onClick={V.go}>
                  Stream
                </button>
              </div>
            </div>
            <div style={{ height: "6px", borderRadius: "9px", background: "var(--line)", overflow: "hidden" }}>
              <div style={{ height: "100%", background: "var(--ink)", width: V.arrPct, transition: "width .8s var(--eo)" }}></div>
            </div>
            <div className="ops" style={{ marginTop: "14px" }}>
              <div className="card w2">
                <div className="row sb">
                  <span className="eb">Arrivals every 15 minutes</span>
                  <span className="xs mut">Peak at 18:15</span>
                </div>
                <div className="bars" style={{ marginTop: "22px" }}>
                  {V.bars.map((b, _i) => (
                    <Fragment key={_i}>
                      <i style={{ height: b.h }} title={b.l}></i>
                    </Fragment>
                  ))}
                </div>
                <div className="row xs mut" style={{ justifyContent: "space-between", marginTop: "8px", flexWrap: "nowrap" }}>
                  {V.bars.map((b, _i) => (
                    <Fragment key={_i}>
                      <span>{b.l}</span>
                    </Fragment>
                  ))}
                </div>
              </div>
              <div className="card">
                <div className="eb">Just arrived</div>
                <div style={{ marginTop: "10px" }}>
                  {V.feed.map((f, _i) => (
                    <Fragment key={_i}>
                      <div className="row" style={{ padding: "10px 0", borderTop: "1px solid var(--line)", flexWrap: "nowrap", gap: "12px" }}>
                        <span className="av" style={{ background: f.c, border: "0" }}>
                          {f.i}
                        </span>
                        <span style={{ flex: "1", minWidth: "0" }} className="sm">
                          <b style={{ fontWeight: "500" }}>{f.n}</b>
                          <br />
                          <span className="mut xs">{f.t}</span>
                        </span>
                        <span className="xs mut" style={{ fontVariantNumeric: "tabular-nums" }}>
                          {f.w}
                        </span>
                      </div>
                    </Fragment>
                  ))}
                </div>
              </div>
              <div className="card">
                <div className="eb">Needs attention</div>
                <div style={{ display: "grid", gap: "12px", marginTop: "14px" }}>
                  {V.attention.map((x, _i) => (
                    <Fragment key={_i}>
                      <div className="row" style={{ flexWrap: "nowrap", gap: "12px", alignItems: "flex-start" }}>
                        {x.tag && <span className={`bdg ${x.cls}`}>{x.tag}</span>}
                        <span className="sm">{x.text}</span>
                      </div>
                    </Fragment>
                  ))}
                </div>
              </div>
              <div className="card">
                <div className="eb">Ushers on duty</div>
                <div style={{ marginTop: "10px" }}>
                  {V.ushers.map((u, _i) => (
                    <Fragment key={_i}>
                      <div className="row" style={{ padding: "10px 0", borderTop: "1px solid var(--line)", flexWrap: "nowrap", gap: "12px" }}>
                        <span className="av" style={{ background: u.c, border: "0" }}>
                          {u.i}
                        </span>
                        <span style={{ flex: "1" }} className="sm">
                          {u.n}
                          <br />
                          <span className="xs mut">{u.r}</span>
                        </span>
                        <span className="bdg b-ok">On</span>
                      </div>
                    </Fragment>
                  ))}
                  {!V.ushers.length && <div className="sm mut" style={{ padding: "10px 0", borderTop: "1px solid var(--line)" }}>No ushers assigned yet.</div>}
                </div>
              </div>
              <div className="card">
                <div className="eb">Live stream</div>
                <div className="row" style={{ marginTop: "14px", gap: "10px" }}>
                  <span className={`bdg ${V.liveCls}`}>{V.live}</span>
                </div>
                <div className="h2" style={{ marginTop: "12px", fontSize: "22px" }}>
                  {V.liveTitle}
                </div>
                <p className="sm mut" style={{ margin: "4px 0 0" }}>
                  {V.liveSub}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
