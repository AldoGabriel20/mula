import type { Invite, InviteLive } from "@/lib/api/invite";
import type { KitWish } from "@/lib/kit/behaviors/useWishes";
import { arr, buildInviteModel, guestFromSearch, obj, str, type ModelGiftMethod, type ModelMoment, type ModelPhoto } from "@/lib/kit/model";
import { trackByKey } from "@/lib/kit/music";
import type { TemplateMode } from "../types";

export type Photo = ModelPhoto;
export type GalleryPhoto = { url: string | null; alt: string };

/** Everything We Do renders, in one plain object: built by `mapInvite` (live / preview) or `demoConfig` (landing). */
export type WeDoConfig = {
  mode: TemplateMode;
  partnerOne: string;
  partnerTwo: string;
  /** ISO instant of the wedding ("" = not set). Drives the countdown. */
  weddingDate: string;
  timezone: string;
  language: string;
  guestName: string;
  /** The hand-lettered title on the hero ("We Do"): first word left, the rest right. */
  heroTitle: string;
  heroLine: string;
  together: string;
  inviteLine: string;
  address: string;
  events: ModelMoment[];
  dressCode: string;
  story: { title: string; body: string; chapters: { title: string; text: string }[]; photos: [Photo, Photo] };
  gallery: GalleryPhoto[];
  gift: { title: string; note: string; methods: ModelGiftMethod[] };
  rsvp: {
    title: string;
    body: string;
    /** "notice" = a generic link: there is no guest to attach a reply to. */
    mode: "form" | "notice";
    nameLocked: boolean;
    status: "pending" | "yes" | "no";
    partySize: number;
    maxParty: number;
    deadline: string | null;
  };
  wishesTitle: string;
  /** Track key from catalog/music.json, or null for no music. */
  music: string | null;
  closing: { title: string; body: string; photo: Photo };
  heroPhoto: Photo;
  live: InviteLive | null;
  sampleWishes: KitWish[];
  show: { story: boolean; gallery: boolean; gift: boolean; music: boolean; wishes: boolean };
};

export const DEFAULT_COPY = {
  heroTitle: "We Do",
  together: "Together with their families",
  inviteLine: "Invite you to their wedding celebration",
  rsvpBody: "Fill out the RSVP form below and let us know you're in!",
  giftNote: "Your presence is the most treasured gift. Should you wish to honour us further, a digital envelope is available below.",
  closingTitle: "Save the date",
  closingBody: "",
  guestName: "Our Beloved Guest",
} as const;

const noPhoto = { url: null } as const;
const PLACEHOLDER_GALLERY: GalleryPhoto[] = ["Pre-wedding portrait", "Holding hands", "Laughing together", "Detail of the rings"].map((alt) => ({ ...noPhoto, alt }));

const moment = (m: Partial<ModelMoment> & Pick<ModelMoment, "title" | "startsAt">): ModelMoment => ({
  label: "", endsAt: null, description: "", venue: "", address: "", mapUrl: "", venueNote: "", dressCode: "", photo: null, ...m,
});

/** The sample invitation for the landing demo (the prototype's Rani & Dimas). */
export function demoConfig(search = ""): WeDoConfig {
  return {
    mode: "demo",
    partnerOne: "Rani",
    partnerTwo: "Dimas",
    weddingDate: "2030-07-22T15:30:00+07:00",
    timezone: "Asia/Jakarta",
    language: "en",
    guestName: guestFromSearch(search) || DEFAULT_COPY.guestName,
    heroTitle: DEFAULT_COPY.heroTitle,
    heroLine: "",
    together: DEFAULT_COPY.together.toUpperCase(),
    inviteLine: DEFAULT_COPY.inviteLine,
    address: "Jl. Kemang Raya No. 8, Jakarta Selatan",
    events: [
      moment({ title: "Wedding Ceremony", startsAt: "2030-07-22T15:30:00+07:00", venue: "The Glasshouse", address: "Jl. Kemang Raya No. 8, Jakarta Selatan", description: "Celebrate our happy day in a warm, elegant glass garden in the heart of Jakarta.", venueNote: "Shuttle is available from the ceremony to the reception, leaving right after the ceremony ends." }),
      moment({ title: "Cocktail Hour", startsAt: "2030-07-22T16:30:00+07:00" }),
      moment({ title: "Photo Session", startsAt: "2030-07-22T17:00:00+07:00" }),
      moment({ title: "Dinner Reception", startsAt: "2030-07-22T18:30:00+07:00" }),
      moment({ title: "Dance Party", startsAt: "2030-07-22T20:00:00+07:00" }),
    ],
    dressCode: "Semi-formal and elegant. Add a touch of pastel to match our theme.",
    story: { title: "", body: "", chapters: [], photos: [null, null] },
    gallery: PLACEHOLDER_GALLERY,
    gift: { title: "", note: DEFAULT_COPY.giftNote, methods: [{ kind: "bank", bank: "Bank Name", holder: "Account Holder", number: "1234 5678 90" }] },
    rsvp: { title: "", body: DEFAULT_COPY.rsvpBody, mode: "form", nameLocked: false, status: "pending", partySize: 1, maxParty: 4, deadline: "2030-07-15T23:59:00+07:00" },
    wishesTitle: "",
    music: "satie-gymnopedie-1",
    closing: { title: DEFAULT_COPY.closingTitle, body: "", photo: null },
    heroPhoto: null,
    live: null,
    sampleWishes: [
      { id: "s1", name: "Nadia", relation: "Friend of the bride", message: "Wishing you a lifetime of laughter, patience and slow Sunday mornings together. I am so happy for you both." },
      { id: "s2", name: "The Hartono Family", message: "May your home always be full of warmth, good food and open doors. We cannot wait to celebrate with you." },
      { id: "s3", name: "Daniel", relation: "University friend", message: "Finally! See you both on the dance floor." },
    ],
    show: { story: false, gallery: true, gift: true, music: true, wishes: true },
  };
}

