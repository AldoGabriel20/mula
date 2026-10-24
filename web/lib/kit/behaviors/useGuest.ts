"use client";

import { useEffect, useState } from "react";
import { guestFromSearch } from "../model/format";

/**
 * The guest of this page. A personal link carries the name; on a generic link `?to=` / `?guest=` names them
 * (read after mount: the server has no query string), capped at 60 characters. `name` is "" when unknown.
 */
export function useGuest(personalName?: string | null) {
  const [search, setSearch] = useState("");
  useEffect(() => setSearch(window.location.search), []);
  const personal = !!personalName;
  return { search, personal, name: personalName ?? guestFromSearch(search) };
}
