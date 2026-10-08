// @ts-nocheck
/* eslint-disable */
"use client";
// Ported from docs/dashboard-admin-prototype "Mula Admin v3" (lines 959–966). `v` is the prototype's renderVals() object (bound as V so prototype loop variables named v still work).
import { Fragment } from "react";

export function TermsView({ v: V }: { v: any }) {
  return (
    <>
      {V.p.terms && (
        <>
          <div
            className="stg"
            style={{ display: "grid", gridTemplateColumns: "minmax(0,220px) minmax(0,680px)", gap: "clamp(24px,5vw,80px)", alignItems: "start" }}
          >
            <nav className="hidem" style={{ position: "sticky", top: "96px", display: "grid", gap: "8px" }}>
              <div className="eb" style={{ marginBottom: "6px" }}>
                Contents
              </div>
              {V.terms.map((t, _i) => (
                <Fragment key={_i}>
                  <span className="sm mut">
                    {t.no} {t.h}
                  </span>
                </Fragment>
              ))}
            </nav>
            <article style={{ display: "grid", gap: "30px" }}>
              <div>
                <div className="eb">Terms &amp; Conditions</div>
                <h1 className="h1" style={{ marginTop: "12px" }}>
                  The agreement between us.
                </h1>
                <p className="sm mut" style={{ marginTop: "12px" }}>
                  Last updated 1 September 2026 · About 3 minutes to read
                </p>
              </div>
              {V.terms.map((t, _i) => (
                <Fragment key={_i}>
                  <section style={{ borderTop: "1px solid var(--line)", paddingTop: "22px" }}>
                    <div className="xs mut">{t.no}</div>
                    <h2 className="h2" style={{ margin: "6px 0 10px" }}>
                      {t.h}
                    </h2>
                    <p style={{ margin: "0", fontSize: "17px", lineHeight: "1.65", color: "var(--ink2)", textWrap: "pretty" }}>{t.b}</p>
                  </section>
                </Fragment>
              ))}
            </article>
          </div>
        </>
      )}
    </>
  );
}
