// @ts-nocheck
/* eslint-disable */
"use client";
// Ported from docs/dashboard-admin-prototype "Mula Admin v3" (lines 651–694). `v` is the prototype's renderVals() object (bound as V so prototype loop variables named v still work).
import { Fragment } from "react";

export function GiftView({ v: V }: { v: any }) {
  return (
    <>
      {V.p.gift && (
        <>
          <div className="stg" style={{ display: "grid", gap: "8px" }}>
            <div className="ph" style={{ marginBottom: "20px" }}>
              <div>
                <div className="eb">Gifts</div>
                <h1 className="h1">Choose how guests can celebrate with you.</h1>
              </div>
              <div className="seg" role="tablist">
                {V.gTabs.map((g, _i) => (
                  <Fragment key={_i}>
                    <button className={g.on} data-v={g.id} onClick={V.setGTab} role="tab">
                      {g.n}
                    </button>
                  </Fragment>
                ))}
              </div>
            </div>
            {V.gWays && (
              <>
                <div style={{ display: "grid", gap: "14px" }}>
                  <div className="row" style={{ justifyContent: "flex-end" }}>
                    <button className="btn btn-p btn-s" onClick={V.addGift}>
                      Add gift method
                    </button>
                  </div>
                  <div className="split" style={{ alignItems: "start" }}>
                    <div style={{ display: "grid", gap: "12px" }}>
                      {V.noGifts && (
                        <>
                          <div
                            style={{
                              display: "grid",
                              justifyItems: "center",
                              textAlign: "center",
                              gap: "12px",
                              padding: "56px 20px",
                              border: "1px dashed var(--line2)",
                              borderRadius: "24px",
                            }}
                          >
                            <div className="h2">No gift methods yet.</div>
                            <p className="sm mut" style={{ margin: "0", maxWidth: "42ch" }}>
                              This is optional. If you’d like, add a bank account, a wallet or an address, and guests can copy it in one tap.
                            </p>
                            <button className="btn btn-p" onClick={V.addGift}>
                              Add a gift method
                            </button>
                          </div>
                        </>
                      )}
                      {V.gifts.map((g, _i) => (
                        <Fragment key={_i}>
                          <div className="card lift" style={{ padding: "20px 22px" }}>
                            <div className="row sb" style={{ alignItems: "flex-start" }}>
                              <div>
                                <span className="eb">{g.type}</span>
                                <h2 className="h2" style={{ marginTop: "6px" }}>
                                  {g.title}
                                </h2>
                                <div className="sm mut">{g.detail}</div>
                              </div>
                              <div className="row" style={{ gap: "4px" }}>
                                <button className="btn btn-t btn-i" data-v={g.id} onClick={V.gUp} aria-label="Move up">
                                  ↑
                                </button>
                                <button className="btn btn-t btn-i" data-v={g.id} onClick={V.gDown} aria-label="Move down">
                                  ↓
                                </button>
                                <button className="btn btn-s" data-v={g.id} onClick={V.editGift}>
                                  Edit
                                </button>
                                <button className="btn btn-t btn-s" style={{ color: "var(--no)" }} data-v={g.id} onClick={V.gDel}>
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </Fragment>
                      ))}
                      <label className="f" style={{ marginTop: "12px" }}>
                        A note for guests
                        <textarea className="inp" defaultValue="Your presence is the greatest gift. Should you wish to give something, here are a few ways." />
                      </label>
                      <div style={{ marginTop: "28px" }}>
                        <div className="eb">Received</div>
                        <div style={{ padding: "26px 0", borderTop: "1px solid var(--line)", marginTop: "10px" }}>
                          <div className="h2" style={{ fontSize: "22px" }}>
                            Nothing received yet.
                          </div>
                          <p className="sm mut" style={{ margin: "6px 0 0", maxWidth: "48ch" }}>
                            When guests confirm a gift on the invitation, it appears here with their name, so thank-you notes are easy later.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div style={{ position: "sticky", top: "90px" }}>
                      <div className="eb" style={{ marginBottom: "10px" }}>
                        How guests will see it
                      </div>
                      <div
                        style={{
                          background: V.pv.bg,
                          color: V.pv.fg,
                          borderRadius: "24px",
                          padding: "30px 22px",
                          display: "grid",
                          gap: "14px",
                          textAlign: "center",
                          boxShadow: "var(--sh)",
                        }}
                      >
                        <div style={{ fontFamily: V.pv.font, fontSize: "30px" }}>Wedding gift</div>
                        <div className="sm" style={{ opacity: ".75" }}>
                          Your presence is the greatest gift.
                        </div>
                        {V.gifts.map((g, _i) => (
                          <Fragment key={_i}>
                            <div
                              style={{
                                background: "rgba(255,255,255,.55)",
                                borderRadius: "14px",
                                padding: "16px",
                                textAlign: "left",
                                display: "grid",
                                gap: "2px",
                              }}
                            >
                              <div className="xs" style={{ opacity: ".7" }}>
                                {g.title}
                              </div>
                              <div className="row sb">
                                <b style={{ fontWeight: "600", fontVariantNumeric: "tabular-nums" }}>{g.copy}</b>
                                <button className="btn btn-s" style={{ borderColor: "currentColor", color: "inherit" }} data-v={g.copy} onClick={V.copy}>
                                  Copy
                                </button>
                              </div>
                            </div>
                          </Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
            {V.gReg && (
              <>
                <div className="split" style={{ alignItems: "start" }}>
                  <div style={{ display: "grid", gap: "18px" }}>
                    <div className="row sb">
                      <span className="sm mut">{V.regSum} · Guests mark a gift as theirs so nothing arrives twice.</span>
                      <button className="btn btn-p btn-s" onClick={V.openReg}>
                        Add a gift
                      </button>
                    </div>
                    {V.noReg && (
                      <>
                        <div
                          style={{
                            display: "grid",
                            justifyItems: "center",
                            textAlign: "center",
                            gap: "12px",
                            padding: "56px 20px",
                            border: "1px dashed var(--line2)",
                            borderRadius: "24px",
                          }}
                        >
                          <div className="h2">Your registry is empty.</div>
                          <p className="sm mut" style={{ margin: "0", maxWidth: "44ch" }}>
                            Add the things you would love, with a photo, a price and a link to Shopee, Tokopedia, TikTok Shop or any store. Or add an experience
                            guests can contribute to.
                          </p>
                          <button className="btn btn-p" onClick={V.openReg}>
                            Add your first gift
                          </button>
                        </div>
                      </>
                    )}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,240px),1fr))", gap: "16px" }}>
                      {V.reg.map((r, _i) => (
                        <Fragment key={_i}>
                          <article className="card lift" style={{ padding: "0", overflow: "hidden", display: "grid" }}>
                            <div
                              style={{
                                aspectRatio: "4/3",
                                background: r.tone,
                                display: "grid",
                                placeItems: "end start",
                                padding: "12px",
                                position: "relative",
                              }}
                            >
                              <span className="xs" style={{ color: "rgba(255,255,255,.85)", letterSpacing: ".1em", textTransform: "uppercase" }}>
                                Photo
                              </span>
                              {r.full && (
                                <>
                                  <span className="bdg b-ok" style={{ position: "absolute", top: "12px", right: "12px", background: "var(--sf)" }}>
                                    Fully gifted
                                  </span>
                                </>
                              )}
                            </div>
                            <div style={{ padding: "16px 18px", display: "grid", gap: "8px" }}>
                              <div className="h2" style={{ fontSize: "20px" }}>
                                {r.name}
                              </div>
                              <div className="xs mut">{r.desc}</div>
                              <div className="row sb">
                                <b style={{ fontWeight: "500", fontVariantNumeric: "tabular-nums" }}>{r.priceF}</b>
                                <span className="bdg b-mu">{r.store}</span>
                              </div>
                              <div className="bar">
                                <i style={{ width: r.pct }}></i>
                              </div>
                              <div className="xs mut">{r.claimed}</div>
                              <div className="row" style={{ gap: "4px", marginTop: "4px" }}>
                                <button className="btn btn-s" onClick={V.save}>
                                  Edit
                                </button>
                                <button className="btn btn-t btn-s" data-v={r.id} onClick={V.regUp} aria-label="Move earlier">
                                  ↑
                                </button>
                                <button className="btn btn-t btn-s" style={{ color: "var(--no)" }} data-v={r.id} onClick={V.delReg}>
                                  Delete
                                </button>
                              </div>
                            </div>
                          </article>
                        </Fragment>
                      ))}
                    </div>
                  </div>
                  <div style={{ position: "sticky", top: "90px" }}>
                    <div className="eb" style={{ marginBottom: "10px" }}>
                      How guests will see it
                    </div>
                    <div
                      style={{
                        background: V.pv.bg,
                        color: V.pv.fg,
                        borderRadius: "24px",
                        padding: "28px 20px",
                        display: "grid",
                        gap: "12px",
                        boxShadow: "var(--sh)",
                      }}
                    >
                      <div style={{ fontFamily: V.pv.font, fontSize: "28px", textAlign: "center" }}>Our registry</div>
                      <div className="sm" style={{ opacity: ".75", textAlign: "center" }}>
                        Only if you wish. Choose something, and it will be marked as yours.
                      </div>
                      {V.reg.map((r, _i) => (
                        <Fragment key={_i}>
                          <div
                            className="row"
                            style={{ flexWrap: "nowrap", gap: "12px", padding: "12px", borderRadius: "14px", background: "rgba(255,255,255,.5)" }}
                          >
                            <span style={{ width: "48px", height: "48px", borderRadius: "10px", flex: "none", background: r.tone }}></span>
                            <span style={{ flex: "1", minWidth: "0" }}>
                              <span className="sm" style={{ fontWeight: "500" }}>
                                {r.name}
                              </span>
                              <br />
                              <span className="xs" style={{ opacity: ".7" }}>
                                {r.priceF} · {r.claimed}
                              </span>
                            </span>
                            {r.open && (
                              <>
                                <button className="btn btn-s" style={{ borderColor: "currentColor", color: "inherit" }} data-v={r.id} onClick={V.gotReg}>
                                  Gift this
                                </button>
                              </>
                            )}
                            {r.full && (
                              <>
                                <span className="xs" style={{ opacity: ".7" }}>
                                  Gifted
                                </span>
                              </>
                            )}
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
