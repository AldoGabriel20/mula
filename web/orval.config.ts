import { defineConfig } from "orval";

// Generates typed React Query hooks from the backend OpenAPI contract into
// lib/api/generated.ts, routing every call through lib/api/fetcher.ts.
export default defineConfig({
  mula: {
    input: "../api/openapi.yaml",
    output: {
      target: "lib/api/generated.ts",
      client: "react-query",
      mode: "single",
      clean: false,
      prettier: false,
      override: {
        mutator: { path: "lib/api/fetcher.ts", name: "customInstance" },
        query: { useQuery: true, useMutation: true },
      },
    },
  },
});
