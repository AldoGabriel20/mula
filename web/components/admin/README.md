# Admin dashboard (`/app/*`)

A port of the Claude Design prototype `docs/dashboard-admin-prototype/Mula Admin v3.dc.html`.

| File | What it is |
| --- | --- |
| `admin.css` | The prototype's `<style>`, scoped under `.adm` (tokens stay in `app/globals.css`). |
| `logic.ts` | The prototype's logic class, brought over verbatim; edits are marked `// ADMIN:`. Holds the demo data for everything the API has no table for (other invitations, team, print presets, Mula AI, guide, gift methods). |
| `views/*.tsx` | The prototype's templates converted to JSX (`V` is the object `renderVals()` returns). Edit these by hand now; they are the source. |
| `AdminProvider.tsx` | Hosts the logic class, re-runs `renderVals()` per state change, derives the page from the URL. |
| `useAdminData.ts`, `mappers.ts` | Fetch the API (react-query) and map it onto the shapes the logic reads. |
| `patch.ts` | Overlays real numbers and API-backed handlers (add guest, RSVP, tasks, schedule, registry, live, check-in, publish, onboarding, settings, purchases) on the prototype's. |
| `PageHost.tsx`, `routes.ts` | One view per route; prototype page id → URL. |

The prototype's mock data is only used where the API has no equivalent. Fonts: `lib/fonts/prototype.ts` (the prototype's own files).
