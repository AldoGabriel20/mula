import type { Invite, InviteLive } from "@/lib/api/invite";
import type { KitWish } from "@/lib/kit/behaviors/useWishes";
import type { TemplateMode } from "../types";
import { arr, buildInviteModel, guestFromSearch, obj, str } from "@/lib/kit/model";
import { trackByKey } from "@/lib/kit/music";

/** A photo the template can show. `url` is a signed, expiring media URL. */
export type Photo = { url: string; alt: string } | null;
export type GalleryPhoto = { url: string | null; alt: string };
/** A wish as the card shows it; only the demo samples carry a relation ("Friend of the bride"). */
export type DeckWish = KitWish;
export type GiftMethod = { kind: "bank" | "wallet"; bank: string; holder: string; number: string };

export type ConfigEvent = {
  /** Eyebrow above the title ("The Ceremony"); "" hides it. */
  label: string;
  title: string;
  /** ISO instants; null = no time set (the wedding date is used for the day). */
  startsAt: string | null;
  endsAt: string | null;
  description: string;
  venue: string;
  address: string;
  /** "" or an https:// link. */
  mapUrl: string;
  venueNote: string;
  photo: Photo;
};

export type RsvpMode = "form" | "notice";

/**
 * Everything the template renders, in one plain object. It has the shape of the prototype's
 * WEDDING_CONFIG, with production-grade types: instants + a time zone instead of local strings.
 * Built by `mapInvite` (live / preview) or `demoConfig` (landing).
 */
export type WeddingConfig = {
  mode: TemplateMode;
  partnerOne: string;
  partnerTwo: string;
  /** ISO instant of the wedding ("" = not set). Drives the countdown. */
  weddingDate: string;
  /** IANA zone every date is printed in. */
  timezone: string;
  /** Content language: "id" prints Indonesian month/day names, anything else en-GB. */
  language: string;
  guestName: string;
  heroTitle: string;
  heroLine: string;
  openingTitle: string;
  openingSubtitle: string;
  statement: string;
  story: string;
  chapters: { title: string; text: string }[];
  /** Optional heading overrides (last word is set in the accent italic). */
  titles: Partial<Record<"story" | "celebration" | "gallery" | "gift" | "rsvp" | "wishes", string>>;
  events: ConfigEvent[];
  dressCode: string;
  gift: { note: string; methods: GiftMethod[] };
  rsvp: {
    /** "notice" = a generic link: there is no guest to attach a reply to. */
    mode: RsvpMode;
    /** Personal link: the name is the guest's and cannot be edited. */
    nameLocked: boolean;
    status: "pending" | "yes" | "no";
    partySize: number;
    /** 1 + the plus-ones the host allowed; 1 hides the stepper. */
    maxParty: number;
    deadline: string | null;
  };
  /** Track key from music.ts, or null for no music. */
  music: string | null;
  closingMessage: string;
  photos: { hero: Photo; story: [Photo, Photo]; closing: Photo };
  gallery: GalleryPhoto[];
  live: InviteLive | null;
  /** Demo only: the wishes shown before a visitor writes one. */
  sampleWishes: DeckWish[];
  /** Sections that render. Hero, date, celebration, venue, rsvp and the stack are always on. */
  show: { opening: boolean; story: boolean; gallery: boolean; gift: boolean; music: boolean; wishes: boolean; closing: boolean };
};

// ---- copy from the prototype (used wherever the host wrote nothing) -------------------------------
export const DEFAULT_COPY = {
  heroTitle: "The Wedding Of",
  openingTitle: "Together with our families",
  openingSubtitle: "We invite you to celebrate our wedding",
  heroLine: "With joyful hearts we begin our forever, and we would love you beside us.",
  statement: "Two hearts, one story, a lifetime to begin.",
  giftNote: "Your presence is the most treasured gift. Should you wish to honour us further, a digital envelope is available below.",
  closingMessage: "Thank you for being part of the story we are about to begin.",
  guestName: "Our Beloved Guest",
  dressCode: "Formal attire",
} as const;

