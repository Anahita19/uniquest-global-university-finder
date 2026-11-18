# UniQuest architecture and integration notes

## What is working in this checkpoint

The project is a React/Vite + Express/tRPC + Drizzle/MySQL-compatible application using the managed web-db-user starter. The main workspace is responsive and includes the assessment flow, profile draft persistence, source-linked match records, Safe / Good match / Ambitious filtering, scholarship finder, deadline tracker, cost planner with currency display, comparison table for up to five programs, AI assistant surface, evidence labels, and English/Persian direction switching.

Guest users keep a local draft in `localStorage`. Authenticated users use Manus OAuth and can save the profile through `profile.saveDraft`. The database migration adds `student_profiles`, `documents`, `catalog_sources`, `favorites`, `applications`, and `subscriptions` alongside the starter `users` table. Transcript uploads for authenticated users go through the protected `documents.uploadAndAnalyze` procedure, Manus Storage, and the built-in LLM adapter when those runtime capabilities are configured; otherwise the UI explicitly reports that secure storage is required and preserves the local draft.

## tRPC surface

- `catalog.snapshot` returns source-linked preview records, scholarships, deadline records, destination countries, and the catalog metadata banner.
- `profile.get` returns the authenticated student's profile row.
- `profile.saveDraft` upserts the structured profile and the full JSON profile payload.
- `documents.uploadAndAnalyze` accepts PDF/JPG/PNG transcript bytes for authenticated users, uploads them through Manus Storage, stores metadata, and requests structured extraction for review. Extracted fields are not silently applied as final facts.
- `assistant.ask` calls the built-in LLM with student context and the current source-linked catalog. It falls back transparently when the runtime AI service is unavailable.

The frontend reads these APIs through the existing tRPC client at `/api/trpc`. OAuth stays on the starter routes and uses the required `webdev_app_session` compatibility cookie.

## Data source policy

`shared/seed.ts` is intentionally conservative preview data: university and scholarship names point to official source pages and every record carries `Verified`, `Estimated`, or `Unconfirmed` plus `lastVerified`. Tuition, deadlines, rankings, and admission requirements are not presented as guaranteed current facts. Before production recommendations, populate `catalog_sources` from an official-source ingestion job and require a verification timestamp before changing a value to `Verified`.

Recommended production adapters:

1. Official university admissions and programme pages, fetched through a controlled ingestion job with manual correction in the admin workspace.
2. Official scholarship portals: DAAD, Erasmus Mundus catalogue, Stipendium Hungaricum, Chevening, Fulbright, Swedish Institute, OeAD, and Italian regional portals.
3. Government immigration sources for proof-of-funds and visa rules, kept separate from actual living costs.
4. Recognized ranking sources, with ranking organization and year stored independently from programme fit.

No record should be inserted into the recommendation engine without `sourceUrl`, `verificationStatus`, and `lastVerifiedAt`.

## Scheduled work

The next production step is to register a Heartbeat job against `/api/scheduled/deadline-reminders` after publication. The callback should verify the scheduler JWT, resolve the saved task identity, query upcoming `deadlines`, and send idempotent email notifications using a durable notification log. Calendar export can use the existing deadline rows to produce `.ics` files without treating calendar visibility as proof that a student submitted an application.

## Payments

Subscription records are in the database and the UI distinguishes the Free workspace. Use the managed Stripe integration for sandbox provisioning, then create server-side Checkout Sessions tied to the authenticated user, store only Stripe identifiers and entitlement state, and grant PRO/PREMIUM access only from verified webhook events. Never store card data or trust a Checkout return URL as payment proof. The provider can be swapped by keeping the plan/entitlement interface separate from payment-provider adapters.

## Deployment

Development: `pnpm dev` on port 3000. Typecheck: `pnpm check`. Production build: `pnpm build`, which emits `dist/public` and `dist/index.js`. The managed health endpoint is `/api/health`; `public/manus-routes.json` is served from `client/public/manus-routes.json`. The managed project already has server and database enabled. Configure provider secrets through the managed configuration surface, not committed `.env` files.
