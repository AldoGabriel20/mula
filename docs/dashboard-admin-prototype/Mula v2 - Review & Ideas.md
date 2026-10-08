# Mula v2 — review and product ideas

## Problems in v1
- **Generic SaaS look.** The pages were built from the same few parts: rounded card, eyebrow, serif title, buttons. The home page was a KPI-card dashboard.
- **Weak link to the logo.** The arch and the taupe dot appeared only in the logo. Accent colours (moss, amber, clay) came from status needs, not from the brand.
- **Logo issue.** The logo PNG had a solid ivory background and relied on `multiply`, so it broke on any other surface and could never work in dark mode.
- **Repetitive pages.** Events, Gift, Add-ons and Usher were all lists of cards. Nothing marked a page as editorial, operational or immersive.
- **Static.** No entrance motion, the number counts and the progress ring didn't animate, and the preview was a flat frame.
- **Standard features.** Guests, RSVP, gift and QR are what every invitation product offers. Nothing told the host what to do or why.
- **Navigation.** The menu was 17 items in four groups, organised by system module rather than by what the host is trying to do.

## Design language: built from the logo
- **The arch** stands for a threshold or beginning. It is used for the readiness meter, arched image frames, the guest-journey connectors and the invitation opening.
- **The dot** stands for you, here, now. It marks the active nav item, "today" on the timeline, the selected state and the brand accent.
- **Palette:** logo ivory `#F5F3EE`, logo ink `#272523`, dot taupe `#A69A89`, plus a text-safe deep taupe `#7A6E5E`. Status colours are muted and only used for status.
- **Dark mode** uses a warm near-black `#12110F` with ivory ink and a brighter dot. It gets its own logo artwork (transparent ivory lockup).

## Ten product ideas (★ = built)
1. ★ **Mula Notes (event assistant).** Plain-language suggestions with one-tap actions. Example: "18 guests opened but haven't replied."
2. ★ **Readiness Arch.** One score built from nine parts (invitation, guests, RSVP, schedule, gift, seating, check-in, live stream, final checks). Each part links to its fix.
3. ★ **Guest journey.** Sent → Opened → Replied → Reminder → Event day → Thank you, with counts and arch connectors.
4. ★ **Smart segments.** Not opened, Opened · no reply, VIP, Plus-ones, Needs follow-up. Each segment comes with an action.
5. ★ **Event timeline.** From today to the event and after, with completed tasks landing on the line.
6. ★ **Shared workspace.** Co-host, planner, family and usher roles, with team presence and activity.
7. ★ **Preview perspectives.** Guest view and host view; personalised per guest; mobile, tablet and desktop.
8. ★ **Event-day mode.** Arrivals, check-ins, ushers, stream status and alerts, with a rehearsal simulation.
9. ★ **Memories.** The invitation becomes a keepsake: wishes now, photos and attendance after the event.
10. ★ **Live onboarding.** The invitation builds itself as you answer, and wording adapts to the event type.
11. Seating planner with drag-to-table. Left out for now because it needs table data the backend may not have.
12. Thank-you composer that sends personalised notes to attendees after the event.
13. Multi-event switcher for hosts and planners running several celebrations. A light version is built in the sidebar.

All ideas use existing data: guests, RSVP status, events, tasks, invitation sections, transactions and ushers. Delivery/open status assumes the backend already tracks invitation views; if it doesn't, those views can be hidden.
