// Static landing content, extracted verbatim from the prototype (docs/landing-page-prototype/mula-core.js).
// Prices are placeholders in the prototype ("Rp 000K") and stay so until launch pricing is confirmed.
import { MANIFESTS } from '@/lib/kit/generated/manifests';
import { PALETTES } from '@/lib/kit/generated/palettes';
import { hasLiveTemplate } from '@/lib/kit/generated/registry';
import type { InviteData } from './InviteScreen';

export type Template = {
  slug: string; name: string; cat: string; style: string; mood: string; color: string; desc: string; d: InviteData;
  /** Derived, never hand-set: the slug has a coded renderer (the catalog manifest), so the preview opens /demo/<slug> instead of the phone mock. */
  live?: boolean;
  /** The real template, captured from its demo (catalog manifest `thumbnail`); absent for a design without a manifest. */
  thumb?: string;
  thumbMobile?: string;
};
export type Category = { name: string; line: string; slug: string; bg: string; fg: string };
export type Tip = { slug: string; cat: string; read: string; title: string; excerpt: string };
export type Tier = { key: string; name: string; featured?: boolean; price: string; note: string; items: string[] };

export const PHOTOS: Record<string, string> = {
  "dusk": "radial-gradient(90% 60% at 30% 25%, rgba(255,214,170,.95), rgba(255,214,170,0) 60%), radial-gradient(80% 70% at 75% 80%, rgba(120,62,52,.9), rgba(120,62,52,0) 70%), linear-gradient(170deg, #D79F7E 0%, #8C5546 55%, #3A2221 100%)",
  "garden": "radial-gradient(70% 50% at 70% 20%, rgba(236,232,200,.9), rgba(236,232,200,0) 60%), radial-gradient(90% 80% at 20% 90%, rgba(40,62,44,.95), rgba(40,62,44,0) 70%), linear-gradient(165deg, #A9B48E, #4F6248 60%, #1F2B22)",
  "noir": "radial-gradient(60% 45% at 50% 30%, rgba(235,232,226,.85), rgba(235,232,226,0) 65%), linear-gradient(180deg, #6B6763, #2A2826 70%, #141312)",
  "blush": "radial-gradient(70% 55% at 35% 30%, rgba(255,236,232,.95), rgba(255,236,232,0) 60%), radial-gradient(80% 70% at 80% 85%, rgba(176,98,110,.8), rgba(176,98,110,0) 70%), linear-gradient(170deg, #EBC2C0, #B9818A 60%, #6E3F4A)",
  "sea": "radial-gradient(80% 50% at 60% 20%, rgba(232,236,238,.9), rgba(232,236,238,0) 60%), radial-gradient(90% 70% at 20% 90%, rgba(52,70,82,.9), rgba(52,70,82,0) 70%), linear-gradient(170deg, #AEB8BC, #5E6E76 60%, #222B30)",
  "gold": "radial-gradient(60% 50% at 40% 30%, rgba(255,228,170,.9), rgba(255,228,170,0) 60%), radial-gradient(80% 70% at 80% 80%, rgba(90,60,25,.95), rgba(90,60,25,0) 70%), linear-gradient(170deg, #C9A35E, #6B4A22 60%, #22180C)"
};