/** What the prototype shows where the couple has not written or uploaded anything yet. */
const PLACEHOLDER_CHAPTERS = [
  { title: "The first hello", text: "Where and when your story began." },
  { title: "Growing together", text: "A memory that brought you closer." },
  { title: "The question", text: "How the proposal happened." },
];
const PLACEHOLDER_GALLERY: GalleryPhoto[] = ["Pre-wedding portrait", "Holding hands", "Laughing together", "Detail of the rings", "Flowers", "Walking together", "Candid moment", "Golden hour portrait"].map((alt) => ({ url: null, alt }));

const DEMO_STORY =
  "A placeholder for the couple's real love story. Replace this paragraph with how you met, the moments that brought you closer, and the day you chose forever.";

/** The prototype's WEDDING_CONFIG, verbatim, for the landing demo. */
export function demoConfig(search = ""): WeddingConfig {
  return {
    mode: "demo",
    partnerOne: "Adrian",
    partnerTwo: "Isabella",
    weddingDate: "2027-06-12T10:00:00+07:00",
    timezone: "Asia/Jakarta",
    language: "en",
    guestName: guestFromSearch(search) || DEFAULT_COPY.guestName,
    heroTitle: DEFAULT_COPY.heroTitle,
    heroLine: DEFAULT_COPY.heroLine,
    openingTitle: DEFAULT_COPY.openingTitle,
    openingSubtitle: DEFAULT_COPY.openingSubtitle,
    statement: DEFAULT_COPY.statement,
    story: DEMO_STORY,
    chapters: PLACEHOLDER_CHAPTERS,
    titles: {},
    events: [
      { label: "The Ceremony", title: "Akad Nikah", startsAt: "2027-06-12T10:00:00+07:00", endsAt: null, description: "The solemn exchange of vows, witnessed by our families and closest loved ones.", venue: "Ceremony Venue", address: "Venue address to be configured", mapUrl: "", venueNote: "", photo: null },
      { label: "The Reception", title: "Wedding Reception", startsAt: "2027-06-12T18:00:00+07:00", endsAt: null, description: "An evening of dinner, music and celebration together.", venue: "Reception Venue", address: "Venue address to be configured", mapUrl: "", venueNote: "", photo: null },
    ],
    dressCode: DEFAULT_COPY.dressCode,
    gift: { note: DEFAULT_COPY.giftNote, methods: [{ kind: "bank", bank: "Bank Name", holder: "Account Holder", number: "1234 5678 90" }] },
    rsvp: { mode: "form", nameLocked: false, status: "pending", partySize: 1, maxParty: 4, deadline: null },
    music: "satie-gymnopedie-1",
    closingMessage: DEFAULT_COPY.closingMessage,
    photos: { hero: null, story: [null, null], closing: null },
    gallery: PLACEHOLDER_GALLERY,
    live: null,
    sampleWishes: [
      { id: "s1", name: "Nadia", relation: "Friend of the bride", message: "Wishing you a lifetime of laughter, patience and slow Sunday mornings together. I am so happy for you both." },
      { id: "s2", name: "The Hartono Family", message: "May your home always be full of warmth, good food and open doors. We cannot wait to celebrate with you." },
      { id: "s3", name: "Daniel", relation: "University friend", message: "Finally! See you both on the dance floor." },
      { id: "s4", name: "Aunt Mira", message: "Love each other gently, forgive quickly, and never stop choosing each other, on the easy days and especially on the hard ones. You two are a blessing to all of us, and we are so proud to watch your story begin. With all our love." },
    ],
    show: { opening: true, story: true, gallery: true, gift: true, music: true, wishes: true, closing: true },
  };
}

// ---- invitation → config ------------------------------------------------------------------------

/**
 * The guest-safe invitation → what the template renders (docs/15 §7.2).
 * `search` is `location.search` (for `?to=`, honoured on generic links only).
 */
