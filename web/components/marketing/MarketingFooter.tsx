import Link from "next/link";
import { Logo } from "@/components/ui";
import { NAV_LINKS } from "./nav-links";
import styles from "./MarketingFooter.module.css";

const COMPANY = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQ" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
];
// Social / support are external/placeholder at launch (prototype uses "#").
const SOCIAL = ["Instagram", "TikTok", "YouTube", "Pinterest"];
const SUPPORT = ["Help Center", "WhatsApp", "Email"];

export function MarketingFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.inner}>
        <div className={styles.eyebrow}>
          <span />
          THE LAST PAGE
        </div>
        <h2 className={styles.statement}>
          Every beginning deserves <em>a beautiful story.</em>
        </h2>

        <div className={styles.ctas}>
          <Link href="/register" className={styles.ctaPrimary}>
            Start your next beginning<span aria-hidden="true">→</span>
          </Link>
          <Link href="/templates" className={styles.ctaGhost}>
            Explore designs
          </Link>
        </div>

        <div className={styles.cols}>
          <div className={styles.brandCol}>
            <Link href="/" aria-label="Mula home">
              <Logo variant="lockup" size={28} />
            </Link>
            <p className={styles.tagline}>Digital invitations for the moments where something begins.</p>
          </div>
          <div className={styles.linkCols}>
            <div className={styles.col}>
              <span className={styles.colHead}>Product</span>
              {NAV_LINKS.map((l) => (
                <Link key={l.href} href={l.href}>
                  {l.label}
                </Link>
              ))}
            </div>
            <div className={styles.col}>
              <span className={styles.colHead}>Company</span>
              {COMPANY.map((l) => (
                <Link key={l.href} href={l.href}>
                  {l.label}
                </Link>
              ))}
            </div>
            <div className={styles.col}>
              <span className={styles.colHead}>Social</span>
              {SOCIAL.map((s) => (
                <a key={s} href="#" aria-disabled="true">
                  {s}
                </a>
              ))}
            </div>
            <div className={styles.col}>
              <span className={styles.colHead}>Support</span>
              {SUPPORT.map((s) => (
                <a key={s} href="#" aria-disabled="true">
                  {s}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <span>© 2026 Mula. All rights reserved.</span>
          <span>Secure payments · QRIS · Bank transfer · E-wallet · Cards</span>
          <span className={styles.bottomItalic}>Everything begins somewhere.</span>
        </div>
      </div>
    </footer>
  );
}

export default MarketingFooter;
