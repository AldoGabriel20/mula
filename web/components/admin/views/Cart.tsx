// @ts-nocheck
/* eslint-disable */
"use client";
// Ported from docs/dashboard-admin-prototype "Mula Admin v3" (lines 880–897). `v` is the prototype's renderVals() object (bound as V so prototype loop variables named v still work).
import { Fragment } from "react";

export function CartView({ v: V }: { v: any }) {
  return (
    <>
      {V.p.cart && (
        <>
          <div className="stg" style={{ display: "grid", gap: "10px" }}>
            <div className="ph">
              <div>
                <div className="eb">Cart</div>
                <h1 className="h1">Review and pay.</h1>
              </div>
              <button className="btn btn-t" data-p="addons" onClick={V.go}>
                Back to add-ons
              </button>
            </div>
            {V.cartEmpty && (
              <>
                <div
                  style={{
                    display: "grid",
                    justifyItems: "center",
                    textAlign: "center",
                    gap: "12px",
                    padding: "64px 20px",
                    border: "1px dashed var(--line2)",
                    borderRadius: "24px",
                  }}
                >
                  <div className="h2">Your cart is empty.</div>
                  <p className="sm mut" style={{ margin: "0" }}>
                    Browse add-ons whenever you need something extra.
                  </p>
                  <button className="btn btn-p" data-p="addons" onClick={V.go}>
                    Browse add-ons
                  </button>
                </div>
              </>
            )}
            {V.cartFull && (
              <>
                <div className="split" style={{ alignItems: "start" }}>
                  <div>
                    {V.cart.map((c, _i) => (
                      <Fragment key={_i}>
                        <div className="row" style={{ padding: "20px 0", borderTop: "1px solid var(--line)", gap: "16px" }}>
                          <div style={{ flex: "1", minWidth: "180px" }}>
                            <div className="h2" style={{ fontSize: "22px" }}>
                              {c.name}
                            </div>
                            <div className="sm mut">{c.desc}</div>
                          </div>
                          <div className="row" style={{ gap: "4px" }}>
                            <button className="btn btn-i" data-v={c.id} onClick={V.qMinus} aria-label="One less">
                              −
                            </button>
                            <span style={{ minWidth: "28px", textAlign: "center" }}>{c.q}</span>
                            <button className="btn btn-i" data-v={c.id} onClick={V.qPlus} aria-label="One more">
                              +
                            </button>
                          </div>
                          <b style={{ minWidth: "110px", textAlign: "right", fontWeight: "500", fontVariantNumeric: "tabular-nums" }}>{c.line}</b>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                  <div className="card" style={{ display: "grid", gap: "14px", position: "sticky", top: "90px" }}>
                    <h2 className="h2">Summary</h2>
                    <div className="row" style={{ flexWrap: "nowrap" }}>
                      <input className="inp" placeholder="Promo code" value={V.promo} onChange={V.setPromo} aria-label="Promo code" />
                      <button className="btn" onClick={V.applyPromo}>
                        Apply
                      </button>
                    </div>
                    <div className="row sb">
                      <span className="mut">Subtotal</span>
                      <span>{V.subtotal}</span>
                    </div>
                    <div className="row sb">
                      <span className="mut">Discount</span>
                      <span>{V.discount}</span>
                    </div>
                    <div className="row sb" style={{ borderTop: "1px solid var(--line)", paddingTop: "14px" }}>
                      <b style={{ fontWeight: "500" }}>Total</b>
                      <span className="num" style={{ fontSize: "34px" }}>
                        {V.total}
                      </span>
                    </div>
                    <label className="f">
                      Pay with
                      <select className="inp">
                        <option>QRIS</option>
                        <option>Bank transfer (BCA)</option>
                        <option>Credit card</option>
                        <option>GoPay</option>
                      </select>
                    </label>{" "}
                    <button className="btn btn-p" onClick={V.pay}>
                      Pay {V.total}
                    </button>
                    <div className="xs mut" style={{ textAlign: "center" }}>
                      Secure payment. Your receipt goes to your email and to Billing.
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