export function mapInvite(invite: Invite, mode: TemplateMode, search = ""): WeddingConfig {
  const m = buildInviteModel(invite, mode, search);
  const has = (type: string) => m.has(type);
  const hero = m.content("hero");
  const opening = m.content("opening");
  const story = m.content("story");
  const gift = m.content("gift");
  const rsvp = m.content("rsvp");
  const wishes = m.content("wishes");
  const closing = m.content("closing");
  const gallery = m.content("gallery");
  const schedule = m.content("schedule");

  const moments: ConfigEvent[] = m.moments.map(({ dressCode: _dress, ...e }) => e);
  // no moments yet: one card from the event's own date and venue, so the section is never empty
  const events: ConfigEvent[] = moments.length
    ? moments
    : [{ label: "The Celebration", title: "The Wedding", startsAt: invite.event_date, endsAt: null, description: "", venue: invite.venue ?? "", address: "", mapUrl: "", venueNote: "", photo: null }];

  const chapters = arr(story.chapters)
    .slice(0, 5)
    .map((c) => ({ title: str(obj(c).title, 40), text: str(obj(c).text, 120) }))
    .filter((c) => c.title || c.text);
  const storyBody = str(story.body, 1200);

  const galleryPhotos = arr(gallery.photos)
    .slice(0, 12)
    .map((p): GalleryPhoto => {
      const id = obj(p).id;
      const url = typeof id === "string" ? (invite.media[id] ?? null) : null;
      return { url, alt: str(obj(p).alt, 80) };
    })
    .filter((p) => p.url);
  const trackKey = str(m.content("music").track, 60);
  // A host's draft shows the whole design, as the sample does: where the story or the photographs are not
  // there yet, the prototype's placeholders stand in (empty frames, the sample paragraph and chapters).
  // A published invitation shows only what the host actually filled in.
  const sketch = mode === "preview";
  const storyIds = arr(story.photo_ids);

  const titles: WeddingConfig["titles"] = {};
  const t = (k: keyof WeddingConfig["titles"], v: unknown) => {
    const s = str(v, 60);
    if (s) titles[k] = s;
  };
  t("story", story.title);
  t("celebration", schedule.title);
  t("gallery", gallery.title);
  t("gift", gift.title);
  t("rsvp", rsvp.title);
  t("wishes", wishes.title);

  return {
    mode,
    partnerOne: m.partnerOne || "Partner",
    partnerTwo: m.partnerTwo || "Partner",
    weddingDate: m.weddingDate,
    timezone: m.timezone,
    language: m.language,
    guestName: m.guest.name || DEFAULT_COPY.guestName,
    heroTitle: str(hero.title, 40) || DEFAULT_COPY.heroTitle,
    heroLine: str(hero.line, 160) || DEFAULT_COPY.heroLine,
    openingTitle: str(opening.title, 60) || DEFAULT_COPY.openingTitle,
    openingSubtitle: str(opening.subtitle, 100) || DEFAULT_COPY.openingSubtitle,
    statement: str(opening.statement, 90) || DEFAULT_COPY.statement,
    story: storyBody || (sketch ? DEMO_STORY : ""),
    chapters: chapters.length || !sketch ? chapters : PLACEHOLDER_CHAPTERS,
    titles,
    events,
    dressCode: m.dressCode,
    gift: { note: str(gift.body, 300) || DEFAULT_COPY.giftNote, methods: m.giftMethods },
    rsvp: {
      mode: m.rsvp.personal || mode !== "live" ? "form" : "notice",
      nameLocked: m.rsvp.personal,
      status: m.rsvp.status,
      partySize: m.rsvp.partySize,
      maxParty: m.rsvp.maxParty,
      deadline: m.rsvp.deadline,
    },
    music: trackByKey(trackKey) ? trackKey : null,
    closingMessage: str(closing.body, 200) || DEFAULT_COPY.closingMessage,
    photos: {
      hero: m.photo(hero.photo_id, "Portrait of the couple"),
      story: [m.photo(storyIds[0], "A favourite photo of the couple"), m.photo(storyIds[1], "A candid moment")],
      closing: m.photo(closing.photo_id, "A closing portrait"),
    },
    gallery: galleryPhotos.length || !sketch ? galleryPhotos : PLACEHOLDER_GALLERY,
    live: m.live,
    sampleWishes: [],
    show: {
      opening: has("opening"),
      story: sketch || (has("story") && storyBody !== ""),
      gallery: sketch || (has("gallery") && galleryPhotos.length > 0),
      gift: has("gift") && m.giftMethods.length > 0,
      music: has("music") && !!trackByKey(trackKey),
      wishes: has("wishes"),
      closing: has("closing"),
    },
  };
}
