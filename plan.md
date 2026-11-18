# UniQuest — Implementation & Design Plan

## Product approach

UniQuest will be a data-transparent international admissions workspace: a student completes a structured profile, receives an indicative matching assessment, then turns the results into a shortlist, budget plan, scholarship watchlist, and deadline calendar. The first delivered slice prioritizes the real student journey and honest data provenance over decorative breadth. All recommendation, fee, scholarship, and deadline records carry a source URL, verification state, and last-checked date. No part of the UI will imply guaranteed admission or fabricate current facts.

The existing web-db-user starter is retained: React + Vite frontend, Express/tRPC backend, Drizzle/MySQL-compatible managed database, Manus OAuth session support, and Manus object storage helpers. Business tables will extend the existing users table. The app will use an adapter boundary for official university feeds, scholarship sources, OCR/LLM transcript analysis, email/calendar providers, and Stripe so missing provider credentials are visible configuration gaps rather than simulated success.

## Design direction

Three style directions considered:
- **Global Academic Editorial** — 0.06 probability: a calm, editorial university intelligence workspace with map-blue accents and paper-like surfaces.
- **Civic Atlas** — 0.04 probability: a public-service inspired research portal with strong wayfinding and provenance labels.
- **Quiet Luxury Admissions** — 0.07 probability: a warmer, high-touch counselor feel with premium cards and soft neutrals.

**Chosen: Global Academic Editorial.**

### Design Movement
Swiss editorial information design translated into a modern international education dashboard: precise hierarchy, generous margins, restrained color, and data that reads before it decorates.

### Core Principles
1. **Clarity before confidence** — every score is accompanied by its basis and source state.
2. **Forward motion** — every screen ends with a next action: complete a profile, save a match, verify a fact, or prepare a deadline.
3. **Human scale** — dense decision data sits beside short, reassuring explanations rather than anonymous tables.
4. **International by default** — country, language, currency, and scholarship context are treated as first-class data.

### Color Philosophy
Ink navy communicates institutional trust; a saturated atlas blue is UniQuest’s ownable signal color for links, progress, and active intelligence; mint marks positive fit without pretending certainty; sand and parchment neutrals make the interface feel like a well-edited briefing rather than a fintech terminal. Coral is reserved for deadline urgency and data gaps.

### Layout Paradigm
A left rail anchors the workspace while the content canvas uses an editorial split: a wide primary briefing column and a narrower evidence / action column. Search and profile context stay persistent at the top. On mobile, the rail becomes a compact bottom action bar and the evidence column folds into stacked cards.

### Signature Elements
- **Atlas mark:** a small four-point compass / open-book glyph next to the UniQuest wordmark.
- **Evidence chips:** compact status labels such as Verified, Estimated, and Check source, always paired with a last-checked date.
- **Match bands:** Safe, Good match, and Ambitious are shown as horizontal confidence bands, never fake percentages.

### Interaction Philosophy
Interactions should feel like an advisor handing over a well-organized dossier. Forms are progressive and save-as-you-go. Results explain their “why” in place. Comparison and budget actions preserve the student’s context rather than opening disconnected pages.

### Animation
Use quiet 160–220ms fades and lift-on-hover for cards; match bands animate once on load; avoid loops and bouncing. Toasts should confirm persistence, not celebrate uncertain admissions. Respect reduced-motion preferences.

### Typography System
Use a clean sans stack with a slightly human display face: `DM Sans` for interface text and `Newsreader` for large editorial statements. Headings are sentence case with tight line-height; labels use small caps / 11–12px uppercase sparingly; body copy stays 14–16px and readable.

### Brand Essence
**The transparent shortlist engine for students planning an international future.** Personality: rigorous, warm, globally minded.

### Brand Voice
Headlines are direct and useful: “Turn your profile into a realistic shortlist.” CTAs are specific: “Build my shortlist” and “Review evidence.” Avoid guarantees, hype, and empty “unlock your dreams” language.

