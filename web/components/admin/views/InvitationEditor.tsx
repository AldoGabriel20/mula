// @ts-nocheck
/* eslint-disable */
"use client";
// Ported from docs/dashboard-admin-prototype "Mula Admin v3" (lines 535–583). `v` is the prototype's renderVals() object (bound as V so prototype loop variables named v still work).
import { Fragment } from "react";

export function InvitationEditorView({ v: V }: { v: any }) {
  return (
    <>
      {V.p.invitation && (
        <>
          <div className="stg" style={{ display: "grid", gap: "8px" }}>
            <div className="ph" style={{ marginBottom: "18px" }}>
              <div style={{ minWidth: "0" }}>
                <button className="btn btn-t btn-s" data-p="invitations" onClick={V.go} style={{ marginLeft: "-12px" }}>
                  ← All invitations
                </button>
                <div className="row" style={{ marginTop: "10px", gap: "12px", flexWrap: "nowrap" }}>
                  <select
                    className="inp serif"
                    style={{
                      width: "auto",
                      maxWidth: "100%",
                      fontSize: "clamp(26px,3vw,40px)",
                      border: "0",
                      background: "transparent",
                      padding: "0 28px 0 0",
                      minHeight: "0",
                      fontWeight: "400",
                      letterSpacing: "-.02em",
                    }}
                    onChange={V.setCurInv}
                    value={(V.invOpts.find((o) => o.sel) || V.invOpts[0] || {}).id}
                    aria-label="Choose invitation"
                  >
                    {V.invOpts.map((o, _i) => (
                      <Fragment key={_i}>
                        <option value={o.id}>
                          {o.n}
                        </option>
                      </Fragment>
                    ))}
                  </select>
                </div>
                <div className="sm mut" style={{ marginTop: "4px" }}>
                  {V.ci.aud} · {V.ci.audN} guests · {V.ci.url}
                </div>
              </div>
              <div className="row">
                <button className="btn" onClick={V.openPreview}>
                  Preview
                </button>
                <button className="btn btn-p" onClick={V.publish}>
                  Publish changes
                </button>
              </div>
            </div>
            <div
              className="row sb"
              style={{ padding: "6px", border: "1px solid var(--line)", borderRadius: "18px", background: "var(--sf)", marginBottom: "18px", gap: "6px" }}
            >
              <div className="row" style={{ gap: "4px" }} role="tablist" aria-label="Content language">
                {V.plTabs.map((l, _i) => (
                  <Fragment key={_i}>
                    <button className={l.on} style={{ width: "auto", minHeight: "40px" }} data-v={l.k} onClick={V.setPlang} role="tab">
                      <span>
                        {l.n}
                        <span className="xs mut">{l.primary}</span>
                      </span>
                      <span className="xs" style={{ color: l.c === "var(--line2)" ? "var(--mut)" : l.c, fontVariantNumeric: "tabular-nums" }}>
                        {l.v}
                      </span>
                    </button>
                  </Fragment>
                ))}
              </div>
              {V.trMissing && (
                <>
                  <button className="btn btn-s" onClick={V.translateAi}>
                    <svg className="ic" viewBox="0 0 20 20" style={{ width: "15px", color: "var(--dotd)" }}>
                      <path d={V.ic.ai}></path>
                    </svg>
                    Translate the rest with Mula AI
                  </button>
                </>
              )}
            </div>
            <div className="ed">
              <nav className="edn" aria-label="Invitation sections" style={{ display: "grid", gap: "2px", position: "sticky", top: "90px" }}>
                {V.secs.map((s, _i) => (
                  <Fragment key={_i}>
                    <button className={s.on} data-v={s.id} onClick={V.setSec}>
                      <span className="xs mut" style={{ fontVariantNumeric: "tabular-nums" }}>
                        {s.no}
                      </span>
                      <span>{s.n}</span>
                      <span className="sd" style={{ background: s.c }}></span>
                    </button>
                  </Fragment>
                ))}
              </nav>
              <div className="card" style={{ display: "grid", gap: "18px", alignContent: "start", padding: "clamp(20px,3vw,34px)" }}>
                <div className="row sb">
                  <div>
                    <div className="eb">Editing</div>
                    <h2 className="h1" style={{ fontSize: "clamp(28px,3vw,38px)", marginTop: "6px" }}>
                      {V.secName}
                    </h2>
                  </div>
                  <span className="xs mut">Changes appear in the preview as you type</span>
                </div>
                {V.sec.cover && (
                  <>
                    <label className="f">
                      Greeting line
                      <input className="inp" value={V.ev.greet} onChange={V.setGreet} />
                    </label>{" "}
                    <label className="f">
                      Names
                      <input className="inp" defaultValue={V.ev.host} />
                    </label>{" "}
                    <label className="f">
                      <span className="row sb">
                        Tagline{" "}
                        <button type="button" className="btn btn-t btn-s" style={{ minHeight: "28px", fontWeight: "500" }} data-v="copy" onClick={V.openAi}>
                          <svg className="ic" viewBox="0 0 20 20" style={{ width: "14px", color: "var(--dotd)" }}>
                            <path d={V.ic.ai}></path>
                          </svg>
                          Write with Mula AI
                        </button>
                      </span>
                      <input className="inp" value={V.ev.line} onChange={V.setLine} />
                    </label>
                    <div
                      className="arch"
                      style={{
                        height: "200px",
                        maxWidth: "220px",
                        background: V.pv.photo,
                        display: "grid",
                        placeItems: "end center",
                        padding: "16px",
                        color: "#fff",
                        fontSize: "12px",
                        letterSpacing: ".1em",
                        textTransform: "uppercase",
                      }}
                    >
                      Replace cover photo
                    </div>
                  </>
                )}
                {V.sec.main && (
                  <>
                    <label className="f">
                      Kind of celebration
                      <select className="inp">
                        <option>Wedding</option>
                        <option>Birthday</option>
                        <option>17th Birthday</option>
                        <option>Anniversary</option>
                        <option>Engagement</option>
                        <option>Product launch</option>
                      </select>
                    </label>{" "}
                    <label className="f">
                      Host names
                      <input className="inp" defaultValue={V.ev.host} />
                    </label>{" "}
                    <label className="f">
                      Opening message<textarea className="inp" defaultValue="With gratitude, we invite you to share the beginning of our forever." />
                    </label>
                  </>
                )}
                {V.sec.gallery && (
                  <>
                    <div
                      style={{
                        display: "grid",
                        justifyItems: "center",
                        textAlign: "center",
                        gap: "12px",
                        padding: "44px 16px",
                        border: "1px dashed var(--line2)",
                        borderRadius: "18px",
                      }}
                    >
                      <div className="h2">Bring your story to life.</div>
                      <p className="sm mut" style={{ margin: "0", maxWidth: "40ch" }}>
                        Guests won’t see this section until it has photos. Add up to 12, and they’ll appear in a gentle carousel.
                      </p>
                      <button className="btn btn-p" onClick={V.toastGallery}>
                        Upload photos
                      </button>
                    </div>
                  </>
                )}
                {V.sec.rsvp && (
                  <>
                    <div className="row sb">
                      <span>Ask guests to reply</span>
                      <button className="tog on" role="switch" aria-checked="true" onClick={V.tg} aria-label="Ask guests to reply"></button>
                    </div>
                    <label className="f">
                      Replies close on
                      <input className="inp" type="date" data-f="rsvpBy" defaultValue={V.rsvpBy} />
                    </label>{" "}
                    <label className="f">
                      Most people per invitation
                      <input className="inp" type="number" defaultValue="2" />
                    </label>
                    <div className="row sb">
                      <span>Send an automatic reminder 10 days before</span>
                      <button className="tog on" role="switch" aria-checked="true" onClick={V.tg} aria-label="Automatic reminder"></button>
                    </div>
                  </>
                )}
                {V.sec.other && (
                  <>
                    <div className="row sb">
                      <span>Show this section</span>
                      <button className={V.secOn ? "tog on" : "tog"} role="switch" aria-checked={V.secOn} onClick={V.togSection} aria-label="Show this section"></button>
                    </div>
                    <label className="f">
                      Heading
                      <input className="inp" data-f="heading" defaultValue={V.secHeading} />
                    </label>{" "}
                    <label className="f">
                      What guests will read<textarea className="inp" data-f="body" defaultValue={V.secBody} />
                    </label>
                  </>
                )}
                <div className="row" style={{ justifyContent: "flex-end", borderTop: "1px solid var(--line)", paddingTop: "18px" }}>
                  <button className="btn btn-t" onClick={V.failSave}>
                    Discard
                  </button>
                  <button className="btn btn-p" onClick={V.saveInv}>
                    Save changes
                  </button>
                </div>
              </div>
              <div className="pvc" style={{ position: "sticky", top: "90px", display: "grid", gap: "10px" }}>
                <div className="row sb">
                  <span className="eb">Guest view</span>
                  <button className="btn btn-t btn-s" onClick={V.openPreview}>
                    Full screen
                  </button>
                </div>
                <div className="phone" style={{ background: V.pv.bg, color: V.pv.fg }}>
                  <div
                    style={{
                      height: "100%",
                      display: "grid",
                      alignContent: "center",
                      justifyItems: "center",
                      textAlign: "center",
                      padding: "26px 22px",
                      gap: "16px",
                    }}
                  >
                    <div className="arch" style={{ width: "70%", aspectRatio: "3/3.6", background: V.pv.photo }}></div>
                    <div className="xs" style={{ letterSpacing: ".16em", textTransform: "uppercase", opacity: ".7" }}>
                      {V.ev.greet}
                    </div>
                    <div style={{ fontFamily: V.pv.font, fontSize: "32px", lineHeight: "1.02" }}>
                      {V.ev.a}
                      <br />
                      {V.ev.amp && (
                        <>
                          <span className="it" style={{ color: V.pv.ac }}>
                            &amp;
                          </span>
                        </>
                      )}
                      {V.ev.b}
                    </div>
                    <div className="it serif sm" style={{ opacity: ".8" }}>
                      {V.ev.line}
                    </div>
                    <div className="xs" style={{ letterSpacing: ".24em", opacity: ".8" }}>
                      {V.ev.dshort}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
