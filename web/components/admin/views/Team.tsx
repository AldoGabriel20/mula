// @ts-nocheck
/* eslint-disable */
"use client";
// Ported from docs/dashboard-admin-prototype "Mula Admin v3" (lines 792–805). `v` is the prototype's renderVals() object (bound as V so prototype loop variables named v still work).
import { Fragment } from "react";

export function TeamView({ v: V }: { v: any }) {
  return (
    <>
      {V.p.team && (
        <>
          <div className="stg" style={{ display: "grid", gap: "10px", maxWidth: "1080px" }}>
            <div className="ph">
              <div>
                <div className="eb">Team</div>
                <h1 className="h1">Prepare it together.</h1>
              </div>
              <p className="sm mut" style={{ maxWidth: "40ch", margin: "0" }}>
                Invite a co-host, a planner or family. Each role only sees what it needs.
              </p>
            </div>
            <div className="row" style={{ flexWrap: "nowrap" }}>
              <input
                className="inp"
                type="email"
                placeholder="Email or phone number"
                value={V.invite}
                onChange={V.setInvite}
                aria-label="Invite someone"
                style={{ maxWidth: "420px" }}
              />
              <select className="inp" data-f="role" style={{ width: "auto" }} aria-label="Role">
                <option>Co-host</option>
                <option>Planner</option>
                <option>Family</option>
                <option>Usher</option>
              </select>
              <button className="btn btn-p" onClick={V.sendInvite}>
                Invite
              </button>
            </div>
            <div style={{ marginTop: "24px" }}>
              {V.team.map((m, _i) => (
                <Fragment key={_i}>
                  <div className="row" style={{ padding: "16px 0", borderTop: "1px solid var(--line)", gap: "16px", flexWrap: "nowrap" }}>
                    <span className="av" style={{ background: m.c, border: "0", width: "40px", height: "40px", fontSize: "14px" }}>
                      {m.i}
                    </span>
                    <div style={{ flex: "1", minWidth: "0" }}>
                      <b style={{ fontWeight: "500" }}>{m.n}</b>
                      <div className="xs mut" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {m.e} · {m.st}
                      </div>
                    </div>
                    <span className="bdg b-mu">{m.r}</span>
                  </div>
                </Fragment>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,200px),1fr))", gap: "16px", marginTop: "28px" }}>
              <div className="card">
                <div className="h2" style={{ fontSize: "20px" }}>
                  Co-host
                </div>
                <p className="sm mut" style={{ margin: "6px 0 0" }}>
                  Everything, except billing.
                </p>
              </div>
              <div className="card">
                <div className="h2" style={{ fontSize: "20px" }}>
                  Planner
                </div>
                <p className="sm mut" style={{ margin: "6px 0 0" }}>
                  Schedule, guests, tasks and event day.
                </p>
              </div>
              <div className="card">
                <div className="h2" style={{ fontSize: "20px" }}>
                  Family
                </div>
                <p className="sm mut" style={{ margin: "6px 0 0" }}>
                  Add guests and leave notes.
                </p>
              </div>
              <div className="card">
                <div className="h2" style={{ fontSize: "20px" }}>
                  Usher
                </div>
                <p className="sm mut" style={{ margin: "6px 0 0" }}>
                  Only the check-in view, on the day.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
