type Variant = "lockup" | "symbol";

type Props = {
  variant?: Variant;
  size?: number; // symbol height in px
  className?: string;
};

// Theme-aware logo: inline SVG (arch in --ink, dot in --dot) so it adapts to light/dark
// via tokens — no separate dark artwork needed. `lockup` adds the "mula" wordmark.
// Raster lockups (docs/logo/*.png) can be swapped in later where a bitmap is required.
const ARCH = "M8 25V14a12 12 0 0 1 24 0v11";

function Symbol({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 40 26" height={size} width={(size * 40) / 26} fill="none" role="img" aria-label="Mula">
      <path d={ARCH} stroke="var(--ink)" strokeWidth={2.4} strokeLinecap="round" />
      <circle cx={8} cy={22} r={3} fill="var(--dot)" />
    </svg>
  );
}

export function Logo({ variant = "lockup", size = 26, className }: Props) {
  if (variant === "symbol") {
    return (
      <span className={className} style={{ display: "inline-flex" }}>
        <Symbol size={size} />
      </span>
    );
  }
  return (
    <span className={className} style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <Symbol size={size} />
      <span style={{ fontFamily: "var(--serif)", fontWeight: 400, fontSize: size * 0.9, color: "var(--ink)", letterSpacing: "-0.01em" }}>
        mula
      </span>
    </span>
  );
}

export default Logo;
