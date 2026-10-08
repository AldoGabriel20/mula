// @ts-nocheck
/* eslint-disable */
"use client";
// Ported from docs/dashboard-admin-prototype "Mula Admin v3" (lines 479–503). `v` is the prototype's renderVals() object (bound as V so prototype loop variables named v still work).
import { Fragment } from "react";

export function TasksView({ v: V }: { v: any }) {
  return (
    <>
      {V.p.todo && (
        <>
          <div className="split stg" style={{ gridTemplateColumns: "minmax(0,.8fr) minmax(0,1.2fr)", alignItems: "start", gap: "clamp(24px,5vw,72px)" }}>
            <div style={{ position: "sticky", top: "96px", display: "grid", gap: "18px" }}>
              <div className="eb">Tasks</div>
              <div style={{ position: "relative", maxWidth: "280px" }}>
                <svg
                  viewBox="0 0 240 136"
                  style={{ width: "100%", display: "block", overflow: "visible" }}
                  role="img"
                  aria-label={`${V.todoDone} of ${V.todoTotal} done`}
                >
                  <path d="M16 124 A104 104 0 0 1 224 124" fill="none" stroke="var(--line)" strokeWidth="8" strokeLinecap="round"></path>
                  <path
                    d="M16 124 A104 104 0 0 1 224 124"
                    fill="none"
                    stroke="var(--ink)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    pathLength="100"
                    strokeDasharray={V.tArch.dash}
                    style={{ transition: "stroke-dasharray 1s var(--eo)", animation: "draw 1.6s var(--eo) both" }}
                  ></path>
                  <circle
                    cx={V.tArch.x}
                    cy={V.tArch.y}
                    r="9"
                    fill="var(--dot)"
                    stroke="var(--bg)"
                    strokeWidth="3"
                    style={{ transition: "cx 1s var(--eo),cy 1s var(--eo)" }}
                  ></circle>
                </svg>
                <div className="num" style={{ position: "absolute", left: "0", right: "0", bottom: "0", textAlign: "center", fontSize: "52px" }}>
                  {V.todoDone}
                  <span style={{ fontSize: ".45em", color: "var(--mut)" }}>/{V.todoTotal}</span>
                </div>
              </div>
              <h1 className="h1" style={{ fontSize: "clamp(30px,3.4vw,44px)" }}>
                {V.todoDone} of {V.todoTotal} done.
                <br />
                <span className="mut it" style={{ fontWeight: "300" }}>
                  Calm and on track.
                </span>
              </h1>
              <p className="sm mut" style={{ margin: "0" }}>
                Next: <b style={{ color: "var(--ink)", fontWeight: "500" }}>{V.nextTask}</b>
              </p>
              <div style={{ display: "grid", gap: "8px", marginTop: "6px" }}>
                <div className="row" style={{ flexWrap: "nowrap" }}>
                  <input className="inp" placeholder="Add something to remember" value={V.nt} onChange={V.setNt} onKeyDown={V.ntKey} aria-label="New task" />
                  <button className="btn btn-p" onClick={V.addTask}>
                    Add
                  </button>
                </div>
                <select className="inp" style={{ width: "auto", justifySelf: "start" }} onChange={V.setNp} aria-label="Priority">
                  <option>Normal</option>
                  <option>High</option>
                  <option>Low</option>
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gap: "28px" }}>
              <div className="row" style={{ gap: "6px" }}>
                {V.tcats.map((c, _i) => (
                  <Fragment key={_i}>
                    <button className={c.on} data-v={c.n} onClick={V.setTc}>
                      {c.n}
                    </button>
                  </Fragment>
                ))}
              </div>
              <section>
                <div className="eb" style={{ marginBottom: "6px" }}>
                  Coming up
                </div>
                {V.tSoon.map((t, _i) => (
                  <Fragment key={_i}>
                    <div className={t.cls}>
                      <button className={t.ckc} data-v={t.id} onClick={V.togTask} aria-label={`Mark ${t.title} done`}>
                        <svg viewBox="0 0 16 16">
                          <path d="M3.5 8.5l3 3 6-7"></path>
                        </svg>
                      </button>
                      <div>
                        <div className="tt">{t.title}</div>
                        <div className="xs mut">
                          {t.cat} · Due {t.due}
                        </div>
                      </div>
                      <span className={`bdg ${t.pc} hidem2`}>{t.pri}</span>
                      <button className="btn btn-t btn-s" data-v={t.id} onClick={V.delTask} aria-label="Remove task">
                        Remove
                      </button>
                    </div>
                  </Fragment>
                ))}
              </section>
              <section>
                <div className="eb" style={{ marginBottom: "6px" }}>
                  Later
                </div>
                {V.tLater.map((t, _i) => (
                  <Fragment key={_i}>
                    <div className={t.cls}>
                      <button className={t.ckc} data-v={t.id} onClick={V.togTask} aria-label={`Mark ${t.title} done`}>
                        <svg viewBox="0 0 16 16">
                          <path d="M3.5 8.5l3 3 6-7"></path>
                        </svg>
                      </button>
                      <div>
                        <div className="tt">{t.title}</div>
                        <div className="xs mut">
                          {t.cat} · Due {t.due}
                        </div>
                      </div>
                      <span className={`bdg ${t.pc} hidem2`}>{t.pri}</span>
                      <button className="btn btn-t btn-s" data-v={t.id} onClick={V.delTask} aria-label="Remove task">
                        Remove
                      </button>
                    </div>
                  </Fragment>
                ))}
              </section>
              <section>
                <div className="eb" style={{ marginBottom: "6px" }}>
                  Done
                </div>
                {V.tDone.map((t, _i) => (
                  <Fragment key={_i}>
                    <div className={t.cls}>
                      <button className={t.ckc} data-v={t.id} onClick={V.togTask} aria-label={`Mark ${t.title} not done`}>
                        <svg viewBox="0 0 16 16">
                          <path d="M3.5 8.5l3 3 6-7"></path>
                        </svg>
                      </button>
                      <div>
                        <div className="tt">{t.title}</div>
                        <div className="xs mut">
                          {t.cat} · {t.due}
                        </div>
                      </div>
                      <span></span>
                      <span></span>
                    </div>
                  </Fragment>
                ))}
              </section>
            </div>
          </div>
        </>
      )}
    </>
  );
}
