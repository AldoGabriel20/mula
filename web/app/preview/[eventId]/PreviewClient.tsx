"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api/fetcher";
import { fetchPreview, type Invite } from "@/lib/api/invite";
import { ErrorState, Skeleton } from "@/components/ui";
import { TemplateHost } from "@/components/templates/TemplateHost";
import { hasLiveTemplate } from "@/components/templates/registry";

type State = { kind: "loading" } | { kind: "ready"; invite: Invite } | { kind: "error"; message: string };

/**
 * Draft preview of an invitation for its host (GS-052). Fetches the guest-shaped page with the
 * session cookie and renders it with the template's own renderer in `preview` mode: nothing the
 * visitor does here is sent anywhere. A 401 is handled by the fetcher (it redirects to login).
 */
export function PreviewClient({ eventId }: { eventId: string }) {
  const [state, setState] = useState<State>({ kind: "loading" });

  const load = useCallback(() => {
    setState({ kind: "loading" });
    fetchPreview(eventId).then(
      (invite) => setState({ kind: "ready", invite }),
      (e: unknown) => setState({ kind: "error", message: e instanceof ApiError && e.status === 404 ? "This preview is not available. Open the invitation editor first, then try again." : "We could not load the preview." }),
    );
  }, [eventId]);
  useEffect(load, [load]);

  if (state.kind === "loading") {
    return (
      <main aria-busy="true" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
        <div style={{ width: "min(420px,100%)", display: "grid", gap: 14 }}>
          <Skeleton height={28} width="60%" />
          <Skeleton lines={3} />
        </div>
      </main>
    );
  }
  if (state.kind === "error") {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
        <ErrorState message={state.message} onRetry={load} />
      </main>
    );
  }

  const { invite } = state;
  if (!hasLiveTemplate(invite.template)) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
        <p>The phone preview in the editor shows this design. Pick Gilded Seal under Design to preview it here.</p>
      </main>
    );
  }
  return (
    <>
      <TemplateHost slug={invite.template} invite={invite} mode="preview" />
      <div aria-hidden="true" style={{ position: "fixed", top: 10, left: "50%", translate: "-50% 0", zIndex: 500, padding: "6px 14px", borderRadius: 999, background: "rgba(35,29,24,.78)", color: "#F4ECDF", font: "600 10px/1 system-ui, sans-serif", letterSpacing: ".24em", textTransform: "uppercase", pointerEvents: "none" }}>
        Draft preview · only you can see this
      </div>
    </>
  );
}