const RAW_TEMPLATES: Template[] = [
  {
    "slug": "serenity",
    "name": "Serenity",
    "cat": "Wedding",
    "style": "Elegant",
    "mood": "Romantic",
    "color": "Ivory",
    "desc": "Ivory paper, a quiet arch and Bodoni italics. Serenity lets your names do the talking.",
    "d": {
      "bg": "#EFE7DA",
      "fg": "#2B2420",
      "accent": "#A88452",
      "font": "'Bodoni Moda', serif",
      "italic": "italic",
      "size": 15,
      "eyebrow": "The Wedding of",
      "title": "Raka & Celine",
      "variant": "arch",
      "date": "Saturday · 12 April 2027"
    }
  },
  {
    "slug": "arunika",
    "name": "Arunika",
    "cat": "Wedding",
    "style": "Garden",
    "mood": "Romantic",
    "color": "Forest",
    "desc": "Named for first light. Deep forest tones with champagne detailing, made for garden ceremonies.",
    "d": {
      "bg": "#4F573A",
      "fg": "#F6F1E7",
      "accent": "#C79AA0",
      "font": "'Cormorant Garamond', serif",
      "size": 13,
      "eyebrow": "Together with their families",
      "title": "Dimas & Laras",
      "variant": "photo",
      "photo": "radial-gradient(70% 50% at 70% 20%, rgba(236,232,200,.9), rgba(236,232,200,0) 60%), radial-gradient(90% 80% at 20% 90%, rgba(40,62,44,.95), rgba(40,62,44,0) 70%), linear-gradient(165deg, #A9B48E, #4F6248 60%, #1F2B22)",
      "date": "Sunday · 08 August 2027"
    }
  },
  {
    "slug": "noir",
    "name": "Noir",
    "cat": "Wedding",
    "style": "Editorial",
    "mood": "Modern",
    "color": "Black",
    "desc": "A magazine cover for your wedding. Full-bleed portrait, tight sans and confident contrast.",
    "d": {
      "bg": "#111010",
      "fg": "#F3EEE6",
      "accent": "#C9C3B8",
      "font": "'Manrope', sans-serif",
      "weight": 300,
      "size": 11.5,
      "ls": "-0.04em",
      "eyebrow": "Issue No. 01",
      "title": "Adrian & Nadia",
      "variant": "cover",
      "photo": "radial-gradient(60% 45% at 50% 30%, rgba(235,232,226,.85), rgba(235,232,226,0) 65%), linear-gradient(180deg, #6B6763, #2A2826 70%, #141312)",
      "date": "27 · 11 · 2027"
    }
  },
  {
    "slug": "maison",
    "name": "Maison",
    "cat": "Wedding",
    "style": "Luxury",
    "mood": "Elegant",
    "color": "Wine",
    "desc": "Wine and champagne with a double frame, inspired by the menus of old grand hotels.",
    "d": {
      "bg": "#3E1A20",
      "fg": "#EBD9C0",
      "accent": "#C9A56E",
      "font": "'Cormorant Garamond', serif",
      "italic": "italic",
      "weight": 400,
      "size": 15,
      "eyebrow": "Request the pleasure",
      "title": "Kevin & Mei",
      "variant": "frame",
      "date": "Saturday · 18 September 2027"
    }
  },
  {
    "slug": "sekar",
    "name": "Sekar",
    "cat": "Wedding",
    "style": "Traditional",
    "mood": "Elegant",
    "color": "Bronze",
    "desc": "Warm bronze and a ceremonial ring, made for akad and traditional receptions.",
    "d": {
      "bg": "#5A3A24",
      "fg": "#F1E3CC",
      "accent": "#D8B27A",
      "font": "'Cormorant Garamond', serif",
      "weight": 500,
      "size": 14,
      "eyebrow": "Walimatul Ursy",
      "title": "Fajar & Annisa",
      "variant": "ring",
      "date": "Ahad · 05 Disember 2027"
    }
  },
  {
    "slug": "linen",
    "name": "Linen",
    "cat": "Engagement",
    "style": "Minimal",
    "mood": "Calm",
    "color": "Stone",
    "desc": "Cool stone, generous margins and nothing extra. For engagements that feel quietly certain.",
    "d": {
      "bg": "#D9DAD5",
      "fg": "#22272A",
      "accent": "#5E6668",
      "font": "'Manrope', sans-serif",
      "weight": 300,
      "size": 12,
      "ls": "-0.03em",
      "eyebrow": "We are engaged",
      "title": "Rad & Cil",
      "variant": "photo",
      "photo": "radial-gradient(80% 50% at 60% 20%, rgba(232,236,238,.9), rgba(232,236,238,0) 60%), radial-gradient(90% 70% at 20% 90%, rgba(52,70,82,.9), rgba(52,70,82,0) 70%), linear-gradient(170deg, #AEB8BC, #5E6E76 60%, #222B30)",
      "date": "Saturday · 20 March 2027"
    }
  },
  {
    "slug": "velvet",
    "name": "Velvet",
    "cat": "Seventeen",
    "style": "Romantic",
    "mood": "Glamorous",
    "color": "Plum",
    "desc": "Plum velvet and an outlined seventeen. A grown-up first party.",
    "d": {
      "bg": "#2B1631",
      "fg": "#F4CFDA",
      "accent": "#E58FAE",
      "font": "'Bodoni Moda', serif",
      "italic": "italic",
      "size": 12.5,
      "eyebrow": "Sweet Seventeen",
      "title": "Naya Turns Seventeen",
      "variant": "numeral",
      "numeral": "17",
      "date": "Saturday · 06 March 2027"
    }
  },
  {
    "slug": "bloom",
    "name": "Bloom",
    "cat": "Seventeen",
    "style": "Playful",
    "mood": "Joyful",
    "color": "Blush",
    "desc": "Soft blush, rounded type and a portrait arch. Sweet without being childish.",
    "d": {
      "bg": "#F4D9DE",
      "fg": "#5A2335",
      "accent": "#C2506E",
      "font": "'Unbounded', sans-serif",
      "weight": 500,
      "size": 10,
      "ls": "-0.03em",
      "eyebrow": "Sweet Seventeen",
      "title": "Alya at Seventeen",
      "variant": "photo",
      "photo": "radial-gradient(70% 55% at 35% 30%, rgba(255,236,232,.95), rgba(255,236,232,0) 60%), radial-gradient(80% 70% at 80% 85%, rgba(176,98,110,.8), rgba(176,98,110,0) 70%), linear-gradient(170deg, #EBC2C0, #B9818A 60%, #6E3F4A)",
      "date": "Saturday · 15 May 2027"
    }
  },
  {
    "slug": "chapter",
    "name": "Chapter",
    "cat": "Birthday",
    "style": "Editorial",
    "mood": "Modern",
    "color": "Midnight",
    "desc": "Your age as a chapter number. Midnight blue with a bright ember accent.",
    "d": {
      "bg": "#16213A",
      "fg": "#ECE6D8",
      "accent": "#E0875A",
      "font": "'Cormorant Garamond', serif",
      "weight": 400,
      "size": 16,
      "eyebrow": "You're invited",
      "title": "Chapter 25",
      "variant": "numeral",
      "numeral": "25",
      "numFont": "'Unbounded', sans-serif",
      "date": "Friday · 21 May 2027"
    }
  },
  {
    "slug": "confetti",
    "name": "Confetti",
    "cat": "Birthday",
    "style": "Playful",
    "mood": "Joyful",
    "color": "Mustard",
    "desc": "Loud, warm and happy. For birthdays that end late.",
    "d": {
      "bg": "#E9B949",
      "fg": "#2A1E0F",
      "accent": "#2A1E0F",
      "font": "'Unbounded', sans-serif",
      "weight": 700,
      "size": 11,
      "ls": "-0.04em",
      "eyebrow": "Birthday Party",
      "title": "Bima Turns Thirty",
      "variant": "numeral",
      "numeral": "30",
      "numFont": "'Unbounded', sans-serif",
      "date": "Friday · 02 July 2027"
    }
  },
  {
    "slug": "decade",
    "name": "Decade",
    "cat": "Anniversary",
    "style": "Elegant",
    "mood": "Calm",
    "color": "Olive",
    "desc": "Olive and parchment with a fine double frame. Ten years, told simply.",
    "d": {
      "bg": "#47553F",
      "fg": "#EFE9DC",
      "accent": "#C9B98F",
      "font": "'Italiana', serif",
      "size": 11.5,
      "eyebrow": "Our Tenth Anniversary",
      "title": "Ten Years, Still Beginning",
      "sub": "Bram & Sekar",
      "variant": "frame",
      "date": "Sunday · 19 September 2027"
    }
  },
  {
    "slug": "aurum",
    "name": "Aurum",
    "cat": "Golden Anniversary",
    "style": "Luxury",
    "mood": "Elegant",
    "color": "Gold",
    "desc": "Gold on near-black for fifty years together. Ceremony-grade, without the glitter.",
    "d": {
      "bg": "#231D14",
      "fg": "#E2C27A",
      "accent": "#B8954A",
      "font": "'Italiana', serif",
      "size": 12,
      "eyebrow": "Golden Anniversary",
      "title": "Fifty Golden Years",
      "sub": "Hartono & Ratna",
      "variant": "ring",
      "date": "1977 — 2027"
    }
  },
  {
    "slug": "soiree",
    "name": "Soirée",
    "cat": "Private Event",
    "style": "Romantic",
    "mood": "Intimate",
    "color": "Cocoa",
    "desc": "Script lettering and cocoa tones for dinners, gatherings and evenings at home.",
    "d": {
      "bg": "#3B2B26",
      "fg": "#F0E2CF",
      "accent": "#C99A6B",
      "font": "'Pinyon Script', cursive",
      "size": 15,
      "eyebrow": "A Private Dinner",
      "title": "An Evening at Home",
      "variant": "photo",
      "photo": "radial-gradient(90% 60% at 30% 25%, rgba(255,214,170,.95), rgba(255,214,170,0) 60%), radial-gradient(80% 70% at 75% 80%, rgba(120,62,52,.9), rgba(120,62,52,0) 70%), linear-gradient(170deg, #D79F7E 0%, #8C5546 55%, #3A2221 100%)",
      "date": "Saturday · 30 October 2027"
    }
  },
  {
    "slug": "studio",
    "name": "Studio",
    "cat": "Brand Event",
    "style": "Modern",
    "mood": "Bold",
    "color": "Stone",
    "desc": "A clean grid, a red accent and room for your brand. Built for activations and open days.",
    "d": {
      "bg": "#E8E2D6",
      "fg": "#141414",
      "accent": "#C2412C",
      "font": "'Manrope', sans-serif",
      "weight": 600,
      "size": 12,
      "ls": "-0.05em",
      "eyebrow": "Brand Activation",
      "title": "Open Studio Weekend",
      "variant": "frame",
      "date": "24 — 25 July 2027"
    }
  },
  {
    "slug": "atlas",
    "name": "Atlas",
    "cat": "Product Launch",
    "style": "Modern",
    "mood": "Bold",
    "color": "Black",
    "desc": "Dark, precise and cinematic. A reveal page for the day your product enters the world.",
    "d": {
      "bg": "#121212",
      "fg": "#F3EEE6",
      "accent": "#E0875A",
      "font": "'Unbounded', sans-serif",
      "weight": 300,
      "size": 11,
      "ls": "-0.03em",
      "eyebrow": "Product Launch",
      "title": "Atlas, Unveiled",
      "variant": "cover",
      "photo": "radial-gradient(60% 50% at 40% 30%, rgba(255,228,170,.9), rgba(255,228,170,0) 60%), radial-gradient(80% 70% at 80% 80%, rgba(90,60,25,.95), rgba(90,60,25,0) 70%), linear-gradient(170deg, #C9A35E, #6B4A22 60%, #22180C)",
      "date": "Thursday · 10 June 2027 · 19.00"
    }
  },
  {
    "slug": "gilded-seal",
    "name": "Gilded Seal",
    "cat": "Wedding",
    "style": "Elegant",
    "mood": "Romantic",
    "color": "Ivory",
    "desc": "",
    "d": {
      "bg": "#F5EEE3",
      "fg": "#271F19",
      "accent": "#B08E52",
      "font": "'Cormorant Garamond', serif",
      "weight": 300,
      "size": 13,
      "eyebrow": "The Wedding Of",
      "title": "Adrian & Isabella",
      "variant": "arch",
      "photo": PHOTOS.blush,
      "date": "Saturday · 12 June 2027"
    }
  },
  {
    "slug": "we-do",
    "name": "We Do",
    "cat": "Wedding",
    "style": "Modern",
    "mood": "Romantic",
    "color": "Noir",
    "desc": "",
    "d": {
      "bg": "#F3F1EE",
      "fg": "#141414",
      "accent": "#B79D6E",
      "font": "'Cormorant Garamond', serif",
      "weight": 500,
      "size": 13,
      "eyebrow": "We Do",
      "title": "Rani & Dimas",
      "variant": "photo",
      "photo": PHOTOS.noir,
      "date": "Monday · 22 July 2030"
    }
  }
];

