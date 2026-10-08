// @ts-nocheck
/* eslint-disable */
"use client";
// Ported from docs/dashboard-admin-prototype "Mula Admin v3" (lines 448–477). `v` is the prototype's renderVals() object (bound as V so prototype loop variables named v still work).
import { Fragment } from "react";

export function ScheduleView({ v: V }: { v: any }) {
  return (
    <>
      {V.p.events && (
        <>
          <div className="stg" style={{ display: "grid", gap: "10px", maxWidth: "1080px" }}>
            <div className="ph">
              <div>
                <div className="eb">Schedule · {V.ev.date}</div>
                <h1 className="h1">The moments your guests will remember.</h1>
              </div>
              <button className="btn btn-p" onClick={V.addEvent}>
                Add a moment
              </button>
            </div>
            {V.noEvents && (
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
                  <h2 className="h1" style={{ fontSize: "clamp(28px,3vw,40px)" }}>
                    Nothing scheduled yet.
                  </h2>
                  <p className="lede" style={{ maxWidth: "46ch" }}>
                    Add the moments that will shape your celebration: a ceremony, a dinner, a party. Each one gets its own time, place and dress code.
                  </p>
                  <button className="btn btn-p" onClick={V.addEvent}>
                    Add your first moment
                  </button>
                </div>
              </>
            )}
            {V.events.map((e, _i) => (
              <Fragment key={_i}>
                <div className="rr">
                  <div style={{ textAlign: "right", paddingTop: "14px" }}>
                    <div className="num" style={{ fontSize: "36px" }}>
                      {e.s}
                    </div>
                    {e.en && (
                      <div className="xs mut" style={{ marginTop: "4px" }}>
                        until {e.en}
                      </div>
                    )}
                  </div>
                  <div className="rl"></div>
                  <div className="card lift" data-moment={e.id} style={{ margin: "0 0 18px", display: "grid", gap: "12px" }}>
                    <div className="row sb" style={{ alignItems: "flex-start" }}>
                      <div style={{ minWidth: "0", flex: "1" }}>
                        <div className="row" style={{ gap: "10px" }}>
                          <span className="xs mut">{e.no}</span>
                          <h2 className="h2">{e.name}</h2>
                          <span className={`bdg ${e.vc}`}>{e.vis}</span>
                        </div>
                        <div className="mut" style={{ marginTop: "6px" }}>
                          {e.venue}
                        </div>
                        {(e.addr || (e.dress && e.dress !== "—")) && (
                          <div className="sm mut">
                            {e.addr} · Dress code: {e.dress}
                          </div>
                        )}
                      </div>
                      <div className="row" style={{ gap: "4px" }}>
                        <button className="btn btn-t btn-i" data-v={e.id} onClick={V.evUp} aria-label="Move earlier">
                          ↑
                        </button>
                        <button className="btn btn-t btn-i" data-v={e.id} onClick={V.evDown} aria-label="Move later">
                          ↓
                        </button>
                        <button className="btn btn-s" data-v={e.id} onClick={V.evEdit}>
                          Edit
                        </button>
                        <button className="btn btn-t btn-s" data-v={e.id} onClick={V.evDup}>
                          Duplicate
                        </button>
                        <button className="btn btn-t btn-s" style={{ color: "var(--no)" }} data-v={e.id} onClick={V.evDel}>
                          Delete
                        </button>
                      </div>
                    </div>
                    {e.open && (
                      <>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))",
                            gap: "14px",
                            borderTop: "1px solid var(--line)",
                            paddingTop: "18px",
                            animation: "rise .6s var(--eo) both",
                          }}
                        >
                          <label className="f">
                            Name of this moment
                            <input className="inp" data-f="title" defaultValue={e.name} />
                          </label>
                          <label className="f">
                            Date
                            <input className="inp" type="date" data-f="date" defaultValue={e.date} />
                          </label>{" "}
                          <label className="f">
                            Starts
                            <input className="inp" type="time" data-f="start" defaultValue={e.s === "—" ? "" : e.s} />
                          </label>
                          <label className="f">
                            Ends
                            <input className="inp" type="time" data-f="end" defaultValue={e.en} />
                          </label>{" "}
                          <label className="f">
                            Venue
                            <input className="inp" data-f="venue" defaultValue={e.venue} />
                          </label>
                          <label className="f">
                            Address
                            <input className="inp" data-f="address" defaultValue={e.addr} />
                          </label>{" "}
                          <label className="f">
                            Map link
                            <input className="inp" placeholder="Paste a Google Maps link" />
                          </label>
                          <label className="f">
                            Dress code
                            <input className="inp" data-f="dress" defaultValue={e.dress === "—" ? "" : e.dress} />
                          </label>{" "}
                          <label className="f">
                            Who can see it
                            <select className="inp" data-f="vis" defaultValue={e.vis}>
                              <option>Everyone</option>
                              <option>Invite only</option>
                              <option>Family only</option>
                            </select>
                          </label>{" "}
                          <label className="f" style={{ gridColumn: "1/-1" }}>
                            Description<textarea className="inp" data-f="desc" defaultValue={e.desc} />
                          </label>
                        </div>
                        <div className="row sb">
                          <label className="row sm" style={{ gap: "10px" }}>
                            <button className="tog on" role="switch" aria-checked="true" onClick={V.tg} aria-label="Show add to calendar"></button> Show “Add to
                            calendar” to guests
                          </label>
                          <button className="btn btn-p btn-s" data-v={e.id} onClick={V.evSave}>
                            Save moment
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </Fragment>
            ))}
          </div>
        </>
      )}
    </>
  );
}
