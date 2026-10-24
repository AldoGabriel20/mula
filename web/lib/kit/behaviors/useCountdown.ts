"use client";

import { useEffect, useState } from "react";
import { countdown, type Countdown } from "../model/time";

/** What the server and the first client render show, so hydration matches. */
const WAITING = { running: true, ended: false, endedText: "", d: "—", h: "—", m: "—", s: "—" } as const;

export type Ticking = Omit<Countdown, "d"> & { d: number | "—"; ready: boolean };

/** Ticks once a second from mount. Before mount d/h/m/s are "—" and `ready` is false. */
export function useCountdown(weddingIso: string): Ticking {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now == null ? { ...WAITING, ready: false } : { ...countdown(weddingIso, now), ready: true };
}
