"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminLogic } from "./logic";
import "./admin.css";
import { PAGE_PATH, pageFromPath } from "./routes";
import { useAdminData } from "./useAdminData";
import { patchVals } from "./patch";

type Ctx = { v: any; logic: AdminLogic };
const AdminContext = createContext<Ctx | null>(null);
export const useAdmin = () => useContext(AdminContext)!;

// Hosts the prototype's logic class and re-runs its renderVals() on every state change; `v` is what the
// ported views bind to. The page comes from the URL (the class's `route` hook pushes it).
export function AdminProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const ref = useRef<AdminLogic | null>(null);
  if (!ref.current) {
    ref.current = new AdminLogic();
    ref.current.props = { motion: "Full", eventType: "Wedding", dataState: "Planning" };
    // Prototype presets stay untouched; the real event is built from them as P.api / LC.api.
    (ref.current as any).P0 = JSON.parse(JSON.stringify((ref.current as any).P));
    (ref.current as any).LC0 = JSON.parse(JSON.stringify((ref.current as any).LC));
  }
  const logic = ref.current;
  const [S, setS] = useState<any>(() => logic.state);
  const [mounted, setMounted] = useState(false);

  logic.setState = (p: any, cb?: () => void) => {
    setS((prev: any) => ({ ...prev, ...(typeof p === "function" ? p(prev) : p) }));
    if (cb) setTimeout(cb);
  };
  logic.forceUpdate = () => setS((s: any) => ({ ...s }));
  (logic as any).router = router;
  (logic as any).route = (pg: string) => router.push(PAGE_PATH[pg] || PAGE_PATH.home);
  const data = useAdminData(logic, S);
  logic.props.dataState = data.fresh ? "Brand new" : "Planning";
  logic.state = { ...S, ...(data.loaded ? data.state : {}), page: pageFromPath(pathname) };

  useEffect(() => {
    logic.componentDidMount();
    setMounted(true);
    return () => logic.componentWillUnmount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // renderVals reads the clock and localStorage, so nothing renders until after mount (no hydration drift).
  if (!mounted || !data.loaded) {
    // The prototype's skeleton while the first requests resolve.
    return (
      <div className="adm" aria-busy="true">
        <div className="main" style={{ marginLeft: 0, paddingTop: 96 }}>
          {data.failed && (
            <div className="card" style={{ maxWidth: 520, margin: "0 auto 28px", display: "grid", gap: 10 }} role="alert">
              <div className="h2">We couldn’t load your workspace.</div>
              <p className="sm mut" style={{ margin: 0 }}>Your connection dropped for a moment. Nothing was lost.</p>
              <div><button className="btn btn-p btn-s" onClick={data.retry}>Try again</button></div>
            </div>
          )}
          <div style={{ display: "grid", gap: 22, maxWidth: 960, margin: "0 auto" }}>
            <div className="sk" style={{ height: 12, width: 120 }}></div>
            <div className="sk" style={{ height: 52, width: "min(480px,80%)" }}></div>
            <div className="row" style={{ gap: 12 }}>
              {[0, 1, 2].map((i) => <div key={i} className="sk" style={{ height: 86, flex: 1, minWidth: 140 }}></div>)}
            </div>
            <div className="sk" style={{ height: 280 }}></div>
          </div>
        </div>
      </div>
    );
  }
  const v = patchVals(logic.renderVals(), data, logic);
  return <AdminContext.Provider value={{ v, logic }}>{children}</AdminContext.Provider>;
}