### Wordmark & Logo
A compact compass-open-book symbol: four points form an atlas compass while the lower negative space reads as an open book. The wordmark is set in a restrained sans with a blue square marker used as a recurring anchor.

### Signature Brand Color
Atlas Blue `#2F6BFF` — vivid enough to guide a decision, disciplined enough to sit beside institutional navy.

## Functional architecture

### Frontend
- `client/src/App.tsx`: route shell and global providers.
- `client/src/pages/Home.tsx`: main advisor workspace with dashboard, assessment, matches, scholarships, deadlines, comparison, costs, assistant, and profile views handled through a local view state so the primary workflow remains fast in Preview.
- `client/src/components/`: reusable UI primitives from the starter plus product-specific cards and navigation.
- `client/src/index.css`: design tokens, responsive layout, editorial surfaces, RTL support, reduced-motion rules.
- `public/manus-routes.json`: route manifest for `/`, `/404`, and future dashboard paths.

### Backend
- `server/routers.ts`: tRPC procedures for dashboard data, profile assessment, matches, scholarships, deadlines, document metadata, and plan entitlements.
- `server/db.ts`: typed data access helpers with a safe no-database fallback for public preview and clear logging when persistence is unavailable.
- `server/integrations/`: adapters for LLM/OCR, official data providers, notifications, calendar export, and Stripe. Adapters return source/verification metadata and integration state.
- `server/storage.ts`: existing presigned object storage helper for transcript and document assets.
- `server/_core/index.ts`: health, platform config, OAuth, tRPC, and scheduled callback endpoints.

### Data model
Add tables for `studentProfiles`, `documents`, `universities`, `programs`, `scholarships`, `deadlines`, `savedItems`, `applications`, `subscriptions`, and `integrationSources`. Use JSON/text columns for evolving AI extraction payloads, but retain source URL, verification status, last verified timestamp, ownership, and lifecycle fields as first-class columns. Migration is additive and deterministic.

### Matching model
The first implementation uses a rules-and-evidence scorer: degree/field fit, language fit, budget fit, deadline readiness, and funding fit each contribute explainable signals. It returns Safe / Good Match / Ambitious / Not Eligible categories with a note that the result is an AI-based indicative assessment, not an official acceptance probability. A provider adapter can later add LLM ranking or live search without changing the UI contract.

### Integrations and safety
Use Manus OAuth for authentication, managed database for durable records, Manus storage for private uploads, the built-in LLM surface for transcript/matching explanation, Stripe only after the integration is enabled, and scheduled work for reminders/data refreshes. Until provider credentials and official feeds are configured, UI labels must say “integration required” or “not confirmed” instead of simulating live results or payment success.

## Project structure

```text
client/src/
  components/ui/        starter primitives
  pages/Home.tsx        UniQuest workspace
  App.tsx               routing and providers
  index.css             tokens and responsive product styling
server/
  _core/                runtime, auth, tRPC context, Vite
  integrations/         external API boundaries
  db.ts                 database access
  routers.ts            typed API surface
  storage.ts            durable document storage
  seed-data.ts           source-linked preview records
  schema.ts              (drizzle lives at project root)
drizzle/
  schema.ts             application tables and types
  migrations/           generated additive migrations
public/
  manus-routes.json     managed route manifest
  assets/               generated product imagery
```

## Delivery slice

1. Implement the responsive UniQuest advisor shell and high-signal dashboard with empty-state-safe copy.
2. Add a multi-step assessment drawer/form with profile persistence through tRPC when authenticated and local draft fallback otherwise.
3. Add explainable matches, scholarship cards, deadlines, cost planning, comparison selection, and chat-style assistant UI using source-linked preview records and clear verification labels.
4. Add schema, routers, integration boundaries, upload metadata, plan gating, and callback stubs needed for the next live-data iteration.
5. Validate TypeScript/build, route manifest, health endpoint, and responsive layout; checkpoint the working version to `origin/main`.
