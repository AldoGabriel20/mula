// @ts-nocheck
/* eslint-disable */
"use client";
// Ported from docs/dashboard-admin-prototype "Mula Admin v3" (lines 899–914). `v` is the prototype's renderVals() object (bound as V so prototype loop variables named v still work).
import { Fragment } from "react";

export function BillingView({ v: V }: { v: any }) {
  return (
    <>
      {V.p.billing && (
        <>
          <div className="stg" style={{ display: "grid", gap: "18px" }}>
            <div className="ph" style={{ marginBottom: "8px" }}>
              <div>
                <div className="eb">Purchases</div>
                <h1 className="h1">Your package and payments.</h1>
              </div>
              <button className="btn" data-p="addons" onClick={V.go}>
                Add-ons
              </button>
            </div>
            <section
              className="card pcard"
              style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.2fr)", gap: "clamp(20px,4vw,48px)", padding: "clamp(22px,3vw,36px)" }}
              data-pc="1"
            >
              <div style={{ display: "grid", gap: "10px", alignContent: "start" }}>
                <div className="eb">{V.ev.host}</div>
                <div className="h1" style={{ fontSize: "clamp(30px,3.4vw,44px)" }}>
                  {V.pkgName}
                </div>
                <div className="sm mut">{V.billingLine}</div>
                <div className="row" style={{ marginTop: "8px" }}>
                  {V.aiLocked && (
                    <>
                      <button className="btn btn-p" onClick={V.upgrade}>
                        Upgrade to Advanced
                      </button>
                    </>
                  )}
                  <button className="btn" data-p="packages" onClick={V.go}>
                    Compare packages
                  </button>
                </div>
              </div>
              <div style={{ display: "grid", gap: "16px", alignContent: "center" }}>
                {V.usage.map((u, _i) => (
                  <Fragment key={_i}>
                    <div style={{ display: "grid", gap: "6px" }}>
                      <div className="row sb sm">
                        <span>{u.n}</span>
                        <span className="mut" style={{ fontVariantNumeric: "tabular-nums" }}>
                          {u.v}
                        </span>
                      </div>
                      <div className="bar">
                        <i style={{ width: u.w, background: u.c }}></i>
                      </div>
                    </div>
                  </Fragment>
                ))}
              </div>
            </section>
            <div className="eb" style={{ marginTop: "18px" }}>
              Purchase history
            </div>
            <div className="row">
              <input
                className="inp"
                style={{ flex: "1", minWidth: "200px", maxWidth: "340px" }}
                placeholder="Search by ID or item"
                value={V.tq}
                onChange={V.setTq}
                aria-label="Search payments"
              />
              {V.tfs.map((f, _i) => (
                <Fragment key={_i}>
                  <button className={f.on} data-v={f.n} onClick={V.setTf}>
                    {f.n}
                  </button>
                </Fragment>
              ))}
            </div>
            {V.noTx && (
              <>
                <p className="mut" style={{ padding: "24px 0" }}>
                  No payments match this filter.
                </p>
              </>
            )}
            <div className="card dt" style={{ padding: "4px 10px" }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Date</th>
                    <th>Item</th>
                    <th>Method</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {V.txs.map((t, _i) => (
                    <Fragment key={_i}>
                      <tr className="rw" data-v={t.id} onClick={V.openTx}>
                        <td className="mut" style={{ fontVariantNumeric: "tabular-nums" }}>
                          {t.id}
                        </td>
                        <td>{t.date}</td>
                        <td>{t.desc}</td>
                        <td className="mut">{t.method}</td>
                        <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{t.amt}</td>
                        <td>
                          <span className={`bdg ${t.cls}`}>{t.st}</span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button className="btn btn-t btn-s" data-v={t.id} onClick={V.openTx}>
                            Receipt
                          </button>
                        </td>
                      </tr>
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mo">
              {V.txs.map((t, _i) => (
                <Fragment key={_i}>
                  <button
                    style={{ all: "unset", display: "block", width: "100%", padding: "16px 0", borderTop: "1px solid var(--line)", cursor: "pointer" }}
                    data-v={t.id}
                    onClick={V.openTx}
                  >
                    <span className="row sb">
                      <b style={{ fontWeight: "500" }}>{t.desc}</b>
                      <span style={{ fontVariantNumeric: "tabular-nums" }}>{t.amt}</span>
                    </span>
                    <span className="row sb xs mut" style={{ marginTop: "6px" }}>
                      <span>
                        {t.date} · {t.id}
                      </span>
                      <span className={`bdg ${t.cls}`}>{t.st}</span>
                    </span>
                  </button>
                </Fragment>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
