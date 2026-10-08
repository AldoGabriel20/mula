// @ts-nocheck
/* eslint-disable */
"use client";
// Ported from docs/dashboard-admin-prototype "Mula Admin v3" (lines 807–824). `v` is the prototype's renderVals() object (bound as V so prototype loop variables named v still work).
import { Fragment } from "react";

export function PackagesView({ v: V }: { v: any }) {
  return (
    <>
      {V.p.packages && (
        <>
          <div className="stg" style={{ display: "grid", gap: "30px" }}>
            <div style={{ display: "grid", gap: "14px", maxWidth: "760px" }}>
              <div className="eb">Packages · per event, no subscription</div>
              <h1 className="h1">Pay once, for the celebration you’re planning.</h1>
              <p className="lede">
                Each package covers one event from the first invitation to the keepsake afterwards. Upgrade at any point and only pay the difference.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,280px),1fr))", gap: "18px", alignItems: "stretch" }}>
              {V.pkgs.map((k, _i) => (
                <Fragment key={_i}>
                  <article className="pkgc" style={{}}>
                    <div className="row sb">
                      <span className="eb" style={{ color: "inherit", opacity: ".7" }}>
                        {k.n}
                      </span>
                      {k.cur && (
                        <>
                          <span className="bdg" style={{ background: "var(--dot)", color: "#fff" }}>
                            Your package
                          </span>
                        </>
                      )}
                    </div>
                    <div>
                      <div className="num" style={{ fontSize: "clamp(40px,4vw,54px)" }}>
                        {k.price}
                      </div>
                      <div className="sm" style={{ opacity: ".7", marginTop: "6px" }}>
                        once, for this event
                      </div>
                    </div>
                    <p className="serif it" style={{ margin: "0", fontSize: "19px", fontWeight: "300" }}>
                      {k.sub}
                    </p>
                    <ul style={{ listStyle: "none", margin: "0", padding: "0", display: "grid", gap: "0", fontSize: "14px" }}>
                      {k.items.map((it, _i) => (
                        <Fragment key={_i}>
                          <li style={{ padding: "10px 0", borderTop: "1px solid color-mix(in oklab,currentColor 14%,transparent)" }}>{it}</li>
                        </Fragment>
                      ))}
                    </ul>
                    <button
                      className="btn"
                      style={{ marginTop: "auto", borderColor: "currentColor", color: "inherit" }}
                      disabled={k.dis}
                      data-v={k.id}
                      onClick={V.pickPkg}
                    >
                      {k.cta}
                    </button>
                  </article>
                </Fragment>
              ))}
            </div>
            <div className="duo" style={{ borderTop: "1px solid var(--line)", paddingTop: "28px" }}>
              <div>
                <div className="h2">Need just one thing?</div>
                <p className="sm mut" style={{ margin: "6px 0 0" }}>
                  Add-ons work with any package: a custom domain, more photos, QR check-in.
                </p>
                <button className="btn btn-s" style={{ marginTop: "14px" }} data-p="addons" onClick={V.go}>
                  Browse add-ons
                </button>
              </div>
              <div>
                <div className="h2">What happens after the event?</div>
                <p className="sm mut" style={{ margin: "6px 0 0" }}>
                  Your invitation stays online as a keepsake for 12 months, with wishes, photos and attendance. You can download everything anytime.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
