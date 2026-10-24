import type { Invite, InviteLive } from "@/lib/api/invite";
import type { KitWish } from "@/lib/kit/behaviors/useWishes";
import { arr, buildInviteModel, guestFromSearch, obj, str, type ModelGiftMethod, type ModelMoment, type ModelPhoto } from "@/lib/kit/model";
import { trackByKey } from "@/lib/kit/music";
import type { TemplateMode } from "../types";

export type Photo = ModelPhoto;
export type GalleryPhoto = { url: string | null; alt: string };
export type Chapter = { title: string; text: string; when: string };

/** Everything Arunika renders, in one plain object: built by `mapInvite` (live / preview) or `demoConfig` (landing). */
export type ArConfig = {
  mode: TemplateMode;
  partnerOne: string;
  partnerTwo: string;
  /** ISO instant of the wedding ("" = not set). Drives the countdown. */
  weddingDate: string;
  timezone: string;
  language: string;
  guestName: string;
  /** The line on the names card ("Please join us for the wedding of"). */
  inviteLine: string;
  /** The script line over the countdown. */
  heroLine: string;
  venue: string;
  address: string;
  events: ModelMoment[];
  dressCode: string;
  story: { title: string; body: string; chapters: Chapter[]; photos: Photo[] };
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
  closing: { title: string; body: string };
  /** Photographs the collage polaroids use, best first (hero, story, gallery…); empty = painted placeholders. */
  photos: string[];
  live: InviteLive | null;
  sampleWishes: KitWish[];
  show: { story: boolean; gallery: boolean; gift: boolean; music: boolean; wishes: boolean };
};

export const DEFAULT_COPY = {
  inviteLine: "Please join us for the wedding of",
  heroLine: "Time to Celebrate",
  rsvpBody: "Kindly let us know whether you can join us.",
  giftNote: "Your presence is the greatest gift of all. Should you wish to honour us with a gift, a digital envelope is available below.",
  closingTitle: "With love",
  guestName: "Our Beloved Guest",
} as const;

const moment = (m: Partial<ModelMoment> & Pick<ModelMoment, "title" | "startsAt">): ModelMoment => ({
  label: "", endsAt: null, description: "", venue: "", address: "", mapUrl: "", venueNote: "", dressCode: "", photo: null, ...m,
});
const PLACEHOLDER_GALLERY: GalleryPhoto[] = ["The proposal", "Golden hour", "By the lake", "The rings", "Sunday mornings"].map((alt) => ({ url: null, alt }));

/** The sample invitation for the landing demo (the mock's Raka & Nadia, by a lake in Ubud). */
export function demoConfig(search = ""): ArConfig {
  const at = (h: string) => `2027-06-12T${h}:00+08:00`;
  return {
    mode: "demo",
    partnerOne: "Raka",
    partnerTwo: "Nadia",
    weddingDate: at("16:00"),
    timezone: "Asia/Makassar",
    language: "en",
    guestName: guestFromSearch(search) || DEFAULT_COPY.guestName,
    inviteLine: DEFAULT_COPY.inviteLine,
    heroLine: DEFAULT_COPY.heroLine,
    venue: "Villa Arunika",
    address: "Jl. Raya Sayan No. 8, Ubud, Bali",
    events: [
      moment({ title: "Guests Arrive", description: "Welcome drinks", startsAt: at("15:30") }),
      moment({ title: "Ceremony", description: "On the garden lawn", startsAt: at("16:00"), venue: "Villa Arunika", address: "Jl. Raya Sayan No. 8, Ubud, Bali", venueNote: "Shuttles leave Hotel Tirta Ubud at 3:00 PM and return from 11:00 PM." }),
      moment({ title: "Cocktail Hour", description: "By the lake", startsAt: at("17:00") }),
      moment({ title: "Reception & Dinner", description: "The great hall", startsAt: at("18:30") }),
      moment({ title: "First Dance", description: "The party begins", startsAt: at("20:30") }),
      moment({ title: "Farewell", description: "Sparkler send-off", startsAt: at("23:00") }),
    ],
    dressCode: "Romantic and elegant: long dresses, suits and jewel tones. We would love to see you in our palette. Kindly avoid white and ivory.",
    story: {
      title: "",
      body: "",
      chapters: [
        { when: "Jakarta · 2019", title: "How we met", text: "A rainy afternoon, one umbrella and a shared table at a crowded café. Small talk turned into hours." },
        { when: "Bandung · 2021", title: "Falling in love", text: "Road trips, late-night noodles and too many sunsets to count. We found our favourite person." },
        { when: "Lake Toba · 2025", title: "The proposal", text: "By the water at golden hour, swans gliding past: one question and a very happy yes." },
        { when: "Ubud · 2027", title: "Forever begins", text: "And now the next chapter. We cannot wait to celebrate it with you." },
      ],
      photos: [],
    },
    gallery: PLACEHOLDER_GALLERY,
    gift: { title: "", note: DEFAULT_COPY.giftNote, methods: [{ kind: "bank", bank: "Bank Name", holder: "Account Holder", number: "1234 5678 90" }] },
    rsvp: { title: "", body: DEFAULT_COPY.rsvpBody, mode: "form", nameLocked: false, status: "pending", partySize: 1, maxParty: 4, deadline: "2027-05-01T23:59:00+08:00" },
    wishesTitle: "",
    music: "satie-gymnopedie-1",
    closing: { title: DEFAULT_COPY.closingTitle, body: "" },
    photos: [],
    live: null,
    sampleWishes: [
      { id: "s1", name: "Ayu", relation: "Friend of the bride", message: "To slow mornings, loud laughter and a love that keeps choosing each other. So happy for you two." },
      { id: "s2", name: "The Wijaya Family", message: "May your home always be full of flowers, good food and open doors. See you by the lake!" },
      { id: "s3", name: "Bima", relation: "College roommate", message: "Saving my best moves for the first dance. Congratulations!" },
    ],
    show: { story: true, gallery: true, gift: true, music: true, wishes: true },
  };
}

