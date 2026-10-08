import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Unmount rendered trees between tests (vitest has no auto-cleanup without `globals` hooks
// registered by RTL).
afterEach(() => cleanup());
