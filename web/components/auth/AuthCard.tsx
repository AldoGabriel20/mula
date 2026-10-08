"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { authSans, authSerif } from "@/lib/fonts/prototype";
import styles from "./AuthCard.module.css";

// Showcase line per screen (prototype authT[3]).
const LINES: Record<string, string> = {
  "/login": "Sebuah mula untuk cerita berikutnya.",
  "/register": "Something meaningful begins here.",
  "/forgot": "Dari sini, cerita baru bermula.",
  "/reset": "A beginning for what comes next.",
  "/verify": "Satu perayaan, sebuah permulaan.",
};

// Bottom-of-column prompt (prototype's third grid row); screens not listed keep their own inline footer.
const FOOTERS: Record<string, [string, string, string]> = {
  "/login": ["New to Mula?", "/register", "Create an account"],
  "/register": ["Already have an account?", "/login", "Sign in"],
};

// Prototype language switch. Stored under the landing page's key ("my" there, "ms" here).
const LANGS = [["en", "EN"], ["id", "ID"], ["ms", "MS"]] as const;
const KEY = "mula-lang";

// Two-column auth frame (prototype .auth): dark showcase + form column. Logos are the supplied PNGs
// (docs/dashboard-admin-prototype/assets): ink lockup on light, light lockup on dark.
export function AuthCard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const [lang, setLang] = useState("en");
  useEffect(() => {
    try {
      const s = localStorage.getItem(KEY);
      if (s === "id" || s === "my" || s === "ms") setLang(s === "my" ? "ms" : s);
    } catch {}
  }, []);
  const pick = (l: string) => {
    setLang(l);
    try { localStorage.setItem(KEY, l === "ms" ? "my" : l); } catch {}
    document.documentElement.lang = l;
  };

  return (
    <div className={`${styles.card} ${authSerif.variable} ${authSans.variable}`}>
      <div className={styles.showcase} aria-hidden="true">
        <div className={styles.archWrap}>
          <div className={styles.arch} />
          <div className={styles.dot} />
        </div>
        <div className={styles.showcaseInner}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/admin/mula-symbol-light.png" alt="" style={{ height: 30, justifySelf: "center" }} />
          <div className={styles.quote}>{LINES[pathname] ?? LINES["/login"]}</div>
        </div>
      </div>
      <div className={styles.formCol}>
        <div className={styles.formHead}>
          <Link href="/" aria-label="Mula home" className={styles.logoLink}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.logoLight} src="/brand/admin/mula-lockup-ink.png" alt="mula" height={26} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.logoDark} src="/brand/admin/mula-lockup-light.png" alt="" aria-hidden="true" height={26} />
          </Link>
          <div className={styles.headTools}>
            <div className={styles.seg} role="group" aria-label="Language">
              {LANGS.map(([id, n]) => (
                <button key={id} type="button" className={lang === id ? styles.on : undefined} aria-pressed={lang === id} onClick={() => pick(id)}>{n}</button>
              ))}
            </div>
            <Link href="/" className={styles.close} aria-label="Close and return home">Close</Link>
          </div>
        </div>
        <div className={styles.formBody}>{children}</div>
        {FOOTERS[pathname] ? (
          <div className={styles.footer}>
            {FOOTERS[pathname][0]} <Link href={FOOTERS[pathname][1]} className={styles.close}>{FOOTERS[pathname][2]}</Link>
          </div>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}

export default AuthCard;
