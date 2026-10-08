import { describe, it, expect } from "vitest";

// Scaffold smoke test: proves the vitest pipeline runs clean (FND-001).
// Component/JSX tests arrive with DS-002 (needs @vitejs/plugin-react).
describe("scaffold", () => {
  it("runs the test pipeline", () => {
    expect(1 + 1).toBe(2);
  });
});
