# UniQuest

UniQuest is an AI-assisted global university finder and scholarship advisor for international students. It turns an academic profile, language signal, budget, destination preferences, and document evidence into a transparent shortlist of source-linked study options.

## Demo

[Open the live UniQuest demo](https://8328-i6pcm0tfxf14e7n1oa9r9-7528532f.us5.manus.computer)

The demo runs on the managed preview environment and may be refreshed or unavailable outside the active project session.

## زبان فارسی / Persian language

UniQuest supports English and Persian modes. Use the `EN` / `FA` switch in the left navigation to change language without losing the local profile, saved shortlist, comparison state, or assessment progress. Persian mode applies RTL layout and translates the primary workspace navigation, shell controls, search placeholder, profile state, footer, and mobile drawer.

The data layer, official university source pages, programme names, scholarship names, and provider responses remain source-linked or provider-native. They are not translated or rewritten in a way that could change admission, fee, deadline, or scholarship meaning.

## Product highlights

- Responsive admissions intelligence workspace for desktop and mobile.
- English interface with Persian RTL direction switching.
- Multi-step student assessment for personal, academic, language, financial, destination, and intake preferences.
- Source-linked university matching with Safe, Good Match, Ambitious, and indicative evidence states.
- Scholarship finder with open, upcoming, and closed statuses.
- Deadline tracker with downloadable `.ics` calendar exports.
- Cost planner with tuition, living, insurance, visa-buffer, and budget-gap estimates.
- Comparison table for tuition, language, GPA, deadlines, funding, duration, and evidence status.
- Profile-aware admission assistant that discloses live-versus-fallback AI mode and never guarantees admission.
- Authenticated profile, transcript metadata, and favorite-shortlist persistence.
- Protected transcript upload boundary for Manus Storage and structured AI extraction review.
- Stripe sandbox integration with signature-verified, idempotent webhook event recording.

## Transparency by design

UniQuest does not claim guaranteed admission or fabricate acceptance probabilities. Each catalog record carries a source URL and a verification state: `Verified`, `Estimated`, or `Unconfirmed`. Tuition, deadlines, rankings, scholarship coverage, visa rules, and living-cost estimates must be confirmed on the official source page before an application or payment decision.

OCR output is treated as a draft for applicant review. Proof-of-funds requirements are shown separately from actual study costs. If an external provider is not configured, the UI reports the integration state rather than simulating success.

## Architecture

- **Client:** React 19, Vite, TypeScript, Wouter, Tailwind CSS, Lucide icons.
- **Server:** Express, tRPC, OAuth session hooks, protected procedures, Stripe webhook endpoint.
- **Data:** Drizzle ORM with a MySQL-compatible managed database.
- **Storage:** Manus Storage adapter for authenticated document uploads.
- **AI:** Built-in LLM adapter for transcript extraction and cautious admissions assistance.
- **Validation:** TypeScript checks, Vite/esbuild production build, Vitest tests, health endpoint, and route manifest.

Key API procedures include:

- `catalog.snapshot`
- `profile.get`
- `profile.saveDraft`
- `favorites.list`
- `favorites.set`
- `documents.uploadAndAnalyze`
- `assistant.ask`

## Local development

```bash
pnpm install
pnpm dev
```

The managed development server listens on port `3000` by default.

```bash
pnpm check
pnpm test
pnpm build
```

Database migrations are generated and applied with:

```bash
pnpm db:push
```

Configure provider secrets through the managed project configuration. Do not commit `.env` files, Stripe credentials, OAuth credentials, database URLs, or storage keys.

## Documentation

- [Architecture and integration notes](docs/architecture.md)
- [Development and deployment runbook](docs/runbook.md)
- [Implementation plan](plan.md)
- [Outcome checklist](TODO.md)

## Production follow-up

Before a public launch, connect an official-source ingestion and verification workflow, complete the email notification provider and scheduled reminder callback, map Stripe plans to server-side Checkout Sessions and entitlement webhooks, and expand the editable document-review flow to CVs, motivation letters, recommendation letters, graduation certificates, and research proposals.

## License

MIT
