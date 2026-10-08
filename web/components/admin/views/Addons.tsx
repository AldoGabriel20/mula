// @ts-nocheck
/* eslint-disable */
"use client";
// Ported from docs/dashboard-admin-prototype "Mula Admin v3" (lines 869–878). `v` is the prototype's renderVals() object (bound as V so prototype loop variables named v still work).
import { Fragment } from "react";

export function AddonsView({ v: V }: { v: any }) {
  return (
    <>
      {V.p.addons && (
        <>
          <div className="stg" style={{ display: "grid", gap: "10px", maxWidth: "1080px" }}>
            <div className="ph">
              <div>
                <div className="eb">Add-ons</div>
                <h1 className="h1">Only as much as your celebration needs.</h1>
              </div>
              <button className="btn" data-p="cart" onClick={V.go}>
                Cart · {V.cartCount}
              </button>
            </div>
            <div className="eb">Available</div>
            <div>
              {V.aoAvail.map((a, _i) => (
                <Fragment key={_i}>
                  <div className="ao">
                    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,220px) minmax(0,1fr)", gap: "8px 28px", alignItems: "baseline" }}>
                      <div className="h2">{a.name}</div>
                      <div className="mut">
                        {a.desc}
                        <div className="xs" style={{ marginTop: "4px" }}>
                          {a.cat}
                        </div>
                      </div>
                    </div>
                    <div className="row" style={{ gap: "16px", flexWrap: "nowrap" }}>
                      <span style={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{a.price}</span>
                      <button className="btn btn-s" disabled={a.dis} data-v={a.id} onClick={V.addCart}>
                        {a.cta}
                      </button>
                    </div>
                  </div>
                </Fragment>
              ))}
            </div>
            <div className="eb" style={{ marginTop: "36px" }}>
              Already yours
            </div>
            <div>
              {V.aoOwned.map((a, _i) => (
                <Fragment key={_i}>
                  <div className="ao">
                    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,220px) minmax(0,1fr)", gap: "8px 28px", alignItems: "baseline" }}>
                      <div className="h2">{a.name}</div>
                      <div className="mut">{a.desc}</div>
                    </div>
                    <span className={`bdg ${a.c}`}>{a.st}</span>
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
