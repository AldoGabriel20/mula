"use client";
// Generic section form (docs/17 §11.2): the fields of a section type come from its content schema
// (catalog/sections.schema.json, generated to lib/kit/generated/sections.ts) and the template's manifest limits,
// not from a per-template component. It reuses the editor's own classes (f, inp, btn, row, arch).
import { useState, type CSSProperties } from "react";
import { SECTION_SCHEMAS, type FieldSchema } from "@/lib/kit/generated/sections";
import { TRACKS } from "@/lib/kit/music";

/** What patch.ts exposes as `V.sf` for an invitation whose template has a manifest. */
export type SectionFormApi = {
  /** The section's current content ({} when the invitation has no such section). */
  content(type: string): Record<string, any>;
  mediaUrl(id?: string | null): string | undefined;
  /** `capabilities.gallery.max` of the picked template. */
  maxGallery: number;
  /** Set a single-photo field (hero.photo_id, closing.photo_id); a null file clears it. */
  setPhoto(type: string, field: string, file: File | null, kind?: "photo" | "cover"): Promise<void>;
  /** Set slot `index` of a photo-id list (story.photo_ids); a null file clears the slot. */
  setPhotoAt(type: string, field: string, index: number, slots: number, file: File | null): Promise<void>;
  addGallery(files: File[]): Promise<void>;
  removeGallery(id: string): Promise<void>;
};

const HIDDEN_INPUT: CSSProperties = { position: "absolute", width: 1, height: 1, opacity: 0, overflow: "hidden" };
const ordered = (schema: FieldSchema) =>
  Object.entries(schema.properties ?? {}).sort(([ka, a], [kb, b]) => (a["x-order"] ?? 99) - (b["x-order"] ?? 99) || ka.localeCompare(kb));

/** Section types whose content the generic form knows. */
export const hasSchema = (type: string) => !!SECTION_SCHEMAS[type];
/** True when the schema has a title or body (the editor's own Heading / body inputs edit those). */
export const hasText = (type: string) => !!SECTION_SCHEMAS[type]?.properties && ("title" in SECTION_SCHEMAS[type].properties! || "body" in SECTION_SCHEMAS[type].properties!);

/** A photo tile: click to choose a file (uploaded at once), with a remove button when one is set. */
function PhotoTile({ url, label, arch, height = 200, onFile, onClear }: { url?: string; label: string; arch?: boolean; height?: number; onFile: (f: File) => Promise<void>; onClear?: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const wrap = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="row" style={{ gap: 12, alignItems: "flex-end" }}>
      <label className={arch ? "arch" : undefined} style={{ position: "relative", height, width: arch ? undefined : Math.round(height * 0.8), maxWidth: 220, flex: "none", borderRadius: arch ? undefined : 12, background: url ? `center / cover no-repeat url("${url}")` : "linear-gradient(165deg,var(--line),var(--line2))", display: "grid", placeItems: "end center", padding: 16, color: url ? "#fff" : "var(--mut)", fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", textAlign: "center", cursor: busy ? "progress" : "pointer", opacity: busy ? 0.6 : 1, textShadow: url ? "0 1px 8px rgba(0,0,0,.5)" : undefined }}>
        {busy ? "Uploading…" : url ? "Replace photo" : label}
        <input type="file" accept="image/*" disabled={busy} style={HIDDEN_INPUT} onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void wrap(() => onFile(f));
        }} />
      </label>
      {url && onClear && (
        <button type="button" className="btn btn-t btn-s" disabled={busy} onClick={() => void wrap(onClear)}>
          Remove
        </button>
      )}
    </div>
  );
}

function TextField({ name, schema, value }: { name: string; schema: FieldSchema; value: unknown }) {
  const label = schema["x-label"] ?? name;
  const common = { className: "inp", "data-sf-text": name, maxLength: schema.maxLength, placeholder: schema["x-placeholder"], defaultValue: typeof value === "string" ? value : "" } as const;
  return (
    <label className="f">
      {label}
      {schema["x-widget"] === "textarea" ? <textarea {...common} /> : <input {...common} />}
      {schema["x-hint"] && <span className="xs mut">{schema["x-hint"]}</span>}
    </label>
  );
}

