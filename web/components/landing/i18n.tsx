"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

// Port of MulaI18n (mula-core.js). Keyed strings (`t`) come from the dict; free English phrases
// (`tr`) are looked up in the phrase table, exactly as the prototype's text walker did. English is
// the source text, so the 58KB translation table is only fetched once a visitor picks id/my.
export type Lang = "en" | "id" | "my";
export const LANGS: { code: Lang; short: string; name: string }[] = [
  { code: "id", short: "ID", name: "Bahasa Indonesia" },
  { code: "my", short: "MY", name: "Bahasa Melayu" },
  { code: "en", short: "EN", name: "English" },
];
const HTML_LANG: Record<Lang, string> = { en: "en", id: "id", my: "ms" };

type Table = { dict: Record<Lang, Record<string, string>>; phrases: Record<"id" | "my", Record<string, string>> };

const norm = (s: string) => s.replace(/\s+/g, " ").trim();
function lookup(p: Record<string, string>, key: string): string | null {
  if (p[key]) return p[key];
  const arrow = key.match(/^(.*?)\s*(→)$/);
  if (arrow && p[arrow[1]]) return `${p[arrow[1]]} →`;
  if (key.includes(" · ")) {
    const parts = key.split(" · ");
    if (parts.some((x) => p[x])) return parts.map((x) => p[x] || x).join(" · ");
  }
  return null;
}

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (key: string, fallback: string) => string; tr: (text: string) => string };
const LangContext = createContext<Ctx>({ lang: "en", setLang: () => {}, t: (_k, f) => f, tr: (s) => s });
export const useLang = () => useContext(LangContext);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [table, setTable] = useState<Table | null>(null);

  const load = useCallback((l: Lang) => {
    if (l !== "en") import("./i18n.json").then((m) => setTable(m.default as Table));
  }, []);

  useEffect(() => {
    try {
      const s = localStorage.getItem("mula-lang") as Lang | null;
      if (s === "id" || s === "my") {
        setLangState(s);
        load(s);
      }
    } catch {}
  }, [load]);

  const setLang = useCallback(
    (l: Lang) => {
      setLangState(l);
      load(l);
      try {
        localStorage.setItem("mula-lang", l);
      } catch {}
      document.documentElement.lang = HTML_LANG[l];
    },
    [load],
  );

  const value = useMemo<Ctx>(() => {
    const ready = lang !== "en" && table;
    return {
      lang,
      setLang,
      t: (key, fallback) => (ready && (table!.dict[lang][key] ?? table!.dict.en[key])) || fallback,
      tr: (text) => {
        if (!ready) return text;
        const key = norm(text);
        const hit = key && lookup(table!.phrases[lang as "id" | "my"], key);
        return hit ? (text.match(/^\s*/)![0] + hit + text.match(/\s*$/)![0]) : text;
      },
    };
  }, [lang, table, setLang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

// Keyed string whose value may contain markup (`<em>…</em>`), same as data-i18n innerHTML.
export function TH({ k, children, as: Tag = "span" }: { k: string; children: string; as?: React.ElementType }) {
  const { t } = useLang();
  return <Tag dangerouslySetInnerHTML={{ __html: t(k, children) }} />;
}
