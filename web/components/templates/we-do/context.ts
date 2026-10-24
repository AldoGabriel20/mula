import { createContext, useContext } from "react";
import type { useMusic } from "@/lib/kit/behaviors/useMusic";
import type { Engine } from "@/lib/kit/motion/engine";
import type { TemplateMode } from "../types";
import type { WeDoConfig } from "./config";
import type { Derived } from "./derive";

export type Wd = { mode: TemplateMode; token?: string; config: WeDoConfig; d: Derived; engine: Engine; reduced: boolean; music: ReturnType<typeof useMusic> };
export const WdContext = createContext<Wd | null>(null);
export function useWd(): Wd {
  const v = useContext(WdContext);
  if (!v) throw new Error("useWd outside <WeDo>");
  return v;
}
