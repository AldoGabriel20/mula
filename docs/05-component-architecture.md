# 05 — Component Architecture

Components identified across both prototypes. Each is a CSS-module React component (no Tailwind). Primitives match the recovered `ds_*` classes (see `03`). Props below are the production contract; "API" names the data dependency from `08`.

Conventions: `className` passthrough + `cva`-free variant unions (plain string unions — no extra dep). Server data arrives already fetched (React Query) and is passed as props; components stay presentational where possible.

---

## Shared / primitives (`components/ui/`)

| Component | Responsibility | Key props | Variants | Motion | API |
| --- | --- | --- | --- | --- | --- |
| `Button` | pill action | `variant`, `size`, `as`, `loading`, `disabled` | `primary \| default \| ghost` | magnetic (fine pointer) | — |
| `Input` / `Textarea` / `Select` | form fields | `value`, `onChange`, `error`, `label`, `name` | — | — | — |
| `Chip` | tag / filter | `active`, `onClick` | static / button | — | — |
| `Modal` | dialog | `open`, `onClose`, `title` | — | backdrop fade + panel spring | — |
| `Toast` | transient notice | `kind`, `message` | ok/warn/error/info | slide-in | — |
| `Dropdown` / `Menu` | menus (profile, sort) | `items`, `trigger` | — | — | — |
| `Tooltip` | hint | `label` | — | — | — |
| `Skeleton` | loading placeholder | `width`, `height`, `lines` | — | shimmer (reduced-motion aware) | — |
| `EmptyState` | no-data | `title`, `action`, `illustration` | — | — | — |
| `ErrorState` | error + retry | `message`, `onRetry` | — | — | — |
| `Reveal` | scroll-reveal wrapper | `wait`, `as` | — | IntersectionObserver fade/rise | — |
| `Magnetic` / `Tilt` | hover wrappers | `strength` | — | pointer tracking | — |
| `ArchMeter` | brand arch progress ring | `value` (0–100), `segments` | — | animated draw | readiness |
| `Dot` | brand dot marker | `active` | — | — | — |
| `Logo` | theme-aware lockup/symbol | `variant`, `theme` | lockup / symbol | — | — |
| `ThemeToggle` | light/dark switch | — | — | — | persists to `localStorage` + `data-theme` |
| `LocaleSwitcher` | language | `locale`, `locales` | — | — | next-intl |

## Marketing (`components/marketing/`)

| Component | Responsibility | Props | API |
| --- | --- | --- | --- |
| `MarketingShell` | header + footer frame | `children` | — |
| `MarketingHeader` (`MulaNav`) | sticky blurred nav, CTAs, skip-link | `locale` | — |
| `MarketingFooter` (`MulaFooter`) | links, legal, lockup | — | — |
| `Hero` | hero copy + 3D invitation mount | `onPhase` | — |
| `InvitationCanvas` | lazy three.js mount (`mode`, `layout`, `onPhase`), poster fallback | `mode`, `poster` | — |
| `FeatureShowcase` | feature grid | `features` | static |
| `TemplateShowcase` / `TemplateCard` | template gallery + card | `templates`, `filters` | `GET /templates` |
| `TemplateDetail` | single template preview | `template` | `GET /templates/{slug}` |
| `PricingTable` | plan tiers | `plans` | `GET /packages` |
| `ArticleList` / `ArticleDetail` | tips | `articles` / `article` | `GET /tips[...]` |
| `InspirationGallery` | editorial grid | `items` | static/CMS |
| `ContactForm` | contact | — | `POST /contact` |
| `CTA` | conversion band | `href`, `label` | — |

## Auth (`components/auth/`)

| Component | Responsibility | API |
| --- | --- | --- |
| `AuthCard` | centered auth panel frame | — |
| `LoginForm` | email/password sign-in | `POST /auth/login` |
| `RegisterForm` | sign-up | `POST /auth/register` |
| `ForgotForm` | request reset | `POST /auth/password/forgot` |
| `ResetForm` | set new password (token) | `POST /auth/password/reset` |
| `VerifyNotice` | email verification state | `POST /auth/verify` |

