// @ts-nocheck
/* eslint-disable */
"use client";
// Ported from docs/dashboard-admin-prototype "Mula Admin v3" (lines 934–957). `v` is the prototype's renderVals() object (bound as V so prototype loop variables named v still work).
import { Fragment } from "react";

export function SettingsView({ v: V }: { v: any }) {
  return (
    <>
      {V.p.account && (
        <>
          <div className="stg split" style={{ gridTemplateColumns: "minmax(0,210px) minmax(0,760px)", gap: "clamp(24px,5vw,72px)", alignItems: "start" }}>
            <nav className="edn" style={{ display: "grid", gap: "2px", position: "sticky", top: "96px" }} aria-label="Settings sections">
              <div className="eb hidem" style={{ margin: "0 12px 10px" }}>
                {V.L.t.account}
              </div>
              {V.secs2.map((s, _i) => (
                <Fragment key={_i}>
                  <button className={s.on} data-v={s.id} onClick={V.goSec}>
                    {s.n}
                  </button>
                </Fragment>
              ))}
            </nav>
            <div style={{ display: "grid", gap: "56px" }}>
              <section id="set-profile" style={{ display: "grid", gap: "18px" }}>
                <div className="row" style={{ gap: "18px", flexWrap: "nowrap" }}>
                  <span className="av" style={{ background: "#A69A89", width: "64px", height: "64px", fontSize: "22px", border: "0" }}>
                    {V.me.initial}
                  </span>
                  <div>
                    <h1 className="h1" style={{ fontSize: "clamp(30px,3.4vw,44px)" }}>
                      {V.me.name}
                    </h1>
                    <div className="sm mut">
                      Owner of {V.me.events} {V.me.events === 1 ? "event" : "events"}
                      {V.me.since ? ` · member since ${V.me.since}` : ""}
                    </div>
                  </div>
                </div>
                <div data-profile="1" style={{ display: "grid", gap: "18px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))", gap: "14px" }}>
                  <label className="f">
                    Name
                    <input className="inp" data-f="name" defaultValue={V.me.name} autoComplete="name" />
                  </label>
                  <label className="f">
                    Email
                    <input className="inp" type="email" value={V.me.email} readOnly autoComplete="email" />
                  </label>
                  <label className="f">
                    Phone
                    <input className="inp" type="tel" data-f="phone" placeholder="+62" autoComplete="tel" defaultValue={V.me.phone} />
                  </label>
                </div>
                <button className="btn btn-p" style={{ justifySelf: "start" }} onClick={V.saveProfile}>
                  Save profile
                </button>
                </div>
              </section>
              <section id="set-language" style={{ display: "grid", gap: "14px", borderTop: "1px solid var(--line)", paddingTop: "30px" }}>
                <h2 className="h2">Language</h2>
                <p className="sm mut" style={{ margin: "0" }}>
                  The language Mula speaks to you. Each invitation has its own language for guests.
                </p>
                <div className="row" style={{ gap: "6px" }}>
                  {V.langRows.map((l, _i) => (
                    <Fragment key={_i}>
                      <button className={l.on} data-v={l.id} onClick={V.setLangE}>
                        {l.n}
                      </button>
                    </Fragment>
                  ))}
                </div>
              </section>
              <section id="set-appearance" style={{ display: "grid", gap: "14px", borderTop: "1px solid var(--line)", paddingTop: "30px" }}>
                <h2 className="h2">Appearance</h2>
                <div className="row" style={{ gap: "18px" }}>
                  {V.themeOpts.map((o, _i) => (
                    <Fragment key={_i}>
                      <button
                        data-v={o.id}
                        onClick={V.setThemeE}
                        style={{ display: "grid", gap: "8px", border: "0", background: "none", padding: "0", justifyItems: "start" }}
                      >
                        <span
                          style={{
                            width: "132px",
                            height: "84px",
                            borderRadius: "14px",
                            background: o.bg,
                            border: "1px solid var(--line)",
                            display: "grid",
                            placeItems: "center",
                          }}
                        >
                          <svg viewBox="0 0 40 26" width="44">
                            <path d="M8 25V14a12 12 0 0 1 24 0v11" fill="none" stroke={o.fg} strokeWidth="2.4"></path>
                            <circle cx="8" cy="22" r="3" fill="#A69A89"></circle>
                          </svg>
                        </span>
                        <span className="sm">{o.n}</span>
                      </button>
                    </Fragment>
                  ))}
                </div>
              </section>
              <section id="set-notifications" style={{ display: "grid", gap: "12px", borderTop: "1px solid var(--line)", paddingTop: "30px" }}>
                <h2 className="h2">Notifications</h2>
                {V.notifPrefs.map((n, _i) => (
                  <Fragment key={_i}>
                    <div className="row sb" style={{ paddingTop: "12px", borderTop: "1px solid var(--line)" }}>
                      <span>{n.n}</span>
                      <button className={n.on} role="switch" aria-checked={n.ar} aria-label={n.n} data-v={n.k} onClick={V.togNotif}></button>
                    </div>
                  </Fragment>
                ))}
              </section>
              <section id="set-security" data-security="1" style={{ display: "grid", gap: "14px", borderTop: "1px solid var(--line)", paddingTop: "30px" }}>
                <h2 className="h2">Security</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))", gap: "14px" }}>
                  <label className="f">
                    Current password
                    <input className="inp" type="password" data-f="cur" autoComplete="current-password" />
                  </label>
                  <label className="f">
                    New password
                    <input className="inp" type="password" data-f="new" autoComplete="new-password" />
                  </label>
                </div>
                <div className="row sb" style={{ paddingTop: "12px", borderTop: "1px solid var(--line)" }}>
                  <span>
                    <span>Two-step verification</span>
                    <br />
                    <span className="xs mut">A code by WhatsApp when you sign in on a new device</span>
                  </span>
                  <button className="tog" role="switch" aria-checked="false" aria-label="Two-step verification" onClick={V.tg}></button>
                </div>
                <div className="xs mut" style={{ marginTop: "6px" }}>
                  Signed in on
                </div>
                {V.sessions.map((s, _i) => (
                  <Fragment key={_i}>
                    <div className="row sb sm" style={{ padding: "10px 0", borderTop: "1px solid var(--line)" }}>
                      <span>{s.n}</span>
                      <span className="row" style={{ gap: "10px" }}>
                        <span className="mut">{s.w}</span>
                        {!s.cur && (
                          <button className="btn btn-t btn-s" data-v={s.id} onClick={V.revokeSession}>
                            Sign out
                          </button>
                        )}
                      </span>
                    </div>
                  </Fragment>
                ))}
                <div className="row">
                  <button className="btn btn-s" onClick={V.changePw}>
                    Update password
                  </button>
                  <button className="btn btn-t btn-s" onClick={V.logout}>
                    Sign out
                  </button>
                </div>
              </section>
              <section id="set-purchases" style={{ display: "grid", gap: "14px", borderTop: "1px solid var(--line)", paddingTop: "30px" }}>
                <h2 className="h2">Purchases</h2>
                <div className="row sb">
                  <span className="sm">
                    <b style={{ fontWeight: "500" }}>{V.pkgName}</b> <span className="mut">for {V.ev.host}</span>
                  </span>
                  <div className="row">
                    <button className="btn btn-s" data-p="billing" onClick={V.go}>
                      Receipts
                    </button>
                    <button className="btn btn-s" data-p="packages" onClick={V.go}>
                      Packages
                    </button>
                  </div>
                </div>
              </section>
              <section id="set-referral" style={{ display: "grid", gap: "18px", borderTop: "1px solid var(--line)", paddingTop: "30px" }}>
                <h2 className="h2">Referral</h2>
                <p className="sm mut" style={{ margin: "0", maxWidth: "54ch" }}>
                  Friends get 10% off their first event. When they publish an invitation, you receive Rp 50.000 credit for your next celebration.
                </p>
                <div
                  className="row"
                  style={{
                    flexWrap: "nowrap",
                    padding: "6px 6px 6px 18px",
                    border: "1px solid var(--line2)",
                    borderRadius: "99px",
                    background: "var(--rs)",
                    maxWidth: "520px",
                  }}
                >
                  <span
                    style={{ flex: "1", minWidth: "0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontVariantNumeric: "tabular-nums" }}
                  >
                    {V.refLink}
                  </span>
                  <button className="btn btn-p btn-s" onClick={V.copyRef}>
                    Copy link
                  </button>
                </div>
                <div className="row" style={{ gap: "clamp(24px,4vw,56px)" }}>
                  {V.refStats.map((r, _i) => (
                    <Fragment key={_i}>
                      <div>
                        <div className="num" style={{ fontSize: "48px" }}>
                          {r.v}
                        </div>
                        <div className="xs mut">{r.l}</div>
                      </div>
                    </Fragment>
                  ))}
                  <div>
                    <div className="num" style={{ fontSize: "48px" }}>
                      {V.refCredit}
                    </div>
                    <div className="xs mut">Credit to use</div>
                  </div>
                </div>
                <div>
                  {V.refHist.map((h, _i) => (
                    <Fragment key={_i}>
                      <div className="row" style={{ padding: "12px 0", borderTop: "1px solid var(--line)", flexWrap: "nowrap", gap: "12px" }}>
                        <span className="av" style={{ background: h.c, border: "0" }}>
                          {h.i}
                        </span>
                        <span style={{ flex: "1", minWidth: "0" }} className="sm">
                          <b style={{ fontWeight: "500" }}>{h.n}</b>
                          <br />
                          <span className="xs mut">
                            {h.s} · {h.d}
                          </span>
                        </span>
                        <span className="sm" style={{ fontVariantNumeric: "tabular-nums" }}>
                          {h.r}
                        </span>
                      </div>
                    </Fragment>
                  ))}
                </div>
              </section>
              <div className="row xs mut" style={{ gap: "14px", borderTop: "1px solid var(--line)", paddingTop: "18px" }}>
                <button className="btn btn-t btn-s" data-p="terms" onClick={V.go}>
                  Terms &amp; Conditions
                </button>
                <button className="btn btn-t btn-s" data-p="system" onClick={V.go}>
                  Design language
                </button>
                <button className="btn btn-t btn-s" onClick={V.openOb}>
                  Replay onboarding
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