/** The guest-safe invitation → what the template renders. `search` is `location.search` (for `?to=` on generic links). */
export function mapInvite(invite: Invite, mode: TemplateMode, search = ""): ArConfig {
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
  const events: ModelMoment[] = m.moments.length ? m.moments : [moment({ title: "The Wedding", startsAt: invite.event_date, venue: invite.venue ?? "" })];
  const chapters = arr(story.chapters)
    .slice(0, 5)
    .map((c): Chapter => ({ title: str(obj(c).title, 40), text: str(obj(c).text, 160), when: "" }))
    .filter((c) => c.title || c.text);
  const storyIds = arr(story.photo_ids);
  const shots = arr(gallery.photos)
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
  const heroPhoto = m.photo(hero.photo_id, "Portrait of the couple");
  const storyPhotos = [m.photo(storyIds[0], "A favourite photo of the couple"), m.photo(storyIds[1], "A candid moment")].filter((p): p is NonNullable<Photo> => !!p);
  const closingPhoto = m.photo(closing.photo_id, "A closing portrait");

  return {
    mode,
    partnerOne: m.partnerOne || "Partner",
    partnerTwo: m.partnerTwo || "Partner",
    weddingDate: m.weddingDate,
    timezone: m.timezone,
    language: m.language,
    guestName: m.guest.name || DEFAULT_COPY.guestName,
    inviteLine: str(opening.subtitle, 80) || str(opening.title, 80) || DEFAULT_COPY.inviteLine,
    heroLine: str(hero.title, 40) || DEFAULT_COPY.heroLine,
    venue: first.venue || first.title,
    address: first.address,
    events,
    dressCode: m.dressCode,
    story: { title: title(story.title), body: storyBody, chapters, photos: storyPhotos },
    gallery: shots.length || !sketch ? shots : PLACEHOLDER_GALLERY,
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
    closing: { title: str(closing.title, 30) || DEFAULT_COPY.closingTitle, body: str(closing.body, 200) },
    photos: [...[heroPhoto, ...storyPhotos, closingPhoto, ...events.map((e) => e.photo)].map((p) => p?.url), ...shots.map((g) => g.url)].filter((u): u is string => !!u),
    live: m.live,
    sampleWishes: [],
    show: {
      story: m.has("story") && (storyBody !== "" || chapters.length > 0),
      gallery: sketch || (m.has("gallery") && shots.length > 0),
      gift: m.has("gift") && m.giftMethods.length > 0,
      music: m.has("music") && !!trackByKey(trackKey),
      wishes: m.has("wishes"),
    },
  };
}
