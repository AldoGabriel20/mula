// Static marketing content, sourced from the prototype copy. These are served
// statically today; the data endpoints (GET /templates, /packages, /tips) are an
// API SPEC GAP (not yet in the backend) — swap these for fetched data when they land.

export type Feature = { title: string; body: string };
export const FEATURES: Feature[] = [
  { title: "Beautiful templates", body: "Designed in-house for weddings, seventeenths, birthdays and brand events. Each one is a starting point, not a cage." },
  { title: "Easy customization", body: "Change names, wording, palette, type and photos. No design skills required." },
  { title: "Personalized invitations", body: "Every guest gets a unique link that greets them by name. Hosts see who opened it and when." },
  { title: "RSVP", body: "Guests confirm attendance and party size from the invitation. Replies appear in your dashboard immediately." },
  { title: "Guest management", body: "Groups, seats and status — the whole list in one place, with WhatsApp sharing built in." },
  { title: "Gifts & memories", body: "Collect wishes, share gift details, and keep every photo from the day in one gallery." },
];

export type Plan = { slug: string; name: string; price: string; blurb: string; featured?: boolean };
export const PLANS: Plan[] = [
  { slug: "essential", name: "Essential", price: "Rp 149.000", blurb: "A beautiful invitation with the essentials, for one celebration." },
  { slug: "signature", name: "Signature", price: "Rp 349.000", blurb: "Personalized guest links, full guest management and more.", featured: true },
  { slug: "custom", name: "Custom", price: "Let's talk", blurb: "Bespoke design and brand guidelines for larger events." },
];
export const COMPARE: { label: string; essential: string; signature: string; custom: string }[] = [
  { label: "Invitation creation", essential: "Yes", signature: "Yes", custom: "Yes" },
  { label: "Templates", essential: "Essential selection", signature: "Full collection", custom: "Full + bespoke" },
  { label: "Customization", essential: "Text, photos, colours", signature: "Everything", custom: "Incl. brand guidelines" },
  { label: "RSVP", essential: "Yes", signature: "Yes", custom: "Yes" },
  { label: "Personalized guest links", essential: "No", signature: "Yes", custom: "Yes" },
  { label: "Guest management", essential: "Basic list", signature: "Groups, seats, status", custom: "Everything" },
  { label: "WhatsApp sharing", essential: "Single link", signature: "Personal messages", custom: "Personal messages" },
];

export type Template = { slug: string; name: string; category: string; palette: string; style: string; featured?: boolean };
export const TEMPLATES: Template[] = [
  { slug: "linen-vow", name: "Linen Vow", category: "Wedding", palette: "Stone", style: "Editorial", featured: true },
  { slug: "ivory-arch", name: "Ivory Arch", category: "Wedding", palette: "Ivory", style: "Minimal", featured: true },
  { slug: "blush-garden", name: "Blush Garden", category: "Engagement", palette: "Blush", style: "Romantic" },
  { slug: "seventeen-velvet", name: "Velvet Seventeen", category: "Seventeen", palette: "Midnight", style: "Luxe" },
  { slug: "forest-vows", name: "Forest Vows", category: "Wedding", palette: "Forest", style: "Garden" },
  { slug: "maison", name: "Maison", category: "Anniversary", palette: "Ivory", style: "Elegant" },
  { slug: "atlas-launch", name: "Atlas Launch", category: "Brand Event", palette: "Midnight", style: "Modern" },
  { slug: "playful-ten", name: "Playful Ten", category: "Birthday", palette: "Blush", style: "Playful" },
];
export const TEMPLATE_CATEGORIES = ["All", "Wedding", "Engagement", "Seventeen", "Birthday", "Anniversary", "Brand Event"];

export type Article = { slug: string; title: string; excerpt: string; body: string[] };
export const ARTICLES: Article[] = [
  {
    slug: "choose-a-template",
    title: "How to choose a template",
    excerpt: "Describe the day in three words before you browse, then filter to match.",
    body: [
      "Describe the day in three words before you browse, then filter to match.",
      "Pick the template first and the palette second. Structure is harder to change than colour.",
      "Preview it on your own phone — that is where most guests will see it.",
    ],
  },
  {
    slug: "what-to-include",
    title: "What to include on your invitation",
    excerpt: "Essentials, helpful extras, and what to leave off the first page.",
    body: [
      "Essentials: names, date, start time, venue and how to reply.",
      "Helpful extras: map link, dress code, schedule, parking and accommodation.",
      "Leave out anything guests don't need up front — it can live on a second page.",
    ],
  },
  {
    slug: "when-to-send",
    title: "When to send your invitations",
    excerpt: "Timelines that give guests enough room to plan.",
    body: [
      "Six to eight weeks for most celebrations; ten to twelve for destination events.",
      "Send a save-the-date earlier if travel is involved.",
      "Follow up with guests who haven't opened their link a week before you close RSVPs.",
    ],
  },
];

export type InspirationItem = { title: string; meta: string; palette: string };
export const INSPIRATION: InspirationItem[] = [
  { title: "Rad & Cil, in stone and sea", meta: "Engagement · Linen", palette: "Stone" },
  { title: "Kevin & Mei, a grand-hotel wedding", meta: "Wedding · Maison", palette: "Ivory" },
  { title: "Naya at seventeen", meta: "Seventeen · Velvet", palette: "Midnight" },
  { title: "Ten years, four friends", meta: "Anniversary · Garden", palette: "Forest" },
  { title: "Atlas, a product launch", meta: "Brand Event · Modern", palette: "Midnight" },
  { title: "A blush garden party", meta: "Birthday · Playful", palette: "Blush" },
];