/**
 * A design that has a catalog manifest takes its marketing copy, category, palette label and thumbnail from it
 * (catalog/templates/<slug>/manifest.json, docs/17 §12); the rest keep the prototype's content and the phone mock.
 */
function withCatalog(t: Template): Template {
  const m = MANIFESTS[t.slug];
  if (!m) return t;
  const pal = PALETTES.find((p) => p.id === m.palette);
  return {
    ...t,
    name: m.name,
    cat: m.category,
    style: m.marketing.style,
    mood: m.marketing.mood,
    color: pal?.aliases[0] ?? pal?.name ?? t.color,
    desc: m.marketing.desc,
    live: hasLiveTemplate(t.slug),
    thumb: `/templates/${t.slug}/${m.thumbnail}`,
    thumbMobile: m.thumbnailMobile ? `/templates/${t.slug}/${m.thumbnailMobile}` : undefined,
  };
}

export const TEMPLATES: Template[] = RAW_TEMPLATES.map(withCatalog);

export const BY_SLUG: Record<string, Template> = Object.fromEntries(TEMPLATES.map((t) => [t.slug, t]));

export const CATEGORIES: Category[] = [
  {
    "name": "Wedding",
    "line": "The first day of a shared life.",
    "slug": "serenity",
    "bg": "#EFE7DA",
    "fg": "#2B2420"
  },
  {
    "name": "Engagement",
    "line": "A promise, made public.",
    "slug": "linen",
    "bg": "#D9DAD5",
    "fg": "#22272A"
  },
  {
    "name": "Seventeen",
    "line": "A new age, celebrated properly.",
    "slug": "velvet",
    "bg": "#2B1631",
    "fg": "#F4CFDA"
  },
  {
    "name": "Birthday",
    "line": "Another chapter, opened.",
    "slug": "chapter",
    "bg": "#16213A",
    "fg": "#ECE6D8"
  },
  {
    "name": "Anniversary",
    "line": "Years in, still beginning.",
    "slug": "decade",
    "bg": "#47553F",
    "fg": "#EFE9DC"
  },
  {
    "name": "Golden Anniversary",
    "line": "Fifty years, and still going.",
    "slug": "aurum",
    "bg": "#231D14",
    "fg": "#E2C27A"
  },
  {
    "name": "Private Celebration",
    "line": "Small gatherings, carefully hosted.",
    "slug": "soiree",
    "bg": "#3B2B26",
    "fg": "#F0E2CF"
  },
  {
    "name": "Brand Activation",
    "line": "Where a brand meets its people.",
    "slug": "studio",
    "bg": "#E8E2D6",
    "fg": "#141414"
  },
  {
    "name": "Product Launch",
    "line": "The day it enters the world.",
    "slug": "atlas",
    "bg": "#121212",
    "fg": "#F3EEE6"
  }
];