function Chapters({ schema, initial }: { schema: FieldSchema; initial: { title: string; text: string }[] }) {
  const max = schema.maxItems ?? 5;
  const [rows, setRows] = useState(initial);
  const item = schema.items?.properties ?? {};
  return (
    <div data-sf-chapters={max} style={{ display: "grid", gap: 12 }}>
      <div className="row sb">
        <div className="eb">{schema["x-label"] ?? "Chapters"}</div>
        <button type="button" className="btn btn-s" disabled={rows.length >= max} onClick={() => setRows((r) => [...r, { title: "", text: "" }])}>
          Add a chapter
        </button>
      </div>
      {rows.length === 0 && <p className="sm mut" style={{ margin: 0 }}>{`Chapters tell your story in short steps (up to ${max}).`}</p>}
      {rows.map((r, i) => (
        <div key={i} data-ch-row="" className="row" style={{ gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
          <label className="f" style={{ flex: "1 1 160px" }}>
            {item.title?.["x-label"] ?? "Title"}
            <input className="inp" data-ch="title" maxLength={item.title?.maxLength} defaultValue={r.title} />
          </label>
          <label className="f" style={{ flex: "2 1 240px" }}>
            {item.text?.["x-label"] ?? "Text"}
            <input className="inp" data-ch="text" maxLength={item.text?.maxLength} defaultValue={r.text} />
          </label>
          <button type="button" className="btn btn-t btn-s" aria-label={`Remove chapter ${i + 1}`} onClick={() => setRows((x) => x.filter((_, k) => k !== i))}>
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}

function Gallery({ api, schema, photos }: { api: SectionFormApi; schema: FieldSchema; photos: { id: string; alt: string }[] }) {
  const [busy, setBusy] = useState(false);
  const max = api.maxGallery;
  const full = photos.length >= max;
  const altMax = schema.items?.properties?.alt?.maxLength;
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div className="row sb">
        <div className="eb">{`Photos · ${photos.length} / ${max}`}</div>
        <label className="btn btn-p btn-s" style={{ position: "relative", cursor: full || busy ? "not-allowed" : "pointer", opacity: full ? 0.5 : 1 }}>
          {busy ? "Uploading…" : "Upload photos"}
          <input type="file" accept="image/*" multiple disabled={full || busy} style={HIDDEN_INPUT} onChange={(e) => {
            const files = [...(e.target.files ?? [])];
            e.target.value = "";
            if (!files.length) return;
            setBusy(true);
            void api.addGallery(files).finally(() => setBusy(false));
          }} />
        </label>
      </div>
      {photos.length === 0 ? (
        <div style={{ display: "grid", justifyItems: "center", textAlign: "center", gap: 12, padding: "44px 16px", border: "1px dashed var(--line2)", borderRadius: 18 }}>
          <div className="h2">Bring your story to life.</div>
          <p className="sm mut" style={{ margin: 0, maxWidth: "40ch" }}>{`Guests won’t see this section until it has photos. Add up to ${max}, and they’ll float past in a 3D gallery.`}</p>
        </div>
      ) : (
        <div key={photos.map((p) => p.id).join()} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 14 }}>
          {photos.map((p, i) => {
            const url = api.mediaUrl(p.id);
            return (
              <div key={p.id} style={{ display: "grid", gap: 8 }}>
                <div style={{ aspectRatio: "4/5", borderRadius: 10, background: url ? `center / cover no-repeat url("${url}")` : "linear-gradient(165deg,var(--line),var(--line2))" }} role="img" aria-label={p.alt || `Photo ${i + 1}`} />
                <input className="inp" data-sf-alt={p.id} maxLength={altMax} placeholder="Describe the photo" aria-label={`Description of photo ${i + 1}`} defaultValue={p.alt} />
                <button type="button" className="btn btn-t btn-s" onClick={() => void api.removeGallery(p.id)}>
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * The fields of one section type, from its schema. `skip` leaves out keys another part of the editor already shows
 * (the Greeting / Tagline / Heading / body inputs of the base editor).
 */
export function SectionForm({ type, api, skip = [] }: { type: string; api: SectionFormApi; skip?: string[] }) {
  const schema = SECTION_SCHEMAS[type];
  if (!schema) return null;
  const c = api.content(type);
  const key = JSON.stringify(c); // a saved or refreshed section remounts the uncontrolled inputs with its new values
  return (
    <div key={key} data-sf={type} style={{ display: "grid", gap: 18 }}>
      {ordered(schema)
        .filter(([k]) => !skip.includes(k))
        .map(([k, f]) => {
          const w = f["x-widget"];
          if (w === "media") {
            return (
              <div key={k}>
                {type !== "hero" && <div className="eb" style={{ marginBottom: 10 }}>{f["x-label"]}</div>}
                <PhotoTile arch={type === "hero"} height={type === "hero" ? 200 : 170} url={api.mediaUrl(c[k])} label={`Add ${(f["x-label"] ?? "photo").toLowerCase()}`} onFile={(file) => api.setPhoto(type, k, file, type === "hero" ? "cover" : "photo")} onClear={() => api.setPhoto(type, k, null)} />
              </div>
            );
          }
          if (w === "media-list") {
            const slots = f.maxItems ?? 2;
            const ids: string[] = c[k] ?? [];
            return (
              <div key={k}>
                <div className="eb" style={{ marginBottom: 10 }}>Photos</div>
                <div className="row" style={{ gap: 18, flexWrap: "wrap", alignItems: "flex-end" }}>
                  {Array.from({ length: slots }, (_, i) => (
                    <PhotoTile key={i} height={i === 0 ? 170 : 130} url={api.mediaUrl(ids[i])} label={i === 0 ? "Main photo" : i === 1 ? "Second photo" : `Photo ${i + 1}`} onFile={(file) => api.setPhotoAt(type, k, i, slots, file)} onClear={() => api.setPhotoAt(type, k, i, slots, null)} />
                  ))}
                </div>
              </div>
            );
          }
          if (w === "chapters") {
            const initial = Array.isArray(c[k]) ? c[k].map((x: any) => ({ title: x?.title ?? "", text: x?.text ?? "" })) : [];
            return <Chapters key={k} schema={f} initial={initial} />;
          }
          if (w === "gallery") return <Gallery key={k} api={api} schema={f} photos={c[k] ?? []} />;
          if (w === "track") {
            return (
              <label key={k} className="f">
                Background music
                <select className="inp" data-sf-track="" defaultValue={c[k] ?? ""}>
                  <option value="">No music</option>
                  {TRACKS.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.title} · {t.credit}
                    </option>
                  ))}
                </select>
                <span className="xs mut">Plays softly once your guest opens the invitation. They can pause it any time.</span>
              </label>
            );
          }
          return <TextField key={k} name={k} schema={f} value={c[k]} />;
        })}
    </div>
  );
}

/**
 * Read a SectionForm back out of the DOM: the keys the form controls (the caller merges them over the section's
 * content, so unknown keys survive) and, for a music section, whether it shows (a track makes the button appear).
 * Returns null when the panel has no form.
 * A text field is written when it has text or the key already exists, so saving an untouched form changes nothing.
 */
export function collectSection(panel: ParentNode, type: string, current: Record<string, any>): { content: Record<string, any>; visible?: boolean } | null {
  const form = panel.querySelector(`[data-sf="${type}"]`);
  if (!form) return null;
  const content: Record<string, any> = {};
  let visible: boolean | undefined;
  form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("[data-sf-text]").forEach((el) => {
    const k = el.dataset.sfText as string;
    const v = el.value.trim();
    if (v !== "" || k in current) content[k] = v;
  });
  const chapters = form.querySelector<HTMLElement>("[data-sf-chapters]");
  if (chapters) {
    const max = +(chapters.dataset.sfChapters ?? 5);
    const rows = [...chapters.querySelectorAll<HTMLElement>("[data-ch-row]")]
      .map((r) => ({ title: (r.querySelector('[data-ch="title"]') as HTMLInputElement)?.value.trim() ?? "", text: (r.querySelector('[data-ch="text"]') as HTMLInputElement)?.value.trim() ?? "" }))
      .filter((c) => c.title || c.text);
    content.chapters = rows.slice(0, max);
  }
  const alts = new Map([...form.querySelectorAll<HTMLInputElement>("[data-sf-alt]")].map((i) => [i.dataset.sfAlt as string, i.value.trim()]));
  if (alts.size && Array.isArray(current.photos)) content.photos = current.photos.map((p: any) => ({ id: p.id, alt: alts.get(p.id) ?? p.alt ?? "" }));
  const track = form.querySelector<HTMLSelectElement>("[data-sf-track]");
  if (track) {
    content.track = track.value;
    visible = !!track.value;
  }
  return { content, visible };
}
