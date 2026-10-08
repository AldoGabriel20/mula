// @ts-nocheck
/* eslint-disable */
"use client";
// Ported from docs/dashboard-admin-prototype "Mula Admin v3" (lines 411–446). `v` is the prototype's renderVals() object (bound as V so prototype loop variables named v still work).
import { Fragment } from "react";

export function GuestsView({ v: V }: { v: any }) {
  return (
    <>
      {V.p.guests && (
        <>
          <div className="stg" style={{ display: "grid", gap: "22px" }}>
            <div className="ph" style={{ marginBottom: "6px" }}>
              <div>
                <div className="eb">Guests · {V.resp.total} invited</div>
                <h1 className="h1">Who’s coming.</h1>
              </div>
              <div className="row">
                <button className="btn btn-t" onClick={V.importG}>
                  Import
                </button>
                <button className="btn btn-t" onClick={V.exportG}>
                  Export or print
                </button>
                <button className="btn btn-p" onClick={V.openAddGuest}>
                  Add guest
                </button>
              </div>
            </div>
            <div className="segs" role="tablist" aria-label="Guest groups">
              {V.segs.map((s, _i) => (
                <Fragment key={_i}>
                  <button className={s.on} data-v={s.id} onClick={V.setSeg} role="tab">
                    <span className="num" style={{ fontSize: "32px" }}>
                      {s.v}
                    </span>
                    <span className="sm mut">{s.l}</span>
                  </button>
                </Fragment>
              ))}
            </div>
            {V.hasSegAct && (
              <>
                <div className="row sb" style={{ padding: "16px 20px", borderRadius: "16px", background: "var(--bg2)", animation: "rise .6s var(--eo) both" }}>
                  <span className="row" style={{ gap: "12px", flexWrap: "nowrap" }}>
                    <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "var(--dot)", flex: "none" }}></span>
                    <span>{V.segMsg}</span>
                  </span>
                  <button className="btn btn-p btn-s" onClick={V.segRun}>
                    {V.segCta}
                  </button>
                </div>
              </>
            )}
            <div className="row">
              <input
                className="inp"
                style={{ flex: "1", minWidth: "200px", maxWidth: "380px" }}
                placeholder="Search by name or group"
                value={V.gq}
                onChange={V.setGq}
                aria-label="Search guests"
              />{" "}
              <select className="inp" style={{ width: "auto" }} onChange={V.setGs} aria-label="Sort guests">
                <option value="name">Sort by name</option>
                <option value="group">Sort by group</option>
                <option value="status">Sort by reply</option>
              </select>{" "}
              <span className="sm mut" style={{ marginLeft: "auto" }}>
                Showing {V.gCount} of {V.resp.total} {V.resp.total === 1 ? "guest" : "guests"}
              </span>
            </div>
            {V.hasSel && (
              <>
                <div
                  className="row"
                  style={{
                    padding: "10px 12px 10px 20px",
                    borderRadius: "99px",
                    background: "var(--ink)",
                    color: "var(--onink)",
                    animation: "rise .5s var(--eo) both",
                    position: "sticky",
                    top: "76px",
                    zIndex: "5",
                  }}
                >
                  <b style={{ fontWeight: "500" }}>{V.selCount} selected</b>
                  <div style={{ flex: "1" }}></div>
                  <button className="btn btn-s" style={{ color: "inherit", borderColor: "rgba(128,128,128,.5)" }} onClick={V.bulkResend}>
                    Resend invitation
                  </button>
                  <button className="btn btn-s" style={{ color: "inherit", borderColor: "rgba(128,128,128,.5)" }} onClick={V.bulkDel}>
                    Remove
                  </button>
                  <button className="btn btn-s btn-t" style={{ color: "inherit" }} onClick={V.clearSel}>
                    Clear
                  </button>
                </div>
              </>
            )}
            {V.freshGuests && (
              <>
                <div
                  style={{
                    display: "grid",
                    justifyItems: "center",
                    textAlign: "center",
                    gap: "14px",
                    padding: "72px 20px",
                    border: "1px dashed var(--line2)",
                    borderRadius: "24px",
                  }}
                >
                  <svg viewBox="0 0 60 50" width="64" fill="none">
                    <path d="M10 48V26a20 20 0 0 1 40 0v22" stroke="var(--line2)" strokeWidth="2"></path>
                    <circle cx="12" cy="44" r="5" fill="var(--dot)"></circle>
                  </svg>
                  <h2 className="h1" style={{ fontSize: "clamp(28px,3vw,40px)" }}>
                    Your guest list starts here.
                  </h2>
                  <p className="lede" style={{ maxWidth: "44ch" }}>
                    Your invitation is ready to be shared. Add the people you would love to see, one by one or from a spreadsheet.
                  </p>
                  <div className="row" style={{ justifyContent: "center" }}>
                    <button className="btn btn-p" onClick={V.openAddGuest}>
                      Add your first guest
                    </button>
                    <button className="btn" onClick={V.importG}>
                      Import a list
                    </button>
                  </div>
                </div>
              </>
            )}
            {V.noGuests && (
              <>
                <div style={{ textAlign: "center", padding: "48px 16px" }}>
                  <div className="h2">No one here yet.</div>
                  <p className="mut">Try another search or group, or add a guest.</p>
                </div>
              </>
            )}
            {V.hasGuests && (
              <>
                <div className="card dt" style={{ padding: "4px 10px", overflow: "auto" }}>
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th style={{ width: "36px" }}>
                          <span style={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden" }}>Select</span>
                        </th>
                        <th>Guest</th>
                        <th>Journey</th>
                        <th>Reply</th>
                        <th>Group</th>
                        <th>Party</th>
                        <th>Table</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {V.guests.map((g, _i) => (
                        <Fragment key={_i}>
                          <tr className="rw">
                            <td>
                              <input
                                type="checkbox"
                                checked={g.chk}
                                data-v={g.id}
                                onChange={V.selG}
                                aria-label={`Select ${g.name}`}
                                style={{ width: "18px", height: "18px", accentColor: "var(--ink)" }}
                              />
                            </td>
                            <td data-v={g.id} onClick={V.openG}>
                              <span className="row" style={{ flexWrap: "nowrap", gap: "12px" }}>
                                <span className="av" style={{ background: g.c, border: "0" }}>
                                  {g.i}
                                </span>
                                <span>
                                  <b style={{ fontWeight: "500" }}>{g.name}</b>
                                  <br />
                                  <span className="xs mut">{g.phone}</span>
                                </span>
                              </span>
                            </td>
                            <td data-v={g.id} onClick={V.openG}>
                              <span className="jd" title="Sent · Opened · Replied">
                                <i className={g.j1}></i>
                                <i className={g.j2}></i>
                                <i className={g.j3}></i>
                              </span>
                            </td>
                            <td>
                              <span className={`bdg ${g.cls}`}>{g.st}</span>
                            </td>
                            <td className="mut">{g.group}</td>
                            <td>{g.plus}</td>
                            <td>{g.table}</td>
                            <td style={{ textAlign: "right" }}>
                              <button className="btn btn-t btn-s" data-v={g.id} onClick={V.openG}>
                                Open
                              </button>
                            </td>
                          </tr>
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mo">
                  {V.guests.map((g, _i) => (
                    <Fragment key={_i}>
                      <div className="row" style={{ padding: "14px 0", borderTop: "1px solid var(--line)", flexWrap: "nowrap", gap: "12px" }}>
                        <input
                          type="checkbox"
                          checked={g.chk}
                          data-v={g.id}
                          onChange={V.selG}
                          aria-label={`Select ${g.name}`}
                          style={{ width: "22px", height: "22px", accentColor: "var(--ink)", flex: "none" }}
                        />
                        <button
                          style={{
                            all: "unset",
                            flex: "1",
                            minWidth: "0",
                            display: "flex",
                            gap: "12px",
                            alignItems: "center",
                            cursor: "pointer",
                            minHeight: "44px",
                          }}
                          data-v={g.id}
                          onClick={V.openG}
                        >
                          <span className="av" style={{ background: g.c, border: "0" }}>
                            {g.i}
                          </span>
                          <span style={{ minWidth: "0" }}>
                            <b style={{ fontWeight: "500" }}>{g.name}</b>
                            <br />
                            <span className="xs mut">
                              {g.group} · {g.plus} · Table {g.table}
                            </span>
                          </span>
                        </button>
                        <span className={`bdg ${g.cls}`}>{g.st}</span>
                      </div>
                    </Fragment>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