All forms: `react-hook-form` + `zod` via `@hookform/resolvers`. Shared validation schemas live in `lib/validation` and mirror server rules.

## Dashboard shell (`components/app/`)

| Component | Responsibility | Props | API |
| --- | --- | --- | --- |
| `AppShell` / `DashboardLayout` | sidebar + topbar + content | `children` | — |
| `Sidebar` | grouped nav (by host goal), active dot, celebration switcher | `nav`, `currentEventId` | `GET /events` |
| `CelebrationSwitcher` | multi-event switch | `events`, `current` | — |
| `Topbar` | search, "working on now", Mula AI, theme, updates, locale, profile, preview button | `user` | `GET /me` |
| `PreviewPanel` | guest/host preview, device sizes, per-guest personalisation | `invitation`, `perspective`, `device` | `GET /events/{id}/invitation` |
| `MulaNotes` | assistant suggestions + one-tap actions | `notes` | `GET …/overview` |
| `ReadinessArch` | nine-part readiness score (uses `ArchMeter`) | `parts` | `GET …/overview` |

## Dashboard feature components

| Component | Page | Responsibility | API |
| --- | --- | --- | --- |
| `GuestJourney` | overview | Sent→…→Thank-you with counts + arch connectors | overview |
| `SmartSegments` | overview/guests | segment cards with actions | guests/segments |
| `EventTimeline` | overview/schedule | today→event→after, tasks land on line | schedule |
| `GuestTable` | guests | search, sort, select, groups, per-row actions | guests |
| `GuestEditor` | guests | add/edit guest, group, plus-ones | guests |
| `InvitationEditor` | design | section list, reorder, per-section toggle, content language | invitation |
| `PalettePicker` | design | choose palette | invitation/templates |
| `TemplateChooser` | design | pick template | templates |
| `SectionEditor` | design | edit one invitation section | invitation |
| `TaskList` | tasks | priority, done toggle, add/remove, counter | tasks |
| `ScheduleEditor` | schedule | reorder, add-to-calendar | schedule |
| `TeamMembers` | team | roles, presence, activity, invite | members |
| `CheckinBoard` | checkin | arrivals, check-in actions | checkin |
| `EventDayConsole` | eventday | arrivals, ushers, alerts, rehearsal | eventday |
| `LivePanel` | live | stream status/config | live |
| `GiftRegistry` / `TransactionList` | gift | registry + transactions | gifts |
| `MemoriesBoard` | memories | wishes + photos | wishes/media |
| `PrintPanel` | print | printable outputs/export | invitation |
| `PackageGrid` / `AddonGrid` | packages/addons | selection | packages/addons |
| `BillingPanel` | billing | subscription + invoices | billing |
| `SettingsSections` | settings | appearance/language/notifications/profile/security/purchases/referral | me/preferences |
| `OnboardingFlow` | onboarding | progressive invitation build, event-type adaptive wording | events/invitation |

## Public invitation (`components/invite/`)

| Component | Responsibility | API |
| --- | --- | --- |
| `InvitationView` | rendered published invitation (sections, theme, 3D opening) | `GET /invite/{token}` |
| `RsvpForm` | guest RSVP | `POST /invite/{token}/rsvp` |
| `WishForm` | guest wish/message | `POST /invite/{token}/wish` |
| `AddToCalendar` | calendar links (native `.ics` generation, no dep) | — |
| `GiftInfo` | gift details for guests | invite payload |

---

## Composition principles

- The production app **must not** paste prototype HTML into one giant component. Each prototype section maps to a named component above.
- Server state via React Query; local UI state via component state / lightweight context (celebration selection, theme). No heavy global store needed — **no Redux/Zustand** added.
- The `InvitationView` is shared in spirit between `PreviewPanel` (host) and `/invite/[token]` (guest) — extract a common renderer taking a normalized invitation model + perspective.
