// @ts-nocheck
/* eslint-disable */
"use client";
// Ported from docs/dashboard-admin-prototype "Mula Admin v3" (lines 275–277). `v` is the prototype's renderVals() object (bound as V so prototype loop variables named v still work).
import { Fragment } from "react";

export function LoadingView({ v: V }: { v: any }) {
  return (
    <>
      {V.loading && (
        <>
          <div style={{ display: "grid", gap: "22px" }} aria-busy="true">
            <div className="sk" style={{ height: "12px", width: "120px" }}></div>
            <div className="sk" style={{ height: "52px", width: "min(480px,80%)" }}></div>
            <div className="row" style={{ gap: "12px" }}>
              <div className="sk" style={{ height: "86px", flex: "1", minWidth: "140px" }}></div>
              <div className="sk" style={{ height: "86px", flex: "1", minWidth: "140px" }}></div>
              <div className="sk" style={{ height: "86px", flex: "1", minWidth: "140px" }}></div>
            </div>
            <div className="sk" style={{ height: "280px" }}></div>
            <div className="row sm mut">
              <span className="ldot" style={{ background: "var(--dot)" }}></span>
              {V.loadMsg}
            </div>
          </div>
        </>
      )}
    </>
  );
}
