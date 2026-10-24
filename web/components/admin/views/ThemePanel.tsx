"use client";
// Theme panel of the Design page (docs/17 §11.3). It renders only the controls the picked template's manifest lists
// in `customizable`, checks the colour contrast as the host picks (the API enforces the same 4.5:1 rule), and
// writes `invitations.theme` through the invitation PATCH.
import { useMemo, useState } from "react";
import { FONT_PAIRINGS } from "@/lib/kit/generated/fonts";
import { PALETTES } from "@/lib/kit/generated/palettes";
import type { Manifest, MotionLevel } from "@/lib/kit/manifest";
import { TEXT_PAIRS, contrast, paletteByIdOrAlias, resolveTheme, type Theme } from "@/lib/kit/tokens";

export type ThemeApi = {
  manifest: Manifest;
  /** The stored theme (`{}` when nothing is changed). */
  theme: Theme;
  /** PATCH the whole theme; `{}` resets it. Rejects with the API's message. */
  save(theme: Theme): Promise<void>;
};

const MOTION_LABEL: Record<MotionLevel, string> = { full: "Full", calm: "Calm", off: "Still" };
const ROLE_LABEL: Record<string, string> = { accent: "Accent colour", eyebrow: "Small-heading colour" };
const HEX = /^#[0-9a-fA-F]{6}$/;

/** What `draft` would look like, and whether its text pairs stay readable. */
export function checkDraft(manifest: Manifest, draft: Theme): { ok: boolean; message: string } {
  const t = resolveTheme(manifest, draft);
  for (const [fg, bg] of TEXT_PAIRS) {
    const r = contrast(t.colors[fg], t.colors[bg]);
    if (r < 4.5) return { ok: false, message: `Text on this combination is too faint (${fg} on ${bg} is ${r.toFixed(1)}:1; it needs 4.5:1). Choose a different colour.` };
  }
  return { ok: true, message: "" };
}

/** Drop empty keys so an unchanged draft equals the stored theme. */
const clean = (t: Theme): Theme => {
  const out: Theme = {};
  if (t.palette) out.palette = t.palette;
  if (t.fontPairing) out.fontPairing = t.fontPairing;
  if (t.motion) out.motion = t.motion;
  if (t.tokens && Object.keys(t.tokens).length) out.tokens = t.tokens;
  return out;
};

