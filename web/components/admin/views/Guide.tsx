// @ts-nocheck
/* eslint-disable */
"use client";
// Ported from docs/dashboard-admin-prototype "Mula Admin v3" (lines 916–932). `v` is the prototype's renderVals() object (bound as V so prototype loop variables named v still work).
import { Fragment } from "react";

export function GuideView({ v: V }: { v: any }) {
  return (
    <>
      {V.p.guide && (
        <>
          <div className="stg" style={{ display: "grid", gap: "22px" }}>
            <div style={{ display: "grid", gap: "18px", justifyItems: "start", padding: "clamp(28px,5vw,64px) 0 10px" }}>
              <div className="eb">Guide</div>
              <h1 className="h1">How can we help you begin?</h1>
              <input
                className="inp"
                style={{ maxWidth: "560px", minHeight: "54px", fontSize: "16px", borderRadius: "99px", padding: "0 22px" }}
                placeholder="Search for an answer"
                value={V.hq}
                onChange={V.setHq}
                aria-label="Search the guide"
              />
            </div>
            <div className="row" style={{ gap: "6px" }}>
              {V.hcats.map((c, _i) => (
                <Fragment key={_i}>
                  <button className={c.on} data-v={c.n} onClick={V.setHc}>
                    {c.n}
                  </button>
                </Fragment>
              ))}
            </div>
            <div className="split" style={{ alignItems: "start" }}>
              <div style={{ display: "grid", gap: "10px" }}>
                {V.noGuides && (
                  <>
                    <p className="mut">Nothing matches yet. Try fewer words, or ask us directly from Account.</p>
                  </>
                )}
                {V.guides.map((g, _i) => (
                  <Fragment key={_i}>
                    <button className={g.sel} style={{ textAlign: "left", padding: "18px 22px", display: "grid", gap: "4px" }} data-v={g.id} onClick={V.setHa}>
                      <span className="eb">{g.cat}</span>
                      <span className="h2" style={{ fontSize: "21px" }}>
                        {g.t}
                      </span>
                      <span className="sm mut">{g.s}</span>
                    </button>
                  </Fragment>
                ))}
              </div>
              <article className="card" style={{ position: "sticky", top: "90px", padding: "clamp(22px,3vw,36px)" }}>
                <div className="eb">{V.ga.cat}</div>
                <h2 className="h1" style={{ fontSize: "clamp(28px,3vw,38px)", margin: "10px 0 22px" }}>
                  {V.ga.t}
                </h2>
                <ol style={{ listStyle: "none", margin: "0", padding: "0", display: "grid" }}>
                  {V.ga.steps.map((s, _i) => (
                    <Fragment key={_i}>
                      <li style={{ padding: "14px 0", borderTop: "1px solid var(--line)" }}>{s}</li>
                    </Fragment>
                  ))}
                </ol>
                <div className="row" style={{ marginTop: "22px" }}>
                  <button className="btn btn-p btn-s" data-p={V.ga.go} onClick={V.go}>
                    Take me there
                  </button>
                  <span className="xs mut">Was this helpful?</span>
                  <button className="btn btn-t btn-s" onClick={V.save}>
                    Yes
                  </button>
                  <button className="btn btn-t btn-s" onClick={V.save}>
                    Not quite
                  </button>
                </div>
              </article>
            </div>
          </div>
        </>
      )}
    </>
  );
}
