# UniQuest runbook

## Start the project

```bash
pnpm dev
```

The app listens on the managed runtime port (`3000` by default). Preview uses the project host; do not hardcode an internal host in application links.

## Check and build

```bash
pnpm check
pnpm build
```

`pnpm db:push` generates and applies additive Drizzle migrations to the configured managed MySQL-compatible database. Development and publication share the project database, so review destructive schema changes before applying them.

## Required runtime capabilities

- Manus OAuth is enabled by the server capability and is the default application authentication.
- Managed database is enabled for profiles, document metadata, sources, favorites, applications, and subscriptions.
- Manus Storage is required for secure transcript persistence.
- Manus LLM is required for live transcript extraction and assistant responses; the app reports a transparent fallback when it is unavailable.
- Stripe should be enabled through project integrations before enabling paid checkout. Keep webhook verification and entitlement persistence on the server.
- Heartbeat / scheduled work should be registered only after a published callback exists.

## Product safety rules

Never label the fit bands as acceptance probabilities. Keep source URLs visible, preserve `Estimated` / `Unconfirmed` states, separate visa proof-of-funds rules from actual cost estimates, and require a manual review step for OCR output. A missing provider key is an integration state, not a reason to fabricate data.
