// @ts-nocheck
/* eslint-disable */
"use client";
// Ported from docs/dashboard-admin-prototype "Mula Admin v3" (lines 222–247). `v` is the prototype's renderVals() object (bound as V so prototype loop variables named v still work).
import { Fragment } from "react";

export function SidebarView({ v: V }: { v: any }) {
  return (
    <>
      <aside className="side" aria-label="Main navigation">
        <button
          data-p="home"
          onClick={V.go}
          aria-label="mula, go to overview"
          style={{ all: "unset", cursor: "pointer", display: "block", padding: "4px 12px", minHeight: "32px", flex: "none" }}
        >
          <img className="logo-l" src="/brand/admin/mula-lockup-ink.png" alt="mula" style={{ height: "30px" }} />
          <img className="logo-d" src="/brand/admin/mula-lockup-light.png" alt="mula" style={{ height: "30px" }} />
        </button>{" "}
        <button className="evsw" onClick={V.cycleEvt} aria-label="Switch celebration">
          <span className="arch" style={{ width: "34px", height: "42px", flex: "none", background: V.pv.photo }}></span>{" "}
          <span style={{ minWidth: "0", flex: "1", display: "grid" }}>
            <span style={{ fontWeight: "600", fontSize: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{V.ev.host}</span>
            <span className="xs mut">
              {V.ev.type} · {V.ev.day} {V.ev.mon}
            </span>
          </span>{" "}
          <svg className="ic" viewBox="0 0 20 20" style={{ color: "var(--mut)" }}>
            <path d="M7 8l3-3 3 3M7 12l3 3 3-3"></path>
          </svg>
        </button>
        {V.nav.map((g, _i) => (
          <Fragment key={_i}>
            <div>
              <div className="eb ngl">{g.label}</div>
              {g.items.map((n, _i) => (
                <Fragment key={_i}>
                  <button className={`nv ${n.on}`} data-p={n.id} onClick={V.go}>
                    <svg className="ic" viewBox="0 0 20 20">
                      <path d={n.ic}></path>
                    </svg>
                    <span>{n.label}</span>
                    <span className="nb">{n.badge}</span>
                  </button>
                </Fragment>
              ))}
            </div>
          </Fragment>
        ))}
        <div style={{ marginTop: "auto", display: "grid", gap: "2px", paddingTop: "22px" }}>
          <button className="nv" onClick={V.openAi}>
            <svg className="ic" viewBox="0 0 20 20" style={{ color: "var(--dotd)" }}>
              <path d={V.ic.ai}></path>
            </svg>
            <span>Mula AI</span>
            <span className="nb" style={{ fontSize: "10.5px", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--dotd)" }}>
              Advanced
            </span>
          </button>{" "}
          <button className={`nv ${V.guideOn}`} data-p="guide" onClick={V.go}>
            <svg className="ic" viewBox="0 0 20 20">
              <path d={V.ic.guide}></path>
            </svg>
            <span>{V.L.t.guide}</span>
          </button>{" "}
          <button className={`nv ${V.accountOn}`} data-p="account" onClick={V.go}>
            <svg className="ic" viewBox="0 0 20 20">
              <path d={V.ic.user}></path>
            </svg>
            <span>{V.L.t.account}</span>
          </button>
          <div className="seg" role="group" aria-label="Appearance" style={{ margin: "12px 4px 0", display: "flex" }}>
            <button className={V.thL} onClick={V.setLight} style={{ flex: "1", justifyContent: "center", padding: "0 6px" }}>
              <svg className="ic" viewBox="0 0 20 20" style={{ width: "14px" }}>
                <path d={V.ic.sun}></path>
              </svg>
              {V.L.light}
            </button>{" "}
            <button className={V.thD} onClick={V.setDark} style={{ flex: "1", justifyContent: "center", padding: "0 6px" }}>
              <svg className="ic" viewBox="0 0 20 20" style={{ width: "14px" }}>
                <path d={V.ic.moon}></path>
              </svg>
              {V.L.dark}
            </button>{" "}
            <button className={V.thS} onClick={V.setSystem} style={{ flex: "1", justifyContent: "center", padding: "0 6px" }}>
              {V.L.auto}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
