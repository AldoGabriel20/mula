"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { InviteError, submitRsvp } from "@/lib/api/invite";
import type { KitMode } from "../useTheme";

export type RsvpStatus = "idle" | "sending" | "sent" | "demo" | "error";
export type RsvpErrors = { name?: string; attend?: string; message?: string };

export type RsvpInput = {
  mode: KitMode;
  /** The link token: only `live` with a token ever sends anything. */
  token?: string;
  /** The guest's reply so far ("pending" = none). */
  status: "pending" | "yes" | "no";
  partySize: number;
  /** 1 + the plus-ones the host allowed; 1 hides the stepper. */
  maxParty: number;
  /** Name to show (a personal link's guest, or `?to=`); it arrives after mount, so it is re-applied until the guest types. */
  prefillName: string;
};

const MAX_NOTE = 300;

/**
 * The RSVP behaviour of every template (docs/17 §7.7): form state, validation, optimistic "sent" state and the
 * network call. `live` with a token posts to the API; `preview` and `demo` run the whole flow and send nothing.
 * The template owns markup and motion only.
 */
export function useRsvp(i: RsvpInput) {
  const replied = i.status !== "pending";
  const [name, setNameRaw] = useState(i.prefillName);
  const touched = useRef(false);
  useEffect(() => {
    if (!touched.current) setNameRaw(i.prefillName);
  }, [i.prefillName]);
  const [attend, setAttend] = useState<"" | "yes" | "no">(i.status === "pending" ? "" : i.status);
  const [guests, setGuests] = useState(Math.min(i.maxParty, Math.max(1, i.partySize)));
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<RsvpErrors>({});
  const [status, setStatus] = useState<RsvpStatus>(replied ? "sent" : "idle");
  const [failure, setFailure] = useState("");

  const done = status === "sent" || status === "demo";
  const sending = status === "sending";
  const yes = attend === "yes";
  const maxGuests = Math.max(1, i.maxParty);
  const firstName = name.trim().split(/\s+/)[0] || "";

  const clear = (k: keyof RsvpErrors) => setErrors((x) => ({ ...x, [k]: "" }));

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (sending) return;
    const errs: RsvpErrors = {};
    if (!name.trim()) errs.name = "Please enter your name.";
    if (!attend) errs.attend = "Please let us know whether you can attend.";
    if (message.length > MAX_NOTE) errs.message = "Please keep your note under 300 characters.";
    if (Object.keys(errs).length) return setErrors(errs);
    setErrors({});
    if (i.mode !== "live" || !i.token) return setStatus("demo");
    setStatus("sending");
    try {
      await submitRsvp(i.token, { status: attend as "yes" | "no", party_size: yes ? guests : 0, note: message.trim() || undefined });
      setStatus("sent");
    } catch (err) {
      setFailure(err instanceof InviteError && err.code === "rsvp_closed" ? "Replies for this celebration are now closed." : err instanceof InviteError && err.status === 404 ? "This invitation is no longer available." : "We could not send your reply. Your answers are saved here, so please try again in a moment.");
      setStatus("error");
    }
  };

  return {
    name, attend, guests, message, errors, status, failure, done, sending, yes, maxGuests, firstName,
    /** A guest typing in the name field (stops the prefill from overwriting it). */
    editName: (v: string) => ((touched.current = true), setNameRaw(v), clear("name")),
    chooseAttend: (v: "yes" | "no") => (setAttend(v), clear("attend")),
    editMessage: (v: string) => (setMessage(v), clear("message")),
    stepGuests: (delta: 1 | -1) => setGuests((g) => Math.min(maxGuests, Math.max(1, g + delta))),
    submit,
    /** "Change my reply": back to the form with the previous answers. */
    edit: () => setStatus("idle"),
  };
}
