// @ts-nocheck
/* eslint-disable */
"use client";
// Ported from docs/dashboard-admin-prototype "Mula Admin v3" (lines 968–982). `v` is the prototype's renderVals() object (bound as V so prototype loop variables named v still work).
import { Fragment } from "react";

export function SystemView({ v: V }: { v: any }) {
  return (
    <>
      {V.p.system && (
        <>
          <div className="stg" style={{ display: "grid", gap: "40px" }}>
            <div>
              <div className="eb">Design language</div>
              <h1 className="h1" style={{ marginTop: "12px" }}>
                Built from the arch and the dot.
              </h1>
              <p className="lede" style={{ marginTop: "14px" }}>
                The arch marks a threshold, the beginning of something. The dot is you, here, now. Both appear across Mula as progress, frames, markers and
                selected states.
              </p>
            </div>
            <section className="duo">
              <div>
                <div className="eb" style={{ marginBottom: "14px" }}>
                  Light
                </div>
                <div className="row" style={{ gap: "12px", alignItems: "flex-start" }}>
                  {V.swL.map((s, _i) => (
                    <Fragment key={_i}>
                      <div style={{ width: "92px" }}>
                        <div style={{ height: "64px", borderRadius: "12px", border: "1px solid var(--line)", background: s.c }}></div>
                        <div className="xs" style={{ marginTop: "6px" }}>
                          {s.n}
                        </div>
                        <div className="xs mut">{s.c}</div>
                      </div>
                    </Fragment>
                  ))}
                </div>
              </div>
              <div>
                <div className="eb" style={{ marginBottom: "14px" }}>
                  Dark
                </div>
                <div className="row" style={{ gap: "12px", alignItems: "flex-start" }}>
                  {V.swD.map((s, _i) => (
                    <Fragment key={_i}>
                      <div style={{ width: "92px" }}>
                        <div style={{ height: "64px", borderRadius: "12px", border: "1px solid var(--line)", background: s.c }}></div>
                        <div className="xs" style={{ marginTop: "6px" }}>
                          {s.n}
                        </div>
                        <div className="xs mut">{s.c}</div>
                      </div>
                    </Fragment>
                  ))}
                </div>
              </div>
            </section>
            <section style={{ display: "grid", gap: "10px", borderTop: "1px solid var(--line)", paddingTop: "28px" }}>
              <div className="eb">Type</div>
              <div className="d1" style={{ fontSize: "clamp(48px,6vw,88px)" }}>
                Newsreader Light
              </div>
              <div className="h1">For the moment, the names, the numbers.</div>
              <div style={{ fontSize: "17px" }}>Instrument Sans for everything you operate: navigation, forms, tables and labels.</div>
              <div className="eb">Eyebrow · 11.5 / tracked</div>
            </section>
            <section style={{ display: "grid", gap: "16px", borderTop: "1px solid var(--line)", paddingTop: "28px" }}>
              <div className="eb">Components</div>
              <div className="row">
                <button className="btn btn-p">Primary</button>
                <button className="btn">Secondary</button>
                <button className="btn btn-t">Quiet</button>
                <span className="bdg b-ok">Attending</span>
                <span className="bdg b-wt">Pending</span>
                <span className="bdg b-no">Not attending</span>
                <span className="bdg b-in">Invited</span>
                <span className="bdg b-mu">Draft</span>
                <button className="tog on" role="switch" aria-checked="true" aria-label="Example switch" onClick={V.tg}></button>
                <div className="seg">
                  <button className="on">Selected</button>
                  <button>Option</button>
                </div>
              </div>
            </section>
            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,230px),1fr))", gap: "16px" }}>
              <div className="card" style={{ display: "grid", gap: "10px" }}>
                <div className="eb">Loading</div>
                <div className="sk" style={{ height: "18px", width: "70%" }}></div>
                <div className="sk" style={{ height: "12px" }}></div>
                <div className="sk" style={{ height: "12px", width: "85%" }}></div>
                <div className="row xs mut">
                  <span className="ldot" style={{ background: "var(--dot)" }}></span>Gathering your guests…
                </div>
              </div>
              <div className="card" style={{ display: "grid", gap: "8px", alignContent: "start" }}>
                <div className="eb">Empty</div>
                <div className="h2">Your guest list starts here.</div>
                <p className="sm mut" style={{ margin: "0" }}>
                  Say what’s missing, why it matters, and what to do.
                </p>
                <button className="btn btn-p btn-s" style={{ justifySelf: "start" }} onClick={V.openAddGuest}>
                  Add your first guest
                </button>
              </div>
              <div className="card" style={{ display: "grid", gap: "8px", alignContent: "start" }}>
                <div className="eb">Error</div>
                <div className="h2">We couldn’t save your changes.</div>
                <p className="sm mut" style={{ margin: "0" }}>
                  Your connection dropped for a moment. Nothing was lost.
                </p>
                <div className="row">
                  <button className="btn btn-p btn-s" onClick={V.save}>
                    Try again
                  </button>
                  <button className="btn btn-t btn-s">Go back</button>
                </div>
              </div>
              <div className="card" style={{ display: "grid", gap: "10px", alignContent: "start", justifyItems: "start" }}>
                <div className="eb">Success</div>
                <svg width="64" height="40" viewBox="0 0 64 40" fill="none">
                  <path
                    d="M8 38V24a24 24 0 0 1 48 0v14"
                    stroke="var(--ink)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    pathLength="100"
                    style={{ strokeDasharray: "100", animation: "drawp 1.4s var(--eo) both" }}
                  ></path>
                  <circle
                    cx="8"
                    cy="34"
                    r="5"
                    fill="var(--dot)"
                    style={{ animation: "pop .6s var(--sp) both 1s", transformBox: "fill-box", transformOrigin: "center" }}
                  ></circle>
                </svg>
                <div className="h2">Your invitation is live.</div>
                <button className="btn btn-s" onClick={V.showToast}>
                  Show a toast
                </button>
              </div>
            </section>
          </div>
        </>
      )}
    </>
  );
}
