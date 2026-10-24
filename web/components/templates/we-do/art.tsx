import type { IconKey } from "./derive";

/** Shared SVG definitions (glow filter, gold gradient, rings, bouquet). Rendered once at the top of the template. */
export function Defs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
      <defs>
        <filter id="wd-glow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <linearGradient id="wd-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3e3b8" /><stop offset=".35" stopColor="#c9a85f" /><stop offset=".6" stopColor="#f1dca6" /><stop offset="1" stopColor="#9c7c3d" />
        </linearGradient>
        <g id="wd-rings">
          <ellipse cx="38" cy="42" rx="28" ry="26" fill="none" stroke="url(#wd-gold)" strokeWidth="9" />
          <ellipse cx="38" cy="42" rx="28" ry="26" fill="none" stroke="#7d6230" strokeWidth=".8" opacity=".5" />
          <ellipse cx="72" cy="40" rx="27" ry="25" fill="none" stroke="url(#wd-gold)" strokeWidth="8" />
          <ellipse cx="72" cy="40" rx="27" ry="25" fill="none" stroke="#7d6230" strokeWidth=".8" opacity=".5" />
          <path d="M48 20 a28 26 0 0 1 14 3" fill="none" stroke="url(#wd-gold)" strokeWidth="9" />
          <ellipse cx="55" cy="74" rx="40" ry="5" fill="#000" opacity=".08" />
        </g>
        <g id="wd-flower">
          <circle cx="30" cy="30" r="16" fill="#e6dede" />
          <path d="M30 18c6 0 10 5 9 11-4-4-9-5-14-3 0-4 2-8 5-8z" fill="#cdbfc2" />
          <path d="M21 33c1-6 6-9 12-8-3 3-5 8-3 13-5 0-9-2-9-5z" fill="#d7caca" />
          <circle cx="30" cy="30" r="5" fill="#b9a9ae" />
          <circle cx="54" cy="18" r="9" fill="#ddd2d4" /><circle cx="54" cy="18" r="3" fill="#b7a5ab" />
          <circle cx="56" cy="44" r="6" fill="#4b2d4b" /><circle cx="60" cy="40" r="4" fill="#5e3a5e" />
          <path d="M8 46 C14 40 20 42 22 48 C16 50 12 50 8 46z" fill="#b8bb8a" />
          <path d="M44 6 C50 4 54 8 52 12 C48 12 45 10 44 6z" fill="#c2c493" />
          <path d="M66 26 C74 22 78 28 74 32 C70 32 67 30 66 26z" fill="#a9ad7c" />
          <circle cx="12" cy="20" r="2.5" fill="#cbb98d" /><circle cx="68" cy="56" r="2.5" fill="#cbb98d" />
        </g>
      </defs>
    </svg>
  );
}

export const Rings = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 110 85" aria-hidden="true" focusable="false"><use href="#wd-rings" /></svg>
);

const LINE = { fill: "none", stroke: "currentColor", strokeWidth: 2 } as const;
const ICONS: Record<IconKey, JSX.Element> = {
  rings: <><circle cx="20" cy="33" r="12" /><circle cx="20" cy="33" r="9" /><circle cx="31" cy="35" r="12" /><circle cx="31" cy="35" r="9" /><path d="M25 18l-4-3.6a2.6 2.6 0 0 1 3.7-3.7l.3.3.3-.3a2.6 2.6 0 0 1 3.7 3.7z" /></>,
  cocktail: <><path d="M10 12h32L26 30z" /><path d="M26 30v16M18 46h16M15 17h22" /><circle cx="16" cy="9" r="3" /><path d="M8 4l10 10" /></>,
  camera: <><rect x="4" y="14" width="44" height="30" rx="5" /><path d="M17 14l3-5h12l3 5" /><circle cx="26" cy="29" r="9" /><rect x="9" y="18" width="5" height="3" /></>,
  dinner: <><circle cx="26" cy="27" r="14" /><circle cx="26" cy="27" r="9" /><path d="M6 10v10a3 3 0 0 0 3 3v20M9 10v8M12 10v10a3 3 0 0 1-3 3M45 10c-4 3-4 10-3 14h3v19" /></>,
  speaker: <><rect x="14" y="6" width="24" height="40" rx="3" /><circle cx="26" cy="15" r="4" /><circle cx="26" cy="32" r="8" /><circle cx="26" cy="32" r="3" /><path d="M5 22l5 2M5 32h5M5 42l5-2M47 22l-5 2M47 32h-5M47 42l-5-2" /></>,
};
export const Icon = ({ name, className }: { name: IconKey; className?: string }) => (
  <svg className={className} viewBox="0 0 52 52" {...LINE} aria-hidden="true" focusable="false">{ICONS[name]}</svg>
);

export const NoteIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M9 3v12.3A3.5 3.5 0 1 0 11 18V8h7V3z" /></svg>
);
export const PlayIcon = ({ size = 34 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M7 4.5v15l13-7.5z" /></svg>
);
export const PauseIcon = ({ size = 30 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><rect x="5.5" y="4" width="4.5" height="16" rx="1" /><rect x="14" y="4" width="4.5" height="16" rx="1" /></svg>
);
