import type { ReactNode } from "react";

/**
 * One layer of the album stack: sticky, with an inner wrapper the engine scales and a shade it
 * darkens as the next layer slides over (docs/15 §8.5). The engine finds layers by these data attributes.
 */
export function StackLayer({ z, children }: { z: number; children: ReactNode }) {
  return (
    <div data-stack-layer="" style={{ position: "sticky", top: 0, zIndex: z }}>
      <div data-stack-inner="" style={{ position: "relative" }}>
        {children}
      </div>
      <div data-stack-shade="" aria-hidden="true" style={{ position: "absolute", inset: 0, background: "#15110E", opacity: 0, pointerEvents: "none" }} />
    </div>
  );
}