export const TIPS: Tip[] = [
  {
    "slug": "choose-design",
    "cat": "Design",
    "read": "4 min",
    "title": "How to choose the right invitation design",
    "excerpt": "Start with the feeling of the day, not the colour of the decor. A design should sound like the two of you before it looks like the venue."
  },
  {
    "slug": "what-to-include",
    "cat": "Essentials",
    "read": "5 min",
    "title": "What information should be included in a digital invitation?",
    "excerpt": "Names, date, time, venue and a clear way to reply. Then add only what helps guests arrive: a map, a dress code, a schedule."
  },
  {
    "slug": "when-to-send",
    "cat": "Timing",
    "read": "3 min",
    "title": "When should you send your invitation?",
    "excerpt": "Six to eight weeks ahead for most celebrations, longer for destination events. Send a save-the-date first if guests need to travel."
  },
  {
    "slug": "guest-experience",
    "cat": "Hosting",
    "read": "6 min",
    "title": "How to create a memorable guest experience",
    "excerpt": "The guest experience begins the moment the invitation opens. Small touches, like greeting each guest by name, set the tone early."
  },
  {
    "slug": "choosing-music",
    "cat": "Music",
    "read": "4 min",
    "title": "Choosing music for your digital invitation",
    "excerpt": "Pick something that loops gracefully and sits under the words. Instrumental pieces usually age better than this season’s hit."
  },
  {
    "slug": "personalized",
    "cat": "Personalization",
    "read": "5 min",
    "title": "How personalized invitations improve the guest experience",
    "excerpt": "A guest who sees their own name feels expected. Personal links also make replies easier to track and gently raise response rates."
  }
];

export const TIERS: Tier[] = [
  {
    "key": "essential",
    "name": "Essential",
    "price": "Rp 000K",
    "note": "For intimate celebrations.",
    "items": [
      "Selected essential templates",
      "Names, photos and event details",
      "RSVP collection",
      "One shareable link",
      "Email support"
    ]
  },
  {
    "key": "signature",
    "name": "Signature",
    "featured": true,
    "price": "Rp 000K",
    "note": "Everything in Essential, plus:",
    "items": [
      "The full template collection",
      "Personalized guest links",
      "Guest management",
      "Music, gallery and countdown",
      "Wishes and digital gifts",
      "WhatsApp sharing tools",
      "Priority support"
    ]
  },
  {
    "key": "custom",
    "name": "Custom",
    "price": "Let’s talk",
    "note": "For brands and one-of-a-kind events.",
    "items": [
      "A design made for your event",
      "Your brand colours and typography",
      "Custom domain",
      "Event analytics",
      "Dedicated support"
    ]
  }
];