export function ThemePanel({ api }: { api: ThemeApi }) {
  const can = api.manifest.customizable;
  const stored = useMemo(() => {
    const p = paletteByIdOrAlias(api.theme.palette);
    return clean({ ...api.theme, palette: p?.id });
  }, [api.theme]);
  const [draft, setDraft] = useState<Theme>(stored);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const palettes = can.palette.map((id) => PALETTES.find((p) => p.id === id)).filter((p): p is (typeof PALETTES)[number] => !!p);
  const pairings = can.fontPairings.map((id) => FONT_PAIRINGS.find((p) => p.id === id)).filter((p): p is (typeof FONT_PAIRINGS)[number] => !!p);
  const roles = can.tokens;
  const motions = can.motion as MotionLevel[];
  // nothing to choose = no panel (a single font pairing is no choice)
  if (!palettes.length && pairings.length < 2 && !roles.length && !motions.length) return null;

  const check = checkDraft(api.manifest, draft);
  const dirty = JSON.stringify(clean(draft)) !== JSON.stringify(stored);
  const colors = resolveTheme(api.manifest, draft).colors;
  const set = (patch: Partial<Theme>) => setDraft((d) => clean({ ...d, ...patch }));
  const setToken = (role: string, v: string) => setDraft((d) => clean({ ...d, tokens: { ...(d.tokens ?? {}), [role]: v } }));
  const act = async (theme: Theme) => {
    setBusy(true);
    setError("");
    try {
      await api.save(theme);
    } catch (e) {
      setError(e instanceof Error ? e.message : "We could not save your theme.");
    } finally {
      setBusy(false);
    }
  };

  const light = "#EEE9DF";
  return (
    <section aria-label="Theme" data-theme-panel="" style={{ display: "grid", gap: 18, paddingTop: 22, borderTop: "1px solid rgba(238,233,223,.18)" }}>
      <div className="xs" style={{ color: "#A39B8E", letterSpacing: ".14em", textTransform: "uppercase" }}>Make it yours</div>

      {palettes.length > 0 && (
        <div role="group" aria-label="Colour palette">
          <div className="xs" style={{ color: "#A39B8E", marginBottom: 10 }}>Colour palette</div>
          <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
            {palettes.map((p) => {
              const on = draft.palette === p.id;
              return (
                <button key={p.id} type="button" data-palette={p.id} aria-label={p.name} aria-pressed={on} onClick={() => set({ palette: on ? undefined : p.id })}
                  style={{ width: 44, height: 44, borderRadius: "50%", border: 0, padding: 0, cursor: "pointer", background: `linear-gradient(135deg,${p.swatch[0]} 50%,${p.swatch[2]} 50%)`, outline: on ? `2px solid ${light}` : "none", outlineOffset: 3 }} />
              );
            })}
          </div>
        </div>
      )}

      {pairings.length > 1 && (
        <label className="f" style={{ color: light }}>
          Fonts
          <select className="inp" data-theme-pairing="" value={draft.fontPairing ?? ""} onChange={(e) => set({ fontPairing: e.target.value || undefined })}>
            <option value="">Design default</option>
            {pairings.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
      )}

      {roles.map((role) => {
        const v = draft.tokens?.[role] ?? colors[role];
        return (
          <div key={role} className="row" style={{ gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
            <label className="f" style={{ color: light }}>
              {ROLE_LABEL[role] ?? role}
              <input type="color" data-theme-token={role} value={HEX.test(v) ? v : "#000000"} onChange={(e) => setToken(role, e.target.value.toUpperCase())} style={{ width: 56, height: 44, padding: 2 }} aria-label={ROLE_LABEL[role] ?? role} />
            </label>
            <span className="xs" style={{ color: "#A39B8E" }}>{HEX.test(v) ? v.toUpperCase() : ""}</span>
          </div>
        );
      })}

      {motions.length > 0 && (
        <div role="group" aria-label="Motion">
          <div className="xs" style={{ color: "#A39B8E", marginBottom: 10 }}>Motion</div>
          <div className="seg dk">
            {motions.map((m) => {
              const on = (draft.motion ?? api.manifest.tokens.motion.level) === m;
              return <button key={m} type="button" className={on ? "on" : ""} data-theme-motion={m} aria-pressed={on} onClick={() => set({ motion: m === api.manifest.tokens.motion.level ? undefined : m })}>{MOTION_LABEL[m]}</button>;
            })}
          </div>
        </div>
      )}

      {!check.ok && <p role="alert" data-theme-warning="" style={{ margin: 0, color: "#F0B6A8", fontSize: 14, lineHeight: 1.5 }}>{check.message}</p>}
      {error && <p role="alert" style={{ margin: 0, color: "#F0B6A8", fontSize: 14 }}>{error}</p>}

      <div className="row">
        <button type="button" className="btn" data-theme-save="" disabled={!dirty || !check.ok || busy} onClick={() => void act(clean(draft))} style={{ background: light, color: "#12110F", borderColor: light, opacity: !dirty || !check.ok || busy ? 0.5 : 1 }}>
          {busy ? "Saving…" : "Save theme"}
        </button>
        <button type="button" className="btn" data-theme-reset="" disabled={busy || !Object.keys(stored).length} onClick={() => { setDraft({}); void act({}); }} style={{ color: light, borderColor: "rgba(238,233,223,.25)" }}>
          Back to the design&rsquo;s own look
        </button>
      </div>
    </section>
  );
}
