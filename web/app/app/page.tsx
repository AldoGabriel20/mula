"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Skeleton, ErrorState } from "@/components/ui";
import { customInstance } from "@/lib/api/fetcher";

// /app has no UI of its own: route by whether the user has any celebration yet.
export default function AppIndex() {
  const router = useRouter();
  const q = useQuery({
    queryKey: ["events"],
    queryFn: () => customInstance<{ data: { id: string }[] }>({ url: "/api/v1/events", method: "GET" }),
  });

  useEffect(() => {
    if (!q.data) return;
    router.replace(q.data.data.length === 0 ? "/app/onboarding" : "/app/overview");
  }, [q.data, router]);

  if (q.isError) return <ErrorState message="Couldn't load your celebrations." onRetry={() => q.refetch()} />;
  return <Skeleton lines={4} />;
}
