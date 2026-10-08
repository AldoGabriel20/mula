// @ts-nocheck
/* eslint-disable */
"use client";
// Ported from docs/dashboard-admin-prototype "Mula Admin v3" (lines 250–273). `v` is the prototype's renderVals() object (bound as V so prototype loop variables named v still work).
import { Fragment } from "react";

export function TopbarView({ v: V }: { v: any }) {
  return (
    <>
      <header className="top">
        <span className="mobrand">
          <img className="logo-l" src="/brand/admin/mula-symbol-ink.png" alt="mula" style={{ height: "30px" }} />
          <img className="logo-d" src="/brand/admin/mula-symbol-light.png" alt="mula" style={{ height: "30px" }} />
        </span>
        <div className="row hidem" style={{ gap: "8px", fontSize: "14px", flexWrap: "nowrap", minWidth: "0" }}>
          <span className="mut" style={{ whiteSpace: "nowrap" }}>
            {V.ev.host}
          </span>
          <span className="mut">/</span>
          <b style={{ fontWeight: "500", whiteSpace: "nowrap" }}>{V.pageTitle}</b>
        </div>
        <div style={{ flex: "1" }}></div>
        <button className="srch" onClick={V.openSearch} aria-label="Search">
          <svg className="ic" viewBox="0 0 20 20" style={{ width: "16px" }}>
            <path d={V.ic.search}></path>
          </svg>
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{V.L.search}</span>
          <kbd className="hidem">⌘K</kbd>
        </button>
        <div className="avs hidem" aria-label="Working on this now" style={{ marginLeft: "6px" }}>
          {V.online.map((o, _i) => (
            <Fragment key={_i}>
              <span className="av" style={{ background: o.c }} title={o.n}>
                {o.i}
              </span>
            </Fragment>
          ))}
        </div>
        <button className="btn btn-t btn-i" onClick={V.openAi} aria-label="Mula AI" title="Mula AI">
          <svg className="ic" viewBox="0 0 20 20" style={{ color: "var(--dotd)" }}>
            <path d={V.ic.ai}></path>
          </svg>
        </button>{" "}
        <button className="btn btn-t btn-i hidem" onClick={V.toggleTheme} aria-label="Switch light or dark">
          <svg className="ic" viewBox="0 0 20 20">
            <path d={V.themeIc}></path>
          </svg>
        </button>{" "}
        <button className="btn btn-t btn-i" style={{ position: "relative" }} onClick={V.toggleNotif} aria-label="Updates">
          <svg className="ic" viewBox="0 0 20 20">
            <path d={V.ic.bell}></path>
          </svg>
          {V.hasUnread && (
            <>
              <span className="ndot"></span>
            </>
          )}
        </button>
        <div style={{ position: "relative" }}>
          <button
            className="btn btn-t btn-s"
            style={{ gap: "6px", padding: "0 10px", minHeight: "40px" }}
            onClick={V.toggleLangMenu}
            aria-label="Language"
            aria-haspopup="menu"
            aria-expanded={V.langMenuAr}
          >
            <svg className="ic" viewBox="0 0 20 20" style={{ width: "16px" }}>
              <path d={V.ic.globe}></path>
            </svg>
            <span style={{ fontWeight: "600", letterSpacing: ".04em" }}>{V.langCode}</span>
          </button>
          {V.langMenu && (
            <>
              <div style={{ position: "fixed", inset: "0", zIndex: "48" }} onClick={V.closeMenus}></div>
              <div className="pan" role="menu" style={{ position: "absolute", top: "48px", right: "0", width: "230px", padding: "6px", zIndex: "50" }}>
                {V.langRows2.map((l, _i) => (
                  <Fragment key={_i}>
                    <button
                      className="nv"
                      role="menuitemradio"
                      aria-checked={l.ar}
                      style={{ minHeight: "44px", justifyContent: "space-between" }}
                      data-v={l.id}
                      onClick={V.pickLang}
                    >
                      <span>{l.n}</span>
                      <span className="xs mut" style={{ fontWeight: "600" }}>
                        {l.c}
                      </span>
                      {l.sel && (
                        <>
                          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--dot)" }}></span>
                        </>
                      )}
                    </button>
                  </Fragment>
                ))}
              </div>
            </>
          )}
        </div>
        <div style={{ position: "relative" }}>
          <button
            className="av"
            style={{ background: "#A69A89", width: "36px", height: "36px", border: "0", padding: "0", cursor: "pointer" }}
            onClick={V.toggleProf}
            aria-label="Profile menu"
            aria-haspopup="menu"
            aria-expanded={V.profAr}
          >
            {V.me.initial}
          </button>
          {V.profMenu && (
            <>
              <div style={{ position: "fixed", inset: "0", zIndex: "48" }} onClick={V.closeMenus}></div>
              <div className="pan" role="menu" style={{ position: "absolute", top: "48px", right: "0", width: "260px", padding: "6px", zIndex: "50" }}>
                <div
                  className="row"
                  style={{ padding: "12px 12px 14px", gap: "12px", flexWrap: "nowrap", borderBottom: "1px solid var(--line)", marginBottom: "6px" }}
                >
                  <span className="av" style={{ background: "#A69A89", width: "38px", height: "38px", border: "0" }}>
                    {V.me.initial}
                  </span>
                  <span style={{ minWidth: "0" }}>
                    <b style={{ fontWeight: "500" }}>{V.me.name}</b>
                    <br />
                    <span className="xs mut">{V.me.email} · {V.pkgName}</span>
                  </span>
                </div>
                <button className="nv" role="menuitem" style={{ minHeight: "44px" }} data-p="account" onClick={V.go}>
                  <svg className="ic" viewBox="0 0 20 20">
                    <path d={V.ic.user}></path>
                  </svg>
                  <span>{V.L.t.account}</span>
                </button>{" "}
                <button className="nv" role="menuitem" style={{ minHeight: "44px" }} data-p="billing" onClick={V.go}>
                  <svg className="ic" viewBox="0 0 20 20">
                    <path d={V.ic.card}></path>
                  </svg>
                  <span>{V.L.t.billing}</span>
                </button>
                <div style={{ height: "1px", background: "var(--line)", margin: "6px 0" }}></div>
                <button className="nv" role="menuitem" style={{ minHeight: "44px", color: "var(--no)" }} onClick={V.logout}>
                  <svg className="ic" viewBox="0 0 20 20">
                    <path d="M8 4H4.5v12H8M12.5 6.5 16 10l-3.5 3.5M16 10H7.5"></path>
                  </svg>
                  <span>{V.L.out}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </header>
    </>
  );
}