/** The guest-safe invitation → what the template renders. `search` is `location.search` (for `?to=` on generic links). */
export function mapInvite(invite: Invite, mode: TemplateMode, search = ""): WeDoConfig {
  const m = buildInviteModel(invite, mode, search);
  const hero = m.content("hero");
  const opening = m.content("opening");
  const story = m.content("story");
  const gift = m.content("gift");
  const rsvp = m.content("rsvp");
  const gallery = m.content("gallery");
  const closing = m.content("closing");
  const title = (v: unknown) => str(v, 60);

  // no moments yet: one from the event's own date and venue, so the page is never empty
  const events: ModelMoment[] = m.moments.length ? m.moments : [moment({ label: "", title: "The Wedding", startsAt: invite.event_date, venue: invite.venue ?? "" })];
  const chapters = arr(story.chapters)
    .slice(0, 5)
    .map((c) => ({ title: str(obj(c).title, 40), text: str(obj(c).text, 120) }))
    .filter((c) => c.title || c.text);
  const storyIds = arr(story.photo_ids);
  const photos = arr(gallery.photos)
    .slice(0, 12)
    .map((p): GalleryPhoto => {
      const id = obj(p).id;
      return { url: typeof id === "string" ? (invite.media[id] ?? null) : null, alt: str(obj(p).alt, 80) };
    })
    .filter((p) => p.url);
  const trackKey = str(m.content("music").track, 60);
  const sketch = mode === "preview"; // a draft shows the whole design; a published page only what the host filled in
  const storyBody = str(story.body, 1200);
  const first = events.find((e) => e.venue || e.address) ?? events[0];

  return {
    mode,
    partnerOne: m.partnerOne || "Partner",
    partnerTwo: m.partnerTwo || "Partner",
    weddingDate: m.weddingDate,
    timezone: m.timezone,
    language: m.language,
    guestName: m.guest.name || DEFAULT_COPY.guestName,
    heroTitle: str(hero.title, 24) || DEFAULT_COPY.heroTitle,
    heroLine: str(hero.line, 160),
    together: (str(opening.title, 60) || DEFAULT_COPY.together).toUpperCase(),
    inviteLine: str(opening.subtitle, 100) || DEFAULT_COPY.inviteLine,
    address: first.address || first.venue,
    events,
    dressCode: m.dressCode,
    story: { title: title(story.title), body: storyBody, chapters, photos: [m.photo(storyIds[0], "A favourite photo of the couple"), m.photo(storyIds[1], "A candid moment")] },
    gallery: photos.length || !sketch ? photos : PLACEHOLDER_GALLERY,
    gift: { title: title(gift.title), note: str(gift.body, 300) || DEFAULT_COPY.giftNote, methods: m.giftMethods },
    rsvp: {
      title: title(rsvp.title),
      body: str(rsvp.body, 200) || DEFAULT_COPY.rsvpBody,
      mode: m.rsvp.personal || mode !== "live" ? "form" : "notice",
      nameLocked: m.rsvp.personal,
      status: m.rsvp.status,
      partySize: m.rsvp.partySize,
      maxParty: m.rsvp.maxParty,
      deadline: m.rsvp.deadline,
    },
    wishesTitle: title(m.content("wishes").title),
    music: trackByKey(trackKey) ? trackKey : null,
    closing: { title: str(closing.title, 30) || DEFAULT_COPY.closingTitle, body: str(closing.body, 200), photo: m.photo(closing.photo_id, "A closing portrait") },
    heroPhoto: m.photo(hero.photo_id, "Portrait of the couple"),
    live: m.live,
    sampleWishes: [],
    show: {
      story: m.has("story") && (storyBody !== "" || chapters.length > 0),
      gallery: sketch || (m.has("gallery") && photos.length > 0),
      gift: m.has("gift") && m.giftMethods.length > 0,
      music: m.has("music") && !!trackByKey(trackKey),
      wishes: m.has("wishes"),
    },
  };
}
