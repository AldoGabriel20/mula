// @ts-nocheck
/* eslint-disable */
"use client";
// Ported from docs/dashboard-admin-prototype "Mula Admin v3" (lines 779–790). `v` is the prototype's renderVals() object (bound as V so prototype loop variables named v still work).
import { Fragment } from "react";

export function MemoriesView({ v: V }: { v: any }) {
  return (
    <>
      {V.p.memories && (
        <>
          <div className="stg" style={{ display: "grid", gap: "28px" }}>
            <div className="ph" style={{ marginBottom: "0" }}>
              <div>
                <div className="eb">Memories</div>
                <h1 className="h1">What your guests are saying.</h1>
              </div>
              <p className="sm mut" style={{ maxWidth: "42ch", margin: "0" }}>
                Wishes arrive with replies. After {V.ev.day} {V.ev.mon}, photos and attendance join them here, and your invitation becomes a keepsake.
              </p>
            </div>
            {V.hasWishes && (
              <>
                <div className="row" style={{ gap: "clamp(28px,5vw,64px)" }}>
                  <div>
                    <div className="num" style={{ fontSize: "64px" }} data-count={V.wishCount}>
                      {V.wishCount}
                    </div>
                    <div className="sm mut">wishes so far</div>
                  </div>
                  <div>
                    <div className="num" style={{ fontSize: "64px" }} data-count={V.wishWeek}>
                      {V.wishWeek}
                    </div>
                    <div className="sm mut">this week</div>
                  </div>
                  <div>
                    <div className="num" style={{ fontSize: "64px" }}>
                      —
                    </div>
                    <div className="sm mut">photos, after the day</div>
                  </div>
                </div>
                <div className="wall">
                  {V.wishes.map((w, _i) => (
                    <Fragment key={_i}>
                      <figure className="wish">
                        <blockquote className="serif" style={{ margin: "0", fontSize: "21px", lineHeight: "1.35", fontWeight: "300" }}>
                          “{w.t}”
                        </blockquote>
                        <figcaption className="row" style={{ marginTop: "16px", gap: "10px" }}>
                          <span className="av" style={{ background: w.c, border: "0", width: "26px", height: "26px", fontSize: "11px" }}>
                            {w.i}
                          </span>
                          <span className="sm">{w.n}</span>
                          <span className="xs mut">{w.g}</span>
                          {!w.approved && (
                            <button className="btn btn-t btn-s" style={{ marginLeft: "auto" }} data-v={w.id} onClick={V.approveWish}>
                              Approve
                            </button>
                          )}
                        </figcaption>
                      </figure>
                    </Fragment>
                  ))}
                </div>
              </>
            )}
            {V.noWishes && (
              <>
                <div
                  style={{
                    display: "grid",
                    justifyItems: "center",
                    textAlign: "center",
                    gap: "12px",
                    padding: "72px 20px",
                    border: "1px dashed var(--line2)",
                    borderRadius: "24px",
                  }}
                >
                  <h2 className="h1" style={{ fontSize: "clamp(28px,3vw,40px)" }}>
                    The first wish is still on its way.
                  </h2>
                  <p className="lede" style={{ maxWidth: "46ch" }}>
                    Once your invitation is shared, guests can leave a few words with their reply. They’ll gather here.
                  </p>
                </div>
              </>
            )}
            <div
              className="card"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))",
                gap: "22px",
                background: "var(--bg2)",
                border: "0",
              }}
            >
              <div>
                <div className="eb">After the day</div>
                <div className="h2" style={{ marginTop: "8px" }}>
                  Your keepsake
                </div>
              </div>
              <div className="sm">
                <b style={{ fontWeight: "500" }}>Photos</b>
                <br />
                <span className="mut">Guests can add their own from the invitation link.</span>
              </div>
              <div className="sm">
                <b style={{ fontWeight: "500" }}>Attendance</b>
                <br />
                <span className="mut">Who came, from check-in.</span>
              </div>
              <div className="sm">
                <b style={{ fontWeight: "500" }}>Thank-you notes</b>
                <br />
                <span className="mut">One message to everyone who came, or a personal one each.</span>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
