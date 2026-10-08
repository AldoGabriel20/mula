"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui";
import { ThemeToggle } from "@/components/ui";
import { Magnetic } from "@/lib/motion";
import { NAV_LINKS } from "./nav-links";
import styles from "./MarketingHeader.module.css";

export function MarketingHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu on route change + lock scroll while open.
  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const isActive = (href: string) => pathname === href || !!pathname?.startsWith(href + "/");

  return (
    <>
      <a href="#main" className={styles.skip}>
        Skip to content
      </a>
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
        <div className={styles.inner}>
          <Link href="/" aria-label="Mula home">
            <Logo variant="lockup" size={24} />
          </Link>

          <nav aria-label="Primary" className={styles.nav}>
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`${styles.link} ${isActive(l.href) ? styles.active : ""}`}
                aria-current={isActive(l.href) ? "page" : undefined}
              >
                <span>{l.label}</span>
                <span className={styles.dot} aria-hidden="true" />
              </Link>
            ))}
          </nav>

          <div className={styles.actions}>
            <ThemeToggle />
            <Link href="/login" className={styles.loginLink}>
              Login
            </Link>
            <Magnetic>
              <Link href="/register" className={styles.cta}>
                Create Invitation<span aria-hidden="true">→</span>
              </Link>
            </Magnetic>
          </div>

          <div className={styles.mobileActions}>
            <Link href="/register" className={styles.ctaShort}>
              Create
            </Link>
            <button
              type="button"
              className={styles.burger}
              aria-label="Menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div role="dialog" aria-modal="true" aria-label="Menu" className={styles.menu}>
          <div className={styles.menuHead}>
            <Logo variant="lockup" size={24} />
            <button type="button" className={styles.menuClose} onClick={() => setMenuOpen(false)}>
              Close
            </button>
          </div>
          <nav aria-label="Mobile" className={styles.menuNav}>
            {NAV_LINKS.map((l, i) => (
              <Link key={l.href} href={l.href} className={styles.menuLink}>
                <span>{l.label}</span>
                <span className={styles.menuNum}>{String(i + 1).padStart(2, "0")}</span>
              </Link>
            ))}
          </nav>
          <div className={styles.menuFoot}>
            <Link href="/register" className={styles.menuCta}>
              Create Invitation
            </Link>
            <Link href="/login" className={styles.menuLogin}>
              Login
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

export default MarketingHeader;
