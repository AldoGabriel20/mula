"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/fetcher";

// One client per dashboard session. Scoped to /app/* so marketing, auth and the public
// invitation never download or initialise React Query.
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Fresh for 15s: de-duplicates bursts (focus + remount) without hiding changes for long.
            // refetchOnWindowFocus stays at its default (true) ON PURPOSE: signed media URLs expire
            // after 15 min, and a tab left open must re-fetch the list (new URLs) when you return.
            staleTime: 15_000,
            // 4xx are deterministic (401 already redirected, 403/404 won't change): never retry them.
            // Network/5xx get 2 retries with the default exponential backoff.
            retry: (failureCount, error) =>
              !(error instanceof ApiError && error.status >= 400 && error.status < 500) && failureCount < 2,
          },
        },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
