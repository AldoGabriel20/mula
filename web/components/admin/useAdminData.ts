"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { customInstance as api } from "@/lib/api/fetcher";
import * as M from "./mappers";

const KEY = "mula-current-event";
const get = <T,>(url: string) => api<T>({ url, method: "GET" });

// Loads what the API has and returns (a) state the prototype logic reads, (b) a `patch` that swaps the
// prototype's hard-coded numbers and handlers for real ones. Everything the API has no table for
// (multiple invitations, team, print, AI, notifications…) keeps the prototype's own data.
export function useAdminData(logic: any, S: any) {
  const qc = useQueryClient();
  const me = useQuery({ queryKey: ["me"], queryFn: () => get<any>("/api/v1/me") });
  const events = useQuery({ queryKey: ["events"], queryFn: () => get<{ data: any[] }>("/api/v1/events") });
  const [eid, setEid] = useState<string | null>(null);
  useEffect(() => { try { setEid(localStorage.getItem(KEY)); } catch {} }, []);
  const list = events.data?.data ?? [];
  const cur = list.find((e: any) => e.id === eid) ?? list[0] ?? null;
  const id: string | undefined = cur?.id;
  const on = !!id;
  const base = `/api/v1/events/${id}`;
  const useEv = (key: string, path: string) => useQuery({ queryKey: [key, id], enabled: on, queryFn: () => get<any>(`${base}${path}`) });

  const overview = useEv("overview", "/overview");
  const guests = useEv("guests", "/guests");
  const tasks = useEv("tasks", "/tasks");
  const schedule = useEv("schedule", "/schedule");
  const gifts = useEv("gifts", "/gifts");
  const wishes = useEv("wishes", "/wishes");
  const checkin = useEv("checkin", "/checkin");
  const eventday = useEv("eventday", "/eventday");
  const live = useEv("live", "/live");
  const invitation = useEv("invitation", "/invitation");
  const media = useEv("media", "/media");
  const methods = useEv("gift-methods", "/gift-methods");
  const members = useEv("members", "/members");
  const activity = useEv("activity", "/activity?limit=12");
  const invoices = useQuery({ queryKey: ["invoices"], queryFn: () => get<any>("/api/v1/billing/invoices") });
  const subscription = useQuery({ queryKey: ["subscription"], queryFn: () => get<any>("/api/v1/billing/subscription") });
  const packages = useQuery({ queryKey: ["packages"], queryFn: () => get<any>("/api/v1/packages") });
  const addons = useQuery({ queryKey: ["addons"], queryFn: () => get<any>("/api/v1/addons") });
  const sessions = useQuery({ queryKey: ["sessions"], queryFn: () => get<any>("/api/v1/me/sessions") });
  const templates = useQuery({ queryKey: ["templates"], queryFn: () => get<any>("/api/v1/templates"), staleTime: 3600e3 });
  const prefs = useQuery({ queryKey: ["prefs"], queryFn: () => get<any>("/api/v1/me/preferences") });
  const referral = useQuery({ queryKey: ["referral"], queryFn: () => get<any>("/api/v1/me/referral") });

  // Stable numeric ids: the prototype logic does `+dataset.v` on ids.
  const ids = useRef(new Map<string, number>());
  const numId = (uuid: string) => {
    let n = ids.current.get(uuid);
    if (!n) { n = ids.current.size + 1; ids.current.set(uuid, n); }
    return n;
  };
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});

  const gl = (guests.data?.data ?? []).map((g: any) => M.toGuest(g, numId(g.id)));
  const todosL = (tasks.data?.data ?? []).map((t: any) => M.toTodo(t, numId(t.id)));
  const moments = (schedule.data?.data ?? []).map((s: any) => M.toMoment(s, numId(s.id), !!openIds[s.id]));
  const reg = (gifts.data?.data ?? []).map((g: any) => M.toRegistry(g, numId(g.id)));
  const methodsL = (methods.data?.data ?? []).map((m: any) => M.toMethod(m, numId(m.id)));
  const membersL = (members.data?.data ?? []).map((m: any) => M.toMember(m, numId(m.id)));
  const txL = (invoices.data?.data ?? []).map(M.toTx);
  const ready = overview.data?.readiness?.score ?? 0;

  const built = M.buildEvent(cur, logic.P0, logic.LC0, ready, moments, cur?.created_at);
  logic.P.api = built.P;
  logic.LC.api = built.LC;
  logic.slug = cur ? [cur.couple_a, cur.couple_b].filter(Boolean).join("-").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "celebration" : "your-event";

  const arrivals: any[] = checkin.data?.data ?? [];
  const liveCfg = live.data;
  const liveState = !liveCfg?.status || liveCfg.status === "offline" ? (liveCfg?.stream_url ? "Ended" : "Not configured") : liveCfg.status === "live" ? "Live" : "Scheduled";
  const checked = eventday.data?.checked_in ?? arrivals.length;

  const fresh = events.isSuccess && list.length === 0;
  const loaded = events.isSuccess && me.isSuccess;
  const failed = events.isError || me.isError;
  const retry = () => { events.refetch(); me.refetch(); };

  const subSlug = subscription.data?.subscription?.package;
  const pkg = subSlug === "signature" ? "advanced" : subSlug ? "onetime" : "free";
  const palName: string | undefined = invitation.data?.palette;
  logic.pals = M.protoPals(); // swatches come from catalog/palettes.json
  const palIdx = M.paletteIndex(palName);
  logic.expected = eventday.data?.expected ?? 0;
  logic.base0 = checked;

  // Rehearsal mode (event day) simulates arrivals locally; don't overwrite those counters while it runs.
  const live_ = S?.sim ? {} : {
    checked,
    feed: arrivals.slice(0, 6).map((a) => ({ n: a.guest_name, t: a.group_name || "Guest", w: M.hhmm(new Date(a.checked_in_at)) })),
    bars: M.arrivalBars(arrivals, cur?.event_date),
  };
  const state: any = { evt: "api", events: moments, gl, todosL, reg, txL, live: liveState, pkg, ...live_ };
  if (palIdx !== undefined) state.pal = palIdx;
  const gRaw: any[] = guests.data?.data ?? [];
  const lang0 = invitation.data?.content_language === "my" ? "ms" : invitation.data?.content_language || "en";
  const full = { id: 100, en: 100, ms: 100 } as any;
  // Invitation #1 is the real one; the API has a single invitation per event (the rest of the list is session-only).
  state.invs = (S?.invs ?? []).map((i: any) =>
    i.id === 1
      ? { ...i, name: "Main invitation", aud: "Everyone", audN: gRaw.length, lang: lang0, pal: palIdx ?? i.pal, path: "", st: invitation.data?.published ? "Published" : "Draft",
          views: gRaw.filter((g) => g.opened).length, replies: gRaw.filter((g) => g.rsvp_status !== "pending").length, tr: { id: lang0 === "id" ? 100 : 0, en: lang0 === "en" ? 100 : 0, ms: lang0 === "ms" ? 100 : 0 } }
      : i,
  );
  const ownedAo: Record<string, string> = Object.fromEntries((subscription.data?.addons ?? []).map((a: any) => [a.slug, a.status]));
  state.addonsL = (addons.data?.data ?? []).map((a: any) => ({
    id: numId("addon:" + a.slug), slug: a.slug, cat: "Add-on", name: a.name, desc: (a.features || []).join(" · "), p: a.price,
    st: ownedAo[a.slug] === "active" ? "Purchased" : ownedAo[a.slug] === "pending" ? "Pending" : "Available",
  }));
  state.team = membersL;
  state.gifts = methodsL;
  const tpl = (templates.data?.data ?? []).find((t: any) => t.id === invitation.data?.template_id);
  if (tpl) state.design = tpl.name;
  void full;

  const refresh = (...keys: string[]) => keys.forEach((k) => qc.invalidateQueries({ queryKey: [k, id] }));
  const mut = async (method: string, url: string, data?: unknown) => api<any>({ url, method, data });

  return { failed, retry, prefs: prefs.data, referral: referral.data, subscription: subscription.data?.subscription, packagesRaw: packages.data?.data ?? [], addonsRaw: addons.data?.data ?? [], mediaRaw: media.data?.data ?? [], invoicesLoaded: invoices.isSuccess, me: me.data, cur, list, id, fresh, loaded, state, overview: overview.data, guestsRaw: guests.data?.data ?? [], tasksRaw: tasks.data?.data ?? [],
    arrivals, methodsRaw: methods.data?.data ?? [], membersRaw: members.data?.data ?? [], activityRaw: activity.data?.data ?? [], sessionsRaw: sessions.data?.data ?? [], templatesRaw: templates.data?.data ?? [], eventday: eventday.data, wishes: wishes.data?.data ?? [], invitation: invitation.data, qc, base, mut, refresh, numId, setOpenIds,
    setEventId: (v: string) => { setEid(v); try { localStorage.setItem(KEY, v); } catch {} qc.invalidateQueries(); }, ready, moments, gl, todosL, reg, txL, liveCfg };
}
