"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Magnetic } from "@/lib/motion";
import { LANGS, useLang } from "./i18n";
import { SANS, SERIF } from "./fonts";
import { useScrollTick } from "./hooks";

const LINKS: [string, string, string][] = [
  ["templates", "/templates", "nav.templates"],
  ["features", "/features", "nav.features"],
  ["pricing", "/pricing", "nav.pricing"],
  ["inspiration", "/inspiration", "nav.inspiration"],
  ["tips", "/tips", "nav.tips"],
];
const FALLBACK: Record<string, string> = { "nav.templates": "Templates", "nav.features": "Features", "nav.pricing": "Pricing", "nav.inspiration": "Inspiration", "nav.tips": "Tips", "nav.login": "Login", "nav.create": "Create Invitation", "nav.menu": "Menu", "nav.close": "Close" };

// Port of MulaNav.dc.html — fixed header that frosts on scroll and flips to ink-on-ivory while it
// sits over a [data-nav="light"] section. Uses the supplied PNG lockups (no recreated logo).
export function LandingNav({ active = "", startLight = false }: { active?: string; startLight?: boolean }) {
  const { lang, setLang, t } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [light, setLight] = useState(startLight);
  const [mobile, setMobile] = useState(false);
  const [menu, setMenu] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const startLightRef = useRef(startLight); // fixed per page; a ref keeps `check` stable for the effect below
  const T = (k: string) => t(k, FALLBACK[k]);

  const check = () => {
    setScrolled(scrollY > 24);
    let l = startLightRef.current && scrollY < 10;
    document.querySelectorAll('[data-nav="light"]').forEach((s) => {
      const r = s.getBoundingClientRect();
      if (r.top <= 38 && r.bottom >= 38) l = true;
    });
    setLight(l);
  };
  useScrollTick(check);

  useEffect(() => {
    const onResize = () => {
      const m = innerWidth < 1060;
      setMobile((p) => {
        if (p !== m) { setMenu(false); setLangOpen(false); }
        return m;
      });
    };
    const onDoc = (e: MouseEvent) => {
      const el = e.target as Element;
      if (!el.closest('[aria-haspopup="listbox"]') && !el.closest('[role="listbox"]')) setLangOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setLangOpen(false); setMenu(false); } };
    onResize();
    addEventListener("resize", onResize);
    document.addEventListener("click", onDoc);
    document.addEventListener("keydown", onKey);
    const id = setInterval(check, 600);
    return () => {
      removeEventListener("resize", onResize);
      document.removeEventListener("click", onDoc);
      document.removeEventListener("keydown", onKey);
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!menu) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [menu]);

  const L = light, sc = scrolled || menu;
  const fg = L ? "#0E0C0B" : "#F4EEE4";
  const border2 = L ? "rgba(14,12,11,.2)" : "rgba(244,238,228,.24)";
  const btnBg = fg, btnFg = L ? "#F4EEE4" : "#0E0C0B";
  const cur = LANGS.find((g) => g.code === lang) || LANGS[2];
  const createShort = lang === "en" ? "Create" : lang === "id" ? "Buat" : "Cipta";

  return (
    <>
      <a href="#main" style={{ position: "fixed", left: 16, top: -60, zIndex: 200, background: "#F4EEE4", color: "#0E0C0B", padding: "10px 16px", borderRadius: 4, fontFamily: SANS, fontSize: 14 }} onFocus={(e) => (e.currentTarget.style.top = "12px")} onBlur={(e) => (e.currentTarget.style.top = "-60px")}>
        Skip to content
      </a>
      <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 80, fontFamily: SANS, transition: "background-color .5s, border-color .5s, color .5s", background: sc ? (L ? "rgba(244,238,228,.82)" : "rgba(14,12,11,.62)") : "rgba(14,12,11,0)", borderBottom: `1px solid ${sc ? (L ? "rgba(14,12,11,.09)" : "rgba(244,238,228,.08)") : "rgba(14,12,11,0)"}`, backdropFilter: sc ? "blur(20px) saturate(1.3)" : "none", WebkitBackdropFilter: sc ? "blur(20px) saturate(1.3)" : "none", color: fg }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 clamp(20px,3.6vw,52px)", height: 76, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
          <Link href="/" aria-label="Mula home" style={{ position: "relative", display: "block", flex: "none", width: 96, height: 26 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/mula-lockup-light.png" alt="Mula" style={{ position: "absolute", left: 0, top: 0, width: 96, height: "auto", opacity: L ? 0 : 1, transition: "opacity .5s" }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/mula-lockup-dark.png" alt="" aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, width: 96, height: "auto", opacity: L ? 1 : 0, transition: "opacity .5s" }} />
          </Link>
          {!mobile && (
            <>
              <nav aria-label="Primary" style={{ display: "flex", gap: "clamp(20px,2.4vw,36px)", fontSize: 13.5, letterSpacing: ".01em" }}>
                {LINKS.map(([k, href, key]) => (
                  <Link key={k} href={href} aria-current={k === active ? "page" : undefined} style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, color: "inherit", opacity: k === active ? 1 : 0.72, transition: "opacity .3s" }} onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")} onMouseLeave={(e) => (e.currentTarget.style.opacity = k === active ? "1" : ".72")}>
                    <span>{T(key)}</span>
                    <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#C9A56E", opacity: k === active ? 1 : 0 }} />
                  </Link>
                ))}
              </nav>
              <div style={{ display: "flex", alignItems: "center", gap: 22, fontSize: 13.5 }}>
                <div style={{ position: "relative" }}>
                  <button onClick={() => setLangOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={langOpen} aria-label="Language" style={{ display: "flex", alignItems: "center", gap: 8, height: 34, padding: "0 12px", borderRadius: 999, border: `1px solid ${border2}`, background: "transparent", color: "inherit", fontSize: 12, fontWeight: 600, letterSpacing: ".14em", cursor: "pointer" }}>
                    {cur.short}
                    <span style={{ fontSize: 9, opacity: 0.7 }}>▾</span>
                  </button>
                  {langOpen && (
                    <div role="listbox" style={{ position: "absolute", right: 0, top: 44, minWidth: 210, background: "#15120F", color: "#F4EEE4", border: "1px solid rgba(244,238,228,.1)", borderRadius: 8, padding: 6, boxShadow: "0 30px 60px -20px rgba(0,0,0,.6)", display: "flex", flexDirection: "column" }}>
                      {LANGS.map((g) => (
                        <button key={g.code} role="option" aria-selected={g.code === lang} onClick={() => { setLang(g.code); setLangOpen(false); }} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "11px 12px", border: "none", borderRadius: 5, background: g.code === lang ? "rgba(201,165,110,.12)" : "transparent", color: "inherit", fontSize: 13, cursor: "pointer", textAlign: "left" }} onMouseEnter={(e) => { if (g.code !== lang) e.currentTarget.style.background = "rgba(244,238,228,.06)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = g.code === lang ? "rgba(201,165,110,.12)" : "transparent"; }}>
                          <span>{g.name}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".14em", color: "#C9A56E" }}>{g.short}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Link href="/login" style={{ color: "inherit", opacity: 0.8 }} onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")} onMouseLeave={(e) => (e.currentTarget.style.opacity = ".8")}>{T("nav.login")}</Link>
                <Magnetic>
                  <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 10, height: 42, padding: "0 20px", borderRadius: 999, background: btnBg, color: btnFg, fontWeight: 600, fontSize: 13, transition: "background .5s, color .5s" }}>
                    {T("nav.create")}
                    <span data-arrow="1">→</span>
                  </Link>
                </Magnetic>
              </div>
            </>
          )}
          {mobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
              <Link href="/register" style={{ display: "inline-flex", alignItems: "center", height: 44, padding: "0 18px", borderRadius: 999, background: btnBg, color: btnFg, fontWeight: 600 }}>{createShort}</Link>
              <button onClick={() => setMenu((m) => !m)} aria-label={T("nav.menu")} aria-expanded={menu} style={{ height: 44, width: 44, borderRadius: "50%", border: `1px solid ${border2}`, background: "transparent", color: "inherit", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, cursor: "pointer" }}>
                <span style={{ width: 16, height: 1, background: "currentColor" }} />
                <span style={{ width: 16, height: 1, background: "currentColor" }} />
              </button>
            </div>
          )}
        </div>
      </header>
      {menu && (
        <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 110, background: "#0E0C0B", color: "#F4EEE4", padding: "0 24px 32px", display: "flex", flexDirection: "column", fontFamily: SANS, overflowY: "auto" }}>
          <div style={{ height: 76, flex: "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/mula-lockup-light.png" alt="Mula" style={{ display: "block", width: 96, height: "auto" }} />
            <button onClick={() => setMenu(false)} style={{ height: 44, padding: "0 18px", borderRadius: 999, border: "1px solid rgba(244,238,228,.25)", background: "transparent", color: "inherit", fontSize: 13, cursor: "pointer" }}>{T("nav.close")}</button>
          </div>
          <nav aria-label="Mobile" style={{ display: "flex", flexDirection: "column", marginTop: 28 }}>
            {LINKS.map(([k, href, key], i) => (
              <Link key={k} href={href} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "14px 0", borderBottom: "1px solid rgba(244,238,228,.1)", fontFamily: SERIF, fontWeight: 300, fontSize: 40, letterSpacing: "-.01em", color: "#F4EEE4" }}>
                <span>{T(key)}</span>
                <span style={{ fontFamily: SANS, fontSize: 12, color: "#C9A56E" }}>{String(i + 1).padStart(2, "0")}</span>
              </Link>
            ))}
          </nav>
          <div style={{ display: "flex", gap: 8, marginTop: 28 }}>
            {LANGS.map((g) => (
              <button key={g.code} onClick={() => setLang(g.code)} aria-pressed={g.code === lang} style={{ flex: 1, height: 44, borderRadius: 999, border: `1px solid ${g.code === lang ? "#C9A56E" : "rgba(244,238,228,.2)"}`, background: "transparent", color: "inherit", fontSize: 12, fontWeight: 600, letterSpacing: ".14em", cursor: "pointer" }}>{g.short}</button>
            ))}
          </div>
          <div style={{ marginTop: "auto", paddingTop: 32, display: "flex", flexDirection: "column", gap: 10 }}>
            <Link href="/register" style={{ height: 56, borderRadius: 999, background: "#F4EEE4", color: "#0E0C0B", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>{T("nav.create")}</Link>
            <Link href="/login" style={{ height: 56, borderRadius: 999, border: "1px solid rgba(244,238,228,.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "#F4EEE4" }}>{T("nav.login")}</Link>
          </div>
        </div>
      )}
    </>
  );
}
