"use client";

import { useEffect, useState } from "react";
import { Engine, type EngineOptions } from "./engine";

/**
 * One Engine per template mount. It survives StrictMode's simulated unmount (state is kept), so the
 * effect re-mounts the same instance after `unmount()` has undone everything. Declare this hook
 * BEFORE any effect that uses the engine so it mounts first.
 */
export function useEngine(opts?: EngineOptions): Engine {
  const [engine] = useState(() => new Engine(opts));
  useEffect(() => {
    engine.mount();
    return () => engine.unmount();
  }, [engine]);
  return engine;
}
