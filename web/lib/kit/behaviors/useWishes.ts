"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { listWishes, submitWish, type InviteWish } from "@/lib/api/invite";
import type { KitMode } from "../useTheme";

/** A wish as a card shows it; only demo samples carry a relation ("Friend of the bride"). */
export type KitWish = InviteWish & { relation?: string };
export type WishStatus = "idle" | "sending" | "local" | "sent" | "error";

const PAGE = 20;
const MAX_IN_MEMORY = 200;
const MAX_LOCAL = 50;
const MAX_TEXT = 300;
const clip = (w: InviteWish): InviteWish => ({ id: String(w.id), name: String(w.name || "A guest").slice(0, 60), message: String(w.message || "").slice(0, 300) });

export type WishesInput = {
  mode: KitMode;
  token?: string;
  /** A personal link: the author is the guest and cannot be edited. */
  nameLocked: boolean;
  guestName: string;
  /** Demo only: the wishes shown before a visitor writes one. */
  samples: KitWish[];
  /** Called (next tick) after the visitor's own wish was added, for the template's own flourish. */
  onAdded?: () => void;
};

/**
 * The guestbook behaviour of every template (docs/17 §7.7). `live` reads the approved wishes page by page and
 * posts new ones to the API; `preview` and `demo` keep new wishes on this device only (nothing is sent).
 * `idx` is an ever-growing cursor into the list (the template wraps it); `step` moves it and prefetches.
 */
export function useWishes(i: WishesInput) {
  const live = i.mode === "live" && !!i.token;
  const token = i.token;
  const [remote, setRemote] = useState<InviteWish[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [local, setLocal] = useState<InviteWish[]>([]);
  const [idx, setIdx] = useState(0);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [errors, setErrors] = useState<{ name?: string; text?: string }>({});
  const [status, setStatus] = useState<WishStatus>("idle");
  const [thanks, setThanks] = useState("");
  const fetching = useRef(false);
  const alive = useRef(true);
  const onAdded = useRef(i.onAdded);
  onAdded.current = i.onAdded;
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const all: KitWish[] = [...local, ...(live ? remote : i.mode === "demo" ? i.samples : [])];
  const nw = all.length;
  const pos = nw ? ((idx % nw) + nw) % nw : 0;

  const load = useCallback(
    async (more: boolean, from: string | null) => {
      if (!live || !token || fetching.current) return;
      if (more && !from) return;
      fetching.current = true;
      if (!more) {
        setLoading(true);
        setFailed(false);
      }
      try {
        const page = await listWishes(token, more ? from : null, PAGE);
        if (!alive.current) return;
        const items = page.items.map(clip).filter((w) => w.message);
        setRemote((prev) => {
          const seen = new Set(prev.map((w) => w.id));
          return [...prev, ...items.filter((w) => !seen.has(w.id))].slice(0, MAX_IN_MEMORY);
        });
        setCursor(page.next_cursor);
        setTotal(page.total);
        setLoading(false);
      } catch {
        if (alive.current) {
          setLoading(false);
          setFailed(!more);
        }
      } finally {
        fetching.current = false;
      }
    },
    [live, token],
  );
  useEffect(() => {
    void load(false, null);
  }, [load]);

  const step = useCallback(
    (dir: 1 | -1) => {
      if (nw < 2) return;
      setIdx((x) => x + dir);
      // near the end of what is loaded: fetch the next page
      if (nw - (((idx + dir) % nw) + nw) % nw < 4) void load(true, cursor);
    },
    [nw, idx, cursor, load],
  );

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (status === "sending") return;
    const author = (i.nameLocked ? i.guestName : name).trim();
    const message = text.trim();
    const errs: typeof errors = {};
    if (!author) errs.name = "Please add your name.";
    if (!message) errs.text = "Please write a few words.";
    else if (message.length > MAX_TEXT) errs.text = "Please keep your wish under 300 characters.";
    if (Object.keys(errs).length) return setErrors(errs), setStatus("idle");
    setErrors({});
    const first = author.split(/\s+/)[0];
    const added = () => setTimeout(() => onAdded.current?.(), 0);
    if (!live || !token) {
      setLocal((l) => [{ id: "local-" + Date.now(), name: author, message }, ...l].slice(0, MAX_LOCAL));
      setIdx(0);
      setText("");
      setThanks(first);
      setStatus("local");
      added();
      return;
    }
    setStatus("sending");
    try {
      const created = clip(await submitWish(token, { name: i.nameLocked ? undefined : author, message }));
      if (!alive.current) return;
      setRemote((prev) => [created, ...prev.filter((w) => w.id !== created.id)]);
      setTotal((t) => t + 1);
      setIdx(0);
      setText("");
      setThanks(first);
      setStatus("sent");
      added();
    } catch {
      if (alive.current) setStatus("error");
    }
  };

  return {
    all, count: nw, pos, idx, total, loading, failed, empty: nw === 0 && !loading && !failed,
    name, text, errors, status, thanks, sending: status === "sending",
    step, reload: () => void load(false, null), submit,
    editName: (v: string) => (setName(v), setErrors((x) => ({ ...x, name: "" }))),
    editText: (v: string) => (setText(v), setErrors((x) => ({ ...x, text: "" })), setStatus((st) => (st === "sending" ? st : "idle"))),
  };
}
