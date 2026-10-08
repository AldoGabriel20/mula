// @ts-nocheck
/* eslint-disable */
"use client";
// Ported from docs/dashboard-admin-prototype "Mula Admin v3" (lines 505–533). `v` is the prototype's renderVals() object (bound as V so prototype loop variables named v still work).
import { Fragment } from "react";

export function InvitationsView({ v: V }: { v: any }) {
  return (
    <>
      {V.p.invitations && (
        <>
          <div className="stg" style={{ display: "grid", gap: "26px" }}>
            <div className="ph" style={{ marginBottom: "0" }}>
              <div>
                <div className="eb">One event · {V.invActive} invitations</div>
                <h1 className="h1">One celebration, told to everyone in their own way.</h1>
              </div>
              <button className="btn btn-p" onClick={V.openNewInv}>
                New invitation
              </button>
            </div>
            <div className="row sb" style={{ padding: "16px 20px", borderRadius: "18px", background: "var(--bg2)", gap: "14px" }}>
              <div className="row" style={{ gap: "16px", flexWrap: "nowrap", minWidth: "0", flex: "1" }}>
                <svg className="ic" viewBox="0 0 20 20" style={{ color: "var(--dotd)" }}>
                  <path d={V.ic.pkg}></path>
                </svg>
                <span className="sm" style={{ minWidth: "0" }}>
                  <b style={{ fontWeight: "500" }}>{V.pkgName}</b>{" "}
                  <span className="mut">
                    · {V.invActive} of {V.invLimit} active invitations used. Archived invitations don’t count.
                  </span>
                </span>
              </div>
              <div className="row" style={{ gap: "12px", flexWrap: "nowrap" }}>
                <span className="bar" style={{ width: "120px" }}>
                  <i style={{ width: V.invMeter }}></i>
                </span>
                <button className="btn btn-s" data-p="packages" onClick={V.go}>
                  Packages
                </button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,330px),1fr))", gap: "18px" }}>
              {V.invs.map((v, _i) => (
                <Fragment key={_i}>
                  <article className={v.card} style={{ padding: "0", overflow: "hidden", display: "grid" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "120px minmax(0,1fr)", gap: "0" }}>
                      <button
                        style={{
                          all: "unset",
                          cursor: "pointer",
                          background: v.bg,
                          color: v.fg,
                          display: "grid",
                          placeItems: "center",
                          padding: "18px 14px",
                          gap: "8px",
                          textAlign: "center",
                        }}
                        data-v={v.id}
                        onClick={V.prevInv}
                        aria-label={`Preview ${v.name}`}
                      >
                        <span className="arch" style={{ width: "70px", aspectRatio: "3/3.7", background: v.photo }}></span>
                        <span className="serif" style={{ fontSize: "15px", lineHeight: "1.1" }}>
                          {V.ev.a}
                        </span>
                      </button>
                      <div style={{ padding: "18px 20px", display: "grid", gap: "8px", alignContent: "start", minWidth: "0" }}>
                        <div className="row sb">
                          <span className={`bdg ${v.stc}`}>{v.st}</span>
                          <span className="xs mut">{v.design}</span>
                        </div>
                        <h2 className="h2" style={{ fontSize: "24px" }}>
                          {v.name}
                        </h2>
                        <div className="xs mut">
                          {v.aud} · {v.audN} guests
                        </div>
                        <div className="row xs" style={{ gap: "12px" }}>
                          <span className="row" style={{ gap: "6px" }}>
                            <svg className="ic" viewBox="0 0 20 20" style={{ width: "14px" }}>
                              <path d={V.ic.globe}></path>
                            </svg>
                            {v.langN}
                          </span>
                          <span className="mut" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: "0" }}>
                            {v.url}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="row sb" style={{ padding: "12px 20px", borderTop: "1px solid var(--line)", gap: "10px" }}>
                      <div className="row xs" style={{ gap: "12px" }}>
                        <span className="mut">
                          {v.views} views · {v.replies} replies
                        </span>
                        <span className="row" style={{ gap: "6px" }}>
                          {v.trs.map((r, _i) => (
                            <Fragment key={_i}>
                              <span title={`${r.k} ${r.v}%`} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                <i style={{ width: "6px", height: "6px", borderRadius: "50%", background: r.c }}></i>
                                {r.k}
                              </span>
                            </Fragment>
                          ))}
                        </span>
                      </div>
                    </div>
                    <div className="row" style={{ padding: "0 14px 14px", gap: "4px" }}>
                      <button className="btn btn-s" data-v={v.id} onClick={V.editInv}>
                        Edit
                      </button>
                      <button className="btn btn-t btn-s" data-v={v.id} onClick={V.prevInv}>
                        Preview
                      </button>
                      <button className="btn btn-t btn-s" data-v={v.id} onClick={V.pubInv}>
                        {v.pubL}
                      </button>
                      <button className="btn btn-t btn-s" data-v={v.id} onClick={V.dupInv}>
                        Duplicate
                      </button>
                      <button className="btn btn-t btn-s" data-v={v.id} onClick={V.archInv}>
                        {v.archL}
                      </button>
                    </div>
                  </article>
                </Fragment>
              ))}
            </div>
            <div
              className="card"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))",
                gap: "22px",
                background: "transparent",
                borderStyle: "dashed",
              }}
            >
              <div>
                <div className="eb">How it works</div>
                <div className="h2" style={{ marginTop: "8px" }}>
                  Same event, different doors.
                </div>
              </div>
              <div className="sm">
                <b style={{ fontWeight: "500" }}>Audience</b>
                <br />
                <span className="mut">Each invitation goes to its own guest groups, with its own link.</span>
              </div>
              <div className="sm">
                <b style={{ fontWeight: "500" }}>Language and design</b>
                <br />
                <span className="mut">Write it in Indonesian for family, English for colleagues, Malay for relatives abroad.</span>
              </div>
              <div className="sm">
                <b style={{ fontWeight: "500" }}>Shared details</b>
                <br />
                <span className="mut">Schedule, gifts and replies stay connected to the one event.</span>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
