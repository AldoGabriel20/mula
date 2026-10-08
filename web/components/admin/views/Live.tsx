// @ts-nocheck
/* eslint-disable */
"use client";
// Ported from docs/dashboard-admin-prototype "Mula Admin v3" (lines 760–777). `v` is the prototype's renderVals() object (bound as V so prototype loop variables named v still work).
import { Fragment } from "react";

export function LiveView({ v: V }: { v: any }) {
  return (
    <>
      {V.p.live && (
        <>
          <div className="stg" style={{ display: "grid", gap: "24px" }}>
            <div className="ph" style={{ marginBottom: "0" }}>
              <div>
                <div className="eb">Live stream</div>
                <h1 className="h1">Let loved ones join from anywhere.</h1>
              </div>
              <div className="row" style={{ gap: "8px" }}>
                <span className="xs mut">Status</span>
                <div className="seg">
                  {V.liveStates.map((s, _i) => (
                    <Fragment key={_i}>
                      <button className={s.on} data-v={s.n} onClick={V.setLive}>
                        {s.n}
                      </button>
                    </Fragment>
                  ))}
                </div>
              </div>
            </div>
            <div className="split" style={{ alignItems: "start" }}>
              <div
                style={{
                  aspectRatio: "16/9",
                  borderRadius: "24px",
                  background: "radial-gradient(800px 400px at 50% 0%,#2D2925,#0E0D0C 75%)",
                  color: "#EEE9DF",
                  display: "grid",
                  placeItems: "center",
                  textAlign: "center",
                  padding: "24px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    width: "56%",
                    aspectRatio: "1",
                    border: "1px solid rgba(238,233,223,.1)",
                    borderBottom: "0",
                    borderRadius: "999px 999px 0 0",
                    bottom: "-30%",
                  }}
                ></div>
                <div style={{ position: "relative", display: "grid", gap: "12px", justifyItems: "center" }}>
                  <span className="row" style={{ gap: "8px", fontSize: "12px", letterSpacing: ".14em", textTransform: "uppercase", color: "#A39B8E" }}>
                    {V.isLive && (
                      <>
                        <span className="ldot" style={{ background: "#E89580" }}></span>
                      </>
                    )}
                    {V.live}
                  </span>
                  <div className="serif" style={{ fontSize: "clamp(28px,3.4vw,46px)", fontWeight: "300", lineHeight: "1.05" }}>
                    {V.liveTitle}
                  </div>
                  <div className="sm" style={{ color: "#A39B8E" }}>
                    {V.liveSub}
                  </div>
                </div>
              </div>
              <div className="card" data-live="1" style={{ display: "grid", gap: "16px" }}>
                <div className="row sb">
                  <b style={{ fontWeight: "500" }}>Show on invitation</b>
                  <button className={V.liveShown ? "tog on" : "tog"} role="switch" aria-checked={V.liveShown} aria-label="Show on invitation" onClick={V.togLiveShow}></button>
                </div>
                <label className="f">
                  Platform
                  <select className="inp" data-f="provider" defaultValue={V.liveCfg.provider}>
                    <option>YouTube Live</option>
                    <option>Zoom</option>
                    <option>Instagram Live</option>
                  </select>
                </label>{" "}
                <label className="f">
                  Stream link
                  <input className="inp" data-f="url" defaultValue={V.liveCfg.url} placeholder="https://youtube.com/live/…" />
                </label>{" "}
                <label className="f">
                  Starts
                  <input className="inp" type="datetime-local" data-f="start" defaultValue={V.liveCfg.starts} />
                </label>{" "}
                <button className="btn btn-p" onClick={V.saveLive}>
                  Save stream
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
