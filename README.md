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
- `catalog.search`
- `profile.get`
- `profile.saveDraft`
- `favorites.list`
- `favorites.set`
- `documents.uploadAndAnalyze`
- `assistant.ask`

## Optimized API usage

The application uses tRPC procedures over the Express server. The optimized paths below are public procedures and can be called through the generated tRPC client or through the HTTP endpoint exposed by the tRPC adapter.

### University search: `catalog.search`

Use `catalog.search` for interactive search instead of downloading the entire catalog and filtering it in the browser.

```ts
const result = await trpc.catalog.search.query({
  query: "computer science",
  limit: 20,
});

// result.query   -> normalized query
// result.total   -> total number of matching records
// result.matches -> bounded ProgramMatch[] result set
```

The input contract is:

```ts
{
  query: string; // optional in practice, maximum 120 characters
  limit?: number; // 1–50, defaults to 20
}
```

Search is normalized by trimming surrounding whitespace, collapsing repeated spaces, and applying case-insensitive matching across the university name, programme name, country, and field of study. Results are limited on the server before they reach the client. The UI waits approximately 180ms after the last keystroke before requesting results and keeps the previous result set during a refresh. Client query data is considered fresh for 30 seconds.

An empty query returns the bounded catalog for the requested limit. Use `catalog.snapshot` only when the dashboard needs the related scholarships, deadlines, countries, and catalog metadata as one initial payload.

### AI admissions assistant: `assistant.ask`

Use `assistant.ask` for profile-aware admissions guidance. The request language must be `en` or `fa`; omitted language defaults to English for backward compatibility.

```ts
const response = await trpc.assistant.ask.mutate({
  language: "fa",
  question: "از کدام گزینه برای شروع استفاده کنم؟",
  profile: {
    degreeLevel: "Master's Degree",
    fieldOfStudy: "Computer Science",
    gpa: "3.55",
    languageTest: "IELTS Academic",
    languageScore: "7.0",
    annualBudget: "18000",
    budgetCurrency: "EUR",
    preferredCountries: ["Germany", "Netherlands"],
  },
});

// response.answer
// response.sourceIds
// response.integrationStatus
```

The assistant does not send the complete catalog to the model. It ranks a compact set of up to four source-linked programmes using field, preferred-country, fit-score, tuition, deadline, and language signals. The model receives only that reduced context plus the submitted profile and question. The token budget is capped at 320 for quicker responses.

Identical requests are cached in memory for five minutes using language, normalized question, and profile as the cache key. Concurrent identical requests share one in-flight model call. The cache is bounded to 100 entries and is process-local; it is an optimization, not durable conversation storage. A deployment with multiple server instances should add a shared cache only if cross-instance deduplication is required.

If the AI provider is unavailable or returns no usable text, the procedure returns a transparent English or Persian fallback. The fallback is not an admission probability and explicitly directs the user to verify official fees, language requirements, deadlines, and programme pages.

### Performance and safety rules

- Keep search queries short and use the server-side `limit`; do not request 50 records for every autocomplete event.
- Debounce user input before calling `catalog.search`.
- Include the selected `language` in every `assistant.ask` request so cached responses cannot cross language boundaries.
- Do not treat `fitScore`, Safe, Good match, or Ambitious labels as official acceptance probabilities.
- Keep source URLs and verification states visible in any client that consumes these procedures.
- Never place provider credentials or database URLs in browser code.

The optimization suite is covered by server tests for query normalization, result limits, language-specific prompts, fallback behavior, cache hits, concurrent request deduplication, and unsupported-language rejection.

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
