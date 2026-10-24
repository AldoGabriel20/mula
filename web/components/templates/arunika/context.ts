import { createContext, useContext } from "react";
import type { useMusic } from "@/lib/kit/behaviors/useMusic";
import type { Engine } from "@/lib/kit/motion/engine";
import type { TemplateMode } from "../types";
import type { ArConfig } from "./config";
import type { Derived } from "./derive";

export type Ar = {
  mode: TemplateMode;
  token?: string;
  config: ArConfig;
  d: Derived;
  engine: Engine;
  /** Effective motion: "off" for reduced motion or the host's choice, else the theme's level. */
  motion: "full" | "calm" | "off";
  /** A mouse-like pointer: pointer parallax runs only here. */
  fine: boolean;
  /** The envelope has been opened (or there is none): the collage may fall into place. */
  opened: boolean;
  music: ReturnType<typeof useMusic>;
};
export const ArContext = createContext<Ar | null>(null);
export function useAr(): Ar {
  const v = useContext(ArContext);
  if (!v) throw new Error("useAr outside <Arunika>");
  return v;
}
