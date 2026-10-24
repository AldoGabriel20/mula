// Overlays the prototype's renderVals() output with real data and API-backed handlers.
import * as M from "./mappers";
import { hasLiveTemplate } from "@/components/templates/registry";
import { manifestOf } from "@/lib/kit/manifest";
import { collectSection } from "./views/SectionForm";
import { dateToRFC3339, splitNames, typeSlug } from "./onboarding-map";

const GO: Record<string, string> = { invitation: "invitation", guests: "guests", rsvp: "guests", schedule: "events", gift: "gift", seating: "guests", checkin: "checkin", live: "live", final: "todo" };

export function patchVals(v: any, D: any, logic: any) {
  const S = logic.state;
  const say = (m: string) => logic.say(m);
  const fail = (err: any) => say(err?.message ? String(err.message) : "Something went wrong. Please try again.");
  const run = async (fn: () => Promise<any>, ok?: string, refresh: string[] = []) => {
    try { await fn(); if (ok) say(ok); if (refresh.length) D.refresh(...refresh); } catch (err) { fail(err); }
  };
  const idOf = (list: any[], local: any) => list.find((x) => x.id == local)?.uid as string | undefined;
  const base = D.base;
  const cardOf = (e: any, sel: string) => (e.currentTarget as HTMLElement).closest(sel) as HTMLElement;
  const fval = (root: HTMLElement, f: string) => (root.querySelector(`[data-f="${f}"]`) as HTMLInputElement | null)?.value || "";

  // Field errors from the API ("map_url: must be an https:// link…") are what the host needs to see.
  const apiMsg = (err: any) => {
    const f = err?.fields ? Object.values(err.fields as Record<string, string>).join(" ") : "";
    return f || (err?.message ? String(err.message) : "Something went wrong. Please try again.");
  };
  // Photos (cover, story, gallery, moments, closing): validated here for a fast answer, by the API for real.
  const MAX_IMG = 5 << 20;
  const upload = async (file: File, kind: "photo" | "cover" = "photo"): Promise<string> => {
    if (!file.type.startsWith("image/")) throw new Error("Please choose an image file (JPEG, PNG or WebP).");
    if (file.size > MAX_IMG) throw new Error("That photo is larger than 5 MB. Please choose a smaller one.");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("kind", kind);
    const m = await D.mut("POST", `${base}/media`, fd);
    D.refresh("media");
    return m.id as string;
  };

  // ---- identity ---------------------------------------------------------------------------
  const name = D.me?.name || "You";
  v.me = { name, first: name.split(" ")[0], email: D.me?.email || "", initial: (name[0] || "?").toUpperCase() };
  const now = new Date();
  const hr = now.getHours();
  const lang = (S.lang || "en") as M.Lang;
  v.L = { ...v.L, today: M.longDate(now, lang).replace(/,? \d{4}$/, "") };
  v.greeting = `${v.L.today} · ${hr < 12 ? v.L.gm : hr < 18 ? v.L.ga : v.L.ge}, ${v.me.first}`;

  // ---- overview ----------------------------------------------------------------------------
  const guests = D.guestsRaw as any[];
  const confirmed = guests.filter((g) => g.rsvp_status === "yes").length;
  const declined = guests.filter((g) => g.rsvp_status === "no").length;
  const waiting = guests.length - confirmed - declined;
  v.resp = { confirmed, waiting, declined, total: guests.length };

  const ov = D.overview;
  if (ov && !logic.fresh()) {
    const open = D.tasksRaw.filter((t: any) => !t.done).length;
    const noteFor: Record<string, string> = {
      invitation: D.invitation?.published ? "Published" : "Not published yet",
      guests: `${guests.length} on the list`,
      rsvp: `${waiting} still to reply`,
      schedule: `${D.moments.length} moment${D.moments.length === 1 ? "" : "s"} set`,
      gift: D.reg.length ? `${D.reg.length} on your registry` : "Add a gift method",
      seating: "Assign tables",
      checkin: "Print entrance QR",
      live: { Live: "You are live", Scheduled: "Scheduled", Ended: "Ended" }[S.live as string] || "Not set up",
      final: open ? `${open} task${open === 1 ? "" : "s"} open` : "All tasks done",
    };
    v.parts = ov.readiness.parts.map((p: any) => ({ n: p.label, v: p.score, w: p.score + "%", note: noteFor[p.key] || "", go: GO[p.key] || "home" }));
    const notes = (ov.notes || []).filter((n: any) => !S.dismissed?.[n.id]);
    v.notes = notes.map((n: any, i: number) => ({ id: n.id, k: n.kind, t: n.title, s: n.body, a: n.action, cls: i === 0 ? "note lead" : "note" }));
    v.noNotes = !v.notes.length;
    v.noteAct = (e: any) => {
      const id = logic.d(e).v;
      if (id === "team") logic.nav("team");
      else if (id === "tasks") logic.nav("todo");
      else logic.nav("guests");
    };
    v.noteLater = (e: any) => { const id = logic.d(e).v; run(() => D.mut("POST", `${base}/notes/${id}/dismiss`), undefined, ["overview"]); };
    v.journey = ov.journey.map((j: any, i: number, a: any[]) => ({ n: j.stage, v: j.count, s: j.caption, cls: `jn ${j.status}${i === a.length - 1 ? " last" : ""}` }));
  }
  const done = D.tasksRaw.filter((t: any) => t.done).map((t: any) => t.title);
  v.recent = done.slice(0, 4).map((t: string) => ({ t }));
  v.schedule = v.events.map((e: any) => ({ ...e, time: e.en ? `${e.s} – ${e.en}` : e.s }));
  const feed = (D.activityRaw as any[]);
  v.activity = feed.slice(0, 4).map((a) => ({ n: a.actor, i: logic.ini(a.actor), c: logic.avc(a.actor), w: a.text, t: M.ago(a.at) }));

  // ---- guests ------------------------------------------------------------------------------
  const gl: any[] = S.gl;
  const pred: Record<string, (g: any) => boolean> = {
    all: () => true, notopened: (g) => g.st === "Invited", noreply: (g) => g.st === "Pending", attending: (g) => g.st === "Attending", declined: (g) => g.st === "Not attending",
    vip: (g) => g.group === "VIP", plus: (g) => g.party > 1, follow: (g) => g.phone === "—" || (g.st === "Pending" && g.group === "Colleagues"),
  };
  if (!logic.fresh()) {
    v.segs = v.segs.map((s: any) => ({ ...s, v: gl.filter(pred[s.id]).length }));
    const c = (k: string) => gl.filter(pred[k]).length;
    const acts: Record<string, [string, string]> = {
      notopened: [`${c("notopened")} guest${c("notopened") === 1 ? " hasn’t" : "s haven’t"} opened their invitation.`, `Resend to ${c("notopened")}`],
      noreply: [`${c("noreply")} guest${c("noreply") === 1 ? "" : "s"} opened it but haven’t replied.`, `Remind ${c("noreply")} guest${c("noreply") === 1 ? "" : "s"}`],
      follow: [`${c("follow")} guest${c("follow") === 1 ? " is" : "s are"} missing a phone number or need a decision.`, "Review together"],
      declined: [`${c("declined")} guest${c("declined") === 1 ? " can’t" : "s can’t"} make it. They can still watch the live stream.`, "Send stream link"],
    };
    const a = acts[S.seg];
    v.hasSegAct = !!a && !!c(S.seg);
    v.segMsg = a ? a[0] : "";
    v.segCta = a ? a[1] : "";
  }
  v.addGuest = (e: any) => {
    e.preventDefault();
    const ng = S.ng;
    if (!ng.name.trim()) return;
    logic.setState({ modalGuest: false, ng: { name: "", phone: "", group: "Friends" } });
    run(async () => {
      let group_id: string | undefined;
      const vip = ng.group === "VIP";
      if (!vip) {
        const groups = (await D.mut("GET", `${base}/groups`)).data as any[];
        const g = groups.find((x) => x.name === ng.group) ?? (await D.mut("POST", `${base}/groups`, { name: ng.group }));
        group_id = g.id;
      }
      await D.mut("POST", `${base}/guests`, { name: ng.name.trim(), phone: ng.phone || null, group_id: group_id ?? null, plus_ones: 0, vip });
    }, `${ng.name.split(" ")[0]} has been added to your guest list.`, ["guests", "overview"]);
  };
  const drawer = gl.find((x) => x.id === S.guestId) ?? gl[0];
  if (drawer && v.gd) {
    const sent = drawer.invitedAt ? new Date(drawer.invitedAt) : null;
    const jr = [...v.gd.jr];
    jr[0] = { ...jr[0], w: sent ? `Email · ${sent.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : "Not sent yet", on: sent ? "jn done" : "jn up" };
    v.gd = { ...v.gd, note: drawer.notes, jr };
  }
  const resendOne = (g: any, ok?: string) => D.mut("POST", `${base}/guests/${g.uid}/resend`).then(() => ok && say(ok));
  v.resend = () => {
    if (!drawer) return;
    run(() => resendOne(drawer, `Invitation sent again to ${drawer.name.split(" ")[0]}.`), undefined, ["guests"]);
  };
  v.bulkResend = () => {
    const picked = Object.keys(S.sel).filter((k) => S.sel[k]).map((k) => gl.find((g) => g.id == k)).filter(Boolean) as any[];
    logic.setState({ sel: {} });
    const withMail = picked.filter((g) => g.email);
    if (!withMail.length) return say("None of the selected guests has an email address yet.");
    run(async () => {
      const res = await Promise.allSettled(withMail.map((g) => resendOne(g)));
      const ok = res.filter((x) => x.status === "fulfilled").length;
      const skipped = picked.length - ok;
      say(skipped ? `Invitations sent to ${ok}. ${skipped} had no email or failed.` : `Invitations sent to ${ok}.`);
    }, undefined, ["guests"]);
  };
  v.saveGuest = (e: any) => {
    if (!drawer) return;
    const aside = (e.currentTarget as HTMLElement).closest("aside") as HTMLElement;
    const notes = fval(aside, "notes");
    run(() => D.mut("PATCH", `${base}/guests/${drawer.uid}`, { notes }), "Guest notes saved.", ["guests"]);
  };
  v.setGSt = (e: any) => {
    const st = logic.d(e).v, uid = idOf(gl, S.guestId);
    if (!uid) return;
    const g = gl.find((x) => x.uid === uid);
    const status = st === "Attending" ? "yes" : st === "Not attending" ? "no" : "pending";
    run(() => D.mut("PATCH", `${base}/guests/${uid}`, { rsvp_status: status, party_size: status === "yes" ? g.party : 0 }), `RSVP updated for ${g.name.split(" ")[0]}.`, ["guests", "overview"]);
  };
  v.bulkDel = () => {
    const ids = Object.keys(S.sel).filter((k) => S.sel[k]).map((k) => idOf(gl, k)).filter(Boolean) as string[];
    logic.setState({ sel: {} });
    run(async () => { await Promise.all(ids.map((u) => D.mut("DELETE", `${base}/guests/${u}`))); }, "Guests removed.", ["guests", "overview"]);
  };
  v.importG = () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".csv,text/csv";
    input.onchange = async () => {
      const f = input.files?.[0]; if (!f) return;
      const rows = (await f.text()).split(/\r?\n/).map((l) => l.split(",").map((c) => c.replace(/^"|"$/g, "").trim())).filter((r) => r[0]);
      const head = rows[0].map((h) => h.toLowerCase());
      const body = head.includes("name") ? rows.slice(1) : rows;
      const col = (n: string, d: number) => (head.includes(n) ? head.indexOf(n) : d);
      const payload = body.map((r) => ({ name: r[col("name", 0)], phone: r[col("phone", 1)] || null, email: r[col("email", 2)] || null, plus_ones: 0, vip: false })).filter((g) => g.name);
      if (!payload.length) return say("We couldn’t find any guests in that file.");
      run(async () => { await D.mut("POST", `${base}/guests/import`, { guests: payload }); }, `${payload.length} guests imported.`, ["guests", "overview"]);
    };
    input.click();
  };

  // ---- tasks -------------------------------------------------------------------------------
  const todos: any[] = S.todosL;
  v.togTask = (e: any) => {
    const t = todos.find((x) => x.id == logic.d(e).v); if (!t) return;
    run(() => D.mut("PATCH", `${base}/tasks/${t.uid}`, { done: !t.done }), t.done ? undefined : `Done. “${t.title}” is now on your timeline.`, ["tasks", "overview"]);
  };
  v.delTask = (e: any) => { const u = idOf(todos, logic.d(e).v); if (u) run(() => D.mut("DELETE", `${base}/tasks/${u}`), undefined, ["tasks", "overview"]); };
  const addTask = () => {
    const title = S.nt.trim(); if (!title) return;
    logic.setState({ nt: "" });
    run(() => D.mut("POST", `${base}/tasks`, { title, priority: String(S.np).toLowerCase(), due_at: null, category: S.tc === "All" ? "Invitation" : S.tc }), "Task added.", ["tasks", "overview"]);
  };
  v.addTask = addTask;
  v.ntKey = (e: any) => { if (e.key === "Enter") addTask(); };

  // ---- schedule ----------------------------------------------------------------------------
  const moments: any[] = S.events;
  const eventDay = D.cur?.event_date ? new Date(D.cur.event_date) : new Date();
  v.addEvent = () => {
    const d = new Date(eventDay); d.setHours(19, 0, 0, 0);
    run(() => D.mut("POST", `${base}/schedule`, { title: "New moment", starts_at: d.toISOString(), venue: D.cur?.venue || null }), "A new moment was added. Fill in the details.", ["schedule", "overview"]);
  };
  v.evEdit = (e: any) => { const u = idOf(moments, logic.d(e).v); if (u) D.setOpenIds((o: any) => ({ ...o, [u]: !o[u] })); };
  v.evDel = (e: any) => { const u = idOf(moments, logic.d(e).v); if (u) run(() => D.mut("DELETE", `${base}/schedule/${u}`), "Moment removed.", ["schedule", "overview"]); };
  v.evDup = (e: any) => {
    const m = moments.find((x) => x.id == logic.d(e).v); if (!m) return;
    run(() => D.mut("POST", `${base}/schedule`, {
      title: m.name + " (copy)", starts_at: m.starts_at, ends_at: m.ends_at, venue: m.venue === "Add a venue" ? null : m.venue,
      address: m.addr, dress_code: m.dress === "—" ? "" : m.dress, description: m.desc, visibility: M.VIS_VALUE[m.vis] || "everyone",
      label: m.label, map_url: m.map, venue_note: m.note, ...(m.photoId ? { media_id: m.photoId } : {}),
    }), "Moment duplicated.", ["schedule"]);
  };
  const move = (e: any, dir: number) => {
    const i = moments.findIndex((x) => x.id == logic.d(e).v), j = i + dir;
    if (i < 0 || j < 0 || j >= moments.length) return;
    const order = moments.map((m) => m.uid); [order[i], order[j]] = [order[j], order[i]];
    run(() => D.mut("POST", `${base}/schedule/reorder`, { order }), undefined, ["schedule"]);
  };
  v.evUp = (e: any) => move(e, -1);
  v.evDown = (e: any) => move(e, 1);
  v.evSave = (e: any) => {
    const m = moments.find((x) => x.id == logic.d(e).v); if (!m) return;
    const card = (e.currentTarget as HTMLElement).closest("[data-moment]") as HTMLElement;
    const val = (f: string) => (card.querySelector(`[data-f="${f}"]`) as HTMLInputElement | null)?.value || "";
    const date = val("date"), start = val("start");
    const end = val("end");
    const starts_at = date && start ? new Date(`${date}T${start}`).toISOString() : m.starts_at;
    const ends_at = date && end ? new Date(`${date}T${end}`).toISOString() : "";
    const map = val("map").trim();
    if (map && !/^https:\/\//i.test(map)) { say("The map link must start with https://"); return; }
    const photo = (card.querySelector('[data-f="photo"]') as HTMLInputElement | null)?.files?.[0];
    const extra = card.querySelector('[data-f="label"]') ? { label: val("label").trim(), venue_note: val("note").trim() } : {};
    D.setOpenIds((o: any) => ({ ...o, [m.uid]: false }));
    (async () => {
      try {
        const media = photo ? { media_id: await upload(photo) } : {};
        await D.mut("PATCH", `${base}/schedule/${m.uid}`, {
          title: val("title") || m.name, starts_at, ends_at, venue: val("venue") || null,
          address: val("address"), dress_code: val("dress"), description: val("desc"), visibility: M.VIS_VALUE[val("vis")] || "everyone",
          map_url: map, ...extra, ...media,
        });
        say("Moment saved.");
        D.refresh("schedule", "overview");
      } catch (err) { D.setOpenIds((o: any) => ({ ...o, [m.uid]: true })); say(apiMsg(err)); }
    })();
  };
  v.evClearPhoto = (e: any) => {
    const u = idOf(moments, logic.d(e).v); if (!u) return;
    run(() => D.mut("PATCH", `${base}/schedule/${u}`, { media_id: "" }), "Photo removed.", ["schedule"]);
  };

  // ---- gifts / registry ----------------------------------------------------------------------
  const regs: any[] = S.reg;
  v.addReg = (e: any) => {
    e.preventDefault();
    const nr = S.nr; if (!nr.name.trim()) return;
    logic.setState({ regOpen: false });
    run(() => D.mut("POST", `${base}/gifts`, { title: nr.name.trim(), description: nr.desc || "", target_amount: +String(nr.price).replace(/\D/g, "") || null, url: nr.url || null, quantity: Math.max(1, Math.floor(+nr.qty) || 1) }), "Added to your registry.", ["gifts"]);
  };
  v.delReg = (e: any) => { const u = idOf(regs, logic.d(e).v); if (u) run(() => D.mut("DELETE", `${base}/gifts/${u}`), undefined, ["gifts"]); };
  v.gotReg = (e: any) => {
    const g = regs.find((x) => x.id == logic.d(e).v); if (!g || g.got >= g.qty) return;
    run(() => D.mut("PATCH", `${base}/gifts/${g.uid}`, { claimed: g.got + 1 }), undefined, ["gifts"]);
  };
  const methods: any[] = S.gifts ?? [];
  v.addGift = () => run(() => D.mut("POST", `${base}/gift-methods`, { type: "bank", title: "New gift method", detail: "Add the details", copy_value: "" }), "Gift method added. Select Edit to fill in the details.", ["gift-methods", "overview"]);
  v.gDel = (e: any) => { const u = idOf(methods, logic.d(e).v); if (u) run(() => D.mut("DELETE", `${base}/gift-methods/${u}`), undefined, ["gift-methods", "overview"]); };
  const moveMethod = (e: any, dir: number) => {
    const i = methods.findIndex((x) => x.id == logic.d(e).v), j = i + dir;
    if (i < 0 || j < 0 || j >= methods.length) return;
    const order = methods.map((m) => m.uid); [order[i], order[j]] = [order[j], order[i]];
    run(() => D.mut("POST", `${base}/gift-methods/reorder`, { order }), undefined, ["gift-methods"]);
  };
  v.gUp = (e: any) => moveMethod(e, -1);
  v.gDown = (e: any) => moveMethod(e, 1);
  // The approved layout has no inline form for a method, so Edit asks for each value in turn.
  v.editGift = (e: any) => {
    const m = methods.find((x) => x.id == logic.d(e).v); if (!m) return;
    const type = window.prompt("Type: Bank account, Digital wallet or Physical gift", m.type); if (type === null) return;
    const title = window.prompt("Name shown to guests", m.title); if (title === null) return;
    const detail = window.prompt("A short description", m.detail); if (detail === null) return;
    const copy_value = window.prompt("The value guests can copy (account number, phone number or address)", m.copy); if (copy_value === null) return;
    run(() => D.mut("PATCH", `${base}/gift-methods/${m.uid}`, { type: M.METHOD_VALUE[type.trim()] || M.METHOD_VALUE[m.type], title: title.trim(), detail, copy_value }), "Gift method saved.", ["gift-methods"]);
  };

  // ---- memories ------------------------------------------------------------------------------
  const wishes = (D.wishes as any[]).map((w) => ({ id: w.id, n: w.author_name, g: w.phase === "post" ? "After the day" : "With reply", t: w.message, i: logic.ini(w.author_name), c: logic.avc(w.author_name), approved: !!w.approved }));
  v.wishes = wishes;
  v.hasWishes = wishes.length > 0;
  v.noWishes = !wishes.length;
  v.wishCount = wishes.length;
  v.wishWeek = (D.wishes as any[]).filter((w) => Date.now() - new Date(w.created_at).getTime() < 7 * 864e5).length;
  v.pvWishes = wishes.filter((w) => w.approved).slice(0, 2);
  v.approveWish = (e: any) => { const id = logic.d(e).v; run(() => D.mut("PATCH", `${base}/wishes/${id}`, { approved: true }), "Wish approved. Guests can see it now.", ["wishes"]); };

  // ---- event day -----------------------------------------------------------------------------
  const start = D.cur?.event_date ? new Date(D.cur.event_date) : null;
  if (start) v.bars = v.bars.map((b: any, i: number) => ({ ...b, l: M.hhmm(new Date(start.getTime() + (i - 2) * 15 * 60000)) }));
  v.checkIn = (e: any) => {
    const g = gl.find((x) => x.id == logic.d(e).v); if (!g) return;
    run(() => D.mut("POST", `${base}/checkin`, { guest_id: g.uid }), `${g.name.split(" ")[0]} is checked in.`, ["checkin", "eventday"]);
  };
  const cfg = D.liveCfg || {};
  const ls = cfg.starts_at ? new Date(cfg.starts_at) : null;
  const local = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${M.hhmm(d)}`;
  v.liveCfg = { provider: cfg.provider || "YouTube Live", url: cfg.stream_url || "", starts: ls ? local(ls) : "" };
  v.liveShown = cfg.show_on_invitation !== false;
  v.togLiveShow = () => run(() => D.mut("PATCH", `${base}/live`, { show_on_invitation: !v.liveShown }), undefined, ["live"]);
  v.setLive = (e: any) => {
    const n = logic.d(e).v;
    const status = n === "Live" ? "live" : n === "Scheduled" ? "scheduled" : "offline";
    run(() => D.mut("PATCH", `${base}/live`, { status }), undefined, ["live", "eventday"]);
  };
  v.saveLive = (e: any) => {
    const card = (e.currentTarget as HTMLElement).closest("[data-live]") as HTMLElement;
    const val = (f: string) => (card.querySelector(`[data-f="${f}"]`) as HTMLInputElement | null)?.value || "";
    const url = val("url").trim();
    const status = url && (cfg.status === "offline" || !cfg.status) ? "scheduled" : cfg.status || "offline";
    const at = val("start");
    run(() => D.mut("PATCH", `${base}/live`, { provider: val("provider"), stream_url: url || null, status, starts_at: at ? new Date(at).toISOString() : "" }), "Your stream is saved.", ["live", "eventday"]);
  };

  // ---- invitation / design -------------------------------------------------------------------
  const pubd = !!D.invitation?.published;
  const setPalette = (i: number) => run(() => D.mut("PATCH", `${base}/invitation`, { palette: M.paletteValue(i) }), "Your design has been updated.", ["invitation"]);
  const origSetPal = v.setPal, origUse = v.useDesign;
  v.setPal = (e: any) => { origSetPal(e); setPalette(+logic.d(e).v); };
  // The design list is the catalog (GET /templates), matched by slug: one card per published design.
  const tplList = D.templatesRaw as any[];
  const MOCK: Record<string, string> = { Wedding: "Ana & Ken", Anniversary: "50 Years", "17th Birthday": "Nadia, 17", Editorial: "A New Chapter", Birthday: "Happy 30", "Product Launch": "Launch 26", Brand: "Opening Night" };
  const curTpl = tplList.find((x) => x.id === D.invitation?.template_id);
  const tplSlug = curTpl?.slug as string | undefined;
  const manifest = manifestOf(tplSlug);
  v.designs = tplList
    .map((t) => ({ t, tags: (t.tags as string[]).join(" · ") }))
    .filter(({ t, tags }) => (S.dcat === "All" || t.category === S.dcat || tags.includes(S.dcat)) && t.name.toLowerCase().includes((S.dq || "").toLowerCase()))
    .map(({ t, tags }) => {
      const pi = M.paletteIndex(t.palette) ?? 0, pp = logic.pals[pi];
      return { name: t.name, slug: t.slug, cat: t.category, tags, mock: MOCK[t.category] ?? t.name, bg: pp.bg, fg: pp.fg, photo: `linear-gradient(165deg,color-mix(in oklab,${pp.ac} 45%,${pp.bg}),${pp.ac})`, cur: t.id === D.invitation?.template_id, pal: pi, thumb: ((t.thumbnail_mobile ?? t.thumbnail) as string | null) ?? null };
    });
  v.noDesigns = !v.designs.length;
  // theme panel: only for a design whose manifest lists something a host may change
  const can = manifest?.customizable;
  v.themeApi = manifest && can && (can.palette.length || can.tokens.length || can.motion.length || can.fontPairings.length > 1) && D.invitation
    ? { manifest, theme: D.invitation.theme ?? {}, save: (theme: any) => D.mut("PATCH", `${base}/invitation`, { theme }).then(() => { D.refresh("invitation"); say(Object.keys(theme).length ? "Your theme has been saved." : "Back to the design's own look."); }) }
    : null;
  if (curTpl) v.designName = curTpl.name;
  v.useDesign = (e: any) => {
    origUse(e);
    const d = logic.d(e);
    const t = tplList.find((x) => x.slug === d.v);
    run(() => D.mut("PATCH", `${base}/invitation`, { ...(t ? { template_id: t.id } : {}), palette: M.paletteValue(+d.pal) }), "Your design has been updated.", ["invitation"]);
  };
  // A template with a coded renderer opens its real draft in a new tab on Preview (other designs keep the phone mock);
  // one with a manifest gets the schema-driven section form (docs/17 §11).
  const origOpenPreview = v.openPreview;
  v.openPreview = () => { if (hasLiveTemplate(tplSlug) && D.id) window.open(`/preview/${D.id}`, "_blank", "noopener"); else origOpenPreview(); };
  const SEC: Record<string, string> = { cover: "hero", main: "opening", story: "story", events: "schedule", gallery: "gallery", rsvp: "rsvp", wishes: "wishes", gift: "gift", music: "music", closing: "closing" };
  const apiSecs: any[] = D.invitation?.sections ?? [];
  const apiSec = (id: string) => apiSecs.find((x) => x.type === SEC[id]);
  v.secs = v.secs.map((x: any) => { const a = apiSec(x.id); return a ? { ...x, c: a.visible ? "var(--ok)" : "var(--wt)" } : x; });
  v.secOn = apiSec(S.sec) ? !!apiSec(S.sec).visible : true;
  v.togSection = (e: any) => {
    const a = apiSec(S.sec);
    if (!a) { v.tg(e); return; }
    run(() => D.mut("PATCH", `${base}/invitation/sections/${a.id}`, { visible: !a.visible }), a.visible ? "Hidden from guests." : "Shown to guests.", ["invitation"]);
  };
  const dl = D.invitation?.rsvp_deadline ? new Date(D.invitation.rsvp_deadline) : null;
  v.rsvpBy = dl ? `${dl.getUTCFullYear()}-${String(dl.getUTCMonth() + 1).padStart(2, "0")}-${String(dl.getUTCDate()).padStart(2, "0")}` : "";
  const cur = apiSec(S.sec);
  v.secHeading = cur?.content?.title ?? v.secName;
  v.secBody = cur?.content?.body ?? "";
  v.secId = S.sec;
  v.saveInv = (e: any) => {
    const panel = (e.currentTarget as HTMLElement).closest(".card, section, div[data-inv]") as HTMLElement | null;
    const root = (panel?.parentElement ?? document.body) as HTMLElement;
    const calls: Promise<any>[] = [];
    const hero = apiSec("cover");
    const edit = S.itx?.[S.plang] || {};
    if (hero && (edit.greet !== undefined || edit.line !== undefined)) {
      const content = { ...(hero.content || {}), ...(edit.greet !== undefined ? { title: edit.greet } : {}), ...(edit.line !== undefined ? { line: edit.line } : {}) };
      calls.push(D.mut("PATCH", `${base}/invitation/sections/${hero.id}`, { content }));
    }
    const field = (f: string) => root.querySelector(`[data-f="${f}"]`) as HTMLInputElement | null;
    const inPanel = (sel: string) => [...(panel ?? root).querySelectorAll<HTMLInputElement>(sel)];
    // One PATCH per section: heading + body (generic sections), plus what the Gilded Seal panels add.
    if (cur && cur.type !== "hero") {
      let content: Record<string, any> | null = null;
      let visible: boolean | undefined;
      if (field("body")) content = { ...(cur.content || {}), title: field("heading")?.value ?? "", body: field("body")?.value ?? "" };
      const form = manifest ? collectSection(panel ?? root, cur.type, cur.content || {}) : null;
      if (form) {
        content = { ...(content ?? cur.content ?? {}), ...form.content };
        visible = form.visible;
      }
      if (content) calls.push(D.mut("PATCH", `${base}/invitation/sections/${cur.id}`, { content, ...(visible !== undefined ? { visible } : {}) }));
    }
    const by = field("rsvpBy");
    if (by) calls.push(D.mut("PATCH", `${base}/invitation`, { rsvp_deadline: by.value ? new Date(`${by.value}T23:59:59Z`).toISOString() : "" }));
    if (!calls.length) return say("Your changes have been saved.");
    (async () => {
      try { await Promise.all(calls); say("Your changes have been saved."); D.refresh("invitation", "overview"); } catch (err) { say(apiMsg(err)); }
    })();
  };

  // ---- section form: photos and structured content (docs/15 §4.1, docs/17 §11.2) --------------
  // Photo controls act at once (upload, then merge the id into the section); text fields wait for "Save changes".
  const secOf = (type: string) => apiSecs.find((x) => x.type === type);
  const patchSection = async (type: string, patch: Record<string, any>, visible?: boolean) => {
    const s = secOf(type);
    if (!s) throw new Error("Pick a design with this section under Design first.");
    await D.mut("PATCH", `${base}/invitation/sections/${s.id}`, { content: { ...(s.content || {}), ...patch }, ...(visible !== undefined ? { visible } : {}) });
    D.refresh("invitation");
  };
  const act = async (fn: () => Promise<unknown>, ok: string) => {
    try { await fn(); say(ok); } catch (err) { say(apiMsg(err)); }
  };
  const maxGallery = manifest?.capabilities.gallery.max ?? 12;
  v.sf = !manifest ? null : {
    has: (type: string) => !!secOf(type),
    content: (type: string) => secOf(type)?.content ?? {},
    mediaUrl: (id?: string | null) => (id ? ((D.mediaRaw as any[]).find((m) => m.id === id)?.url as string | undefined) : undefined),
    maxGallery,
    /** Set a single-photo field (hero.photo_id, closing.photo_id). `file` null clears it. */
    setPhoto: (type: string, field: string, file: File | null, kind: "photo" | "cover" = "photo") =>
      act(async () => patchSection(type, { [field]: file ? await upload(file, kind) : "" }), file ? "Photo saved." : "Photo removed."),
    /** A photo-id list (story.photo_ids) keeps one slot per photo; a cleared slot is "". */
    setPhotoAt: (type: string, field: string, index: number, slots: number, file: File | null) =>
      act(async () => {
        const ids: string[] = [...((secOf(type)?.content?.[field] as string[]) ?? [])];
        while (ids.length < slots) ids.push("");
        ids[index] = file ? await upload(file) : "";
        await patchSection(type, { [field]: ids });
      }, file ? "Photo saved." : "Photo removed."),
    addGallery: (files: File[]) =>
      act(async () => {
        const have: any[] = [...((secOf("gallery")?.content?.photos as any[]) ?? [])];
        const room = maxGallery - have.length;
        if (room <= 0) throw new Error(`The gallery holds up to ${maxGallery} photos.`);
        for (const f of files.slice(0, room)) have.push({ id: await upload(f), alt: "" });
        await patchSection("gallery", { photos: have }, true); // photos make the section show
        if (files.length > room) throw new Error(`Only ${room} more photo${room === 1 ? "" : "s"} fit; the rest were skipped.`);
      }, "Photos added."),
    removeGallery: (id: string) =>
      act(async () => patchSection("gallery", { photos: ((secOf("gallery")?.content?.photos as any[]) ?? []).filter((p) => p.id !== id) }), "Photo removed."),
  };
  const publishReal = async (after?: () => void) => {
    try {
      await D.mut("POST", `${base}/invitation/${pubd ? "unpublish" : "publish"}`);
      D.refresh("invitation", "overview");
      if (pubd) say("Your invitation is no longer visible to guests."); else logic.publish();
      after?.();
    } catch (err: any) {
      const f = err?.fields ? Object.keys(err.fields).join(", ") : "";
      say(err?.message ? String(err.message) + (f ? ` (${f})` : "") : "We couldn’t publish yet.");
    }
  };
  v.publish = () => publishReal();
  const origPubInv = v.pubInv;
  v.pubInv = (e: any) => { if (logic.d(e).v == 1 && D.invitation) publishReal(); else origPubInv(e); };

  // ---- onboarding (creates the real event) ---------------------------------------------------
  v.obNext = () => {
    if (S.ob < 7) { logic.setState({ ob: S.ob + 1 }); return; }
    run(async () => {
      const [a, b] = splitNames(S.obNames);
      const ev = await D.mut("POST", "/api/v1/events", { type: typeSlug(S.obType), couple_a: a, couple_b: b, event_date: dateToRFC3339(S.obDate), venue: S.obVenue || null, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
      const eb = `/api/v1/events/${ev.id}`;
      await D.mut("PATCH", `${eb}/invitation`, { palette: M.paletteValue(S.pal) });
      for (const n of S.obGuests) await D.mut("POST", `${eb}/guests`, { name: n });
      D.setEventId(ev.id);
      logic.setState({ obOpen: false, ob: 0, obNames: "", obDate: "", obVenue: "", obGuests: [] });
      try { await D.mut("POST", `${eb}/invitation/publish`); logic.publish(); } catch (err: any) { say(err?.message ? String(err.message) : "Your celebration is ready. Publish when you are."); }
      logic.nav("home");
    });
  };

  // ---- account -------------------------------------------------------------------------------
  v.sendInvite = (e: any) => {
    const row = (e.currentTarget as HTMLElement).parentElement as HTMLElement;
    const email = (S.invite || "").trim();
    if (!email) return;
    if (!email.includes("@")) return say("Enter an email address. Phone invitations aren’t available yet.");
    const role = M.ROLE_VALUE[fval(row, "role")] || "family";
    logic.setState({ invite: "" });
    run(() => D.mut("POST", `${base}/members`, { email, role }), "Invitation to collaborate sent.", ["members", "activity"]);
  };
  v.ushers = (D.membersRaw as any[]).filter((m) => m.role === "usher").map((m) => ({ n: m.name || m.email, ev: m.status === "active" ? "Event day" : "Invited", r: "Usher", i: logic.ini(m.name || m.email), c: logic.avc(m.name || m.email) }));
  v.logout = async () => { try { await D.mut("POST", "/api/v1/auth/logout"); } catch {} logic.router?.push("/login"); };
  v.me.phone = D.me?.phone || "";
  v.saveProfile = (e: any) => { const r = cardOf(e, "[data-profile]"); run(() => D.mut("PATCH", "/api/v1/me", { name: fval(r, "name").trim() || name, phone: fval(r, "phone").trim() }), "Your profile is saved.", []).then(() => D.qc.invalidateQueries({ queryKey: ["me"] })); };
  const device = (ua: string) => (/iphone/i.test(ua) ? "iPhone" : /ipad/i.test(ua) ? "iPad" : /android/i.test(ua) ? "Android" : /mac/i.test(ua) ? "Mac" : /windows/i.test(ua) ? "Windows PC" : /linux/i.test(ua) ? "Linux" : "Browser");
  v.sessions = (D.sessionsRaw as any[]).map((x) => ({ id: x.id, cur: !!x.current, n: x.current ? "This device" : `${device(x.user_agent || "")}${x.ip ? ` · ${x.ip}` : ""}`, w: x.current ? "Now" : M.ago(x.created_at) }));
  v.revokeSession = (e: any) => run(() => D.mut("DELETE", `/api/v1/me/sessions/${logic.d(e).v}`), "That device was signed out.", []).then(() => D.qc.invalidateQueries({ queryKey: ["sessions"] }));
  v.changePw = (e: any) => {
    const r = cardOf(e, "[data-security]"), cur = fval(r, "cur"), nw = fval(r, "new");
    if (nw.length < 8) return say("Use at least 8 characters for your new password.");
    run(async () => { await D.mut("POST", "/api/v1/me/password", { current: cur, new: nw }); r.querySelectorAll("input[type=password]").forEach((i: any) => (i.value = "")); }, "Password updated.");
  };
  const NOTIF = [["replies", "New replies"], ["summary", "Daily summary"], ["payments", "Payment updates"], ["tips", "Tips from Mula"]];
  const np = D.prefs?.notifications || {};
  v.notifPrefs = NOTIF.map(([k, n]) => ({ k, n, on: (np[k] ?? (k !== "tips")) ? "tog on" : "tog", ar: String(!!(np[k] ?? (k !== "tips"))) }));
  v.togNotif = (e: any) => { const k = logic.d(e).v; const cur = np[k] ?? (k !== "tips"); run(() => D.mut("PATCH", "/api/v1/me/preferences", { notifications: { ...Object.fromEntries(NOTIF.map(([x]) => [x, np[x] ?? (x !== "tips")])), [k]: !cur } }), undefined, []).then(() => D.qc.invalidateQueries({ queryKey: ["prefs"] })); };
  const origLang = v.setLangE, origTheme = v.setThemeE;
  v.setLangE = (e: any) => { const l = logic.d(e).v; origLang(e); D.mut("PATCH", "/api/v1/me/preferences", { locale: l === "ms" ? "my" : l }).catch(() => {}); };
  v.setThemeE = (e: any) => { const t = logic.d(e).v; origTheme(e); D.mut("PATCH", "/api/v1/me/preferences", { theme: t }).catch(() => {}); };
  const code = D.referral?.code || "";
  v.refLink = code ? `mula.id/r/${code}` : "";
  v.copyRef = () => { try { navigator.clipboard.writeText(`https://mula.id/r/${code}`); } catch {} say("Your referral link is copied."); };
  v.refStats = [[D.referral?.signups ?? 0, "Signed up"], [D.referral?.published ?? 0, "Celebrated with Mula"]].map((x) => ({ v: x[0], l: x[1] }));
  v.refHist = [];
  const arrivedIds = new Set((D.arrivals as any[]).map((a) => a.guest_id));
  const att: any[] = [
    ...guests.filter((g) => g.vip && arrivedIds.has(g.id)).map((g) => ({ tag: "VIP", cls: "b-wt", text: `${g.name} has arrived.` })),
    ...(waiting ? [{ tag: "RSVP", cls: "b-in", text: `${waiting} guest${waiting === 1 ? " hasn’t" : "s haven’t"} replied yet.` }] : []),
  ];
  v.attention = att.length ? att : [{ tag: "", cls: "", text: "Nothing needs your attention right now." }];
  const since = D.me?.created_at ? new Date(D.me.created_at) : null;
  v.me.since = since ? since.toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : "";
  v.me.events = D.list.length;

  // ---- purchases -----------------------------------------------------------------------------
  const subName = D.subscription?.package_name;
  v.pkgName = subName || "No package yet";
  v.billingLine = D.subscription
    ? `${D.subscription.package_name} · ${D.subscription.status}${D.subscription.current_period_end ? ` · until ${new Date(D.subscription.current_period_end).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}` : ""}`
    : "You haven’t chosen a package yet. Pick one below to publish with everything unlocked.";
  const subSlug = D.subscription?.package;
  v.pkgs = (D.packagesRaw as any[]).map((p) => ({
    id: p.slug, n: p.name, price: M.idr(p.price), sub: p.features?.[0] || "", items: p.features || [], cur: subSlug === p.slug, dark: p.slug === "signature",
    cta: subSlug === p.slug ? "Your package" : `Choose ${p.name}`, dis: subSlug === p.slug,
    style: p.slug === "signature" ? "background:var(--ink);color:var(--onink);border-color:var(--ink)" : "",
  }));
  v.pickPkg = (e: any) => {
    const slug = logic.d(e).v;
    run(async () => {
      const r = await D.mut("POST", "/api/v1/billing/checkout", { package: slug });
      if (r?.url && /^https?:\/\//.test(r.url)) window.location.href = r.url; else say("Checkout started.");
    });
  };
  v.upgrade = () => logic.nav("packages");
  v.applyPromo = () => say("Promo codes aren’t available yet.");
  v.pay = () => {
    const slugs = (S.addonsL as any[]).filter((a) => S.cartL.some((c: any) => c.id === a.id)).map((a) => a.slug);
    if (!slugs.length) return;
    run(async () => {
      const r = await D.mut("POST", "/api/v1/billing/checkout", { addons: slugs });
      logic.setState({ cartL: [] });
      D.qc.invalidateQueries({ queryKey: ["subscription"] }); D.qc.invalidateQueries({ queryKey: ["invoices"] });
      if (r?.url && /^https?:\/\//.test(r.url)) window.location.href = r.url;
      else { logic.nav("billing"); say("Your order is placed. It will show as paid once the payment is confirmed."); }
    });
  };
  v.usage = [
    ["Invitations", D.invitation ? 1 : 0, S.pkg === "advanced" ? 10 : 3],
    ["Guests", guests.length, S.pkg === "advanced" ? 1000 : 300],
    ["Gallery photos", (D.mediaRaw as any[]).length, S.pkg === "advanced" ? 60 : 24],
  ].map((u: any) => ({ n: u[0], v: `${u[1]} of ${u[2].toLocaleString("en")}`, w: Math.min(100, Math.round((u[1] / u[2]) * 100)) + "%", c: u[1] >= u[2] ? "var(--wt)" : "var(--ink)" }));

  // ---- celebrations / notifications ----------------------------------------------------------
  v.cycleEvt = () => {
    if (D.list.length < 2) return say("This is your only celebration so far. Create another from Settings.");
    const next = D.list[(D.list.findIndex((x: any) => x.id === D.id) + 1) % D.list.length];
    D.setEventId(next.id);
    say(`Switched to ${next.couple_a || "your celebration"}${next.couple_b ? " & " + next.couple_b : ""}.`);
  };
  const notifs = (D.activityRaw as any[]).slice(0, 6).map((a) => ({ t: `${a.actor} ${a.text}`, w: M.ago(a.at), u: !S.notifRead }));
  v.notifs = notifs.map((n) => ({ ...n, bg: n.u ? "background:var(--bg2)" : "", dot: n.u ? "var(--dot)" : "transparent" }));
  v.hasUnread = notifs.some((n) => n.u);
  v.readAll = () => logic.setState({ notifRead: true });
  return v;
}
