# Development

Practical commands and workflows for running, testing, and deploying Zheon.

## Quick Start

```bash
pnpm install
pnpm dev         # http://localhost:5170
```

## Core Commands

```bash
pnpm build       # Production build
pnpm preview     # Preview build at http://localhost:4173

pnpm check       # Svelte + JS checks (via jsconfig)
pnpm format      # Prettier write
pnpm lint        # ESLint + Prettier check

pnpm test        # All tests (unit + E2E)
pnpm test:unit   # Vitest unit/component tests
pnpm test:e2e    # Playwright E2E tests
```

## Edge Functions (Supabase)

See the complete CLI reference in `docs/supabase-cli.md`.

```bash
pnpm edge:test:all   # Run all Deno tests for functions
pnpm edge:format     # Format Deno code
pnpm edge:lint       # Lint Deno code
pnpm edge:check      # Type-check Deno code
pnpm edge:deploy     # Deploy functions
```

Environment/secrets for Edge Functions should be set in the Supabase Dashboard → Settings → Edge Functions → Secrets. Do not commit secrets.

## Deploy

Cloudflare Workers via Wrangler.

```bash
pnpm deploy
```

Review `wrangler.toml` routes and the `adapter-cloudflare` output before deploying.

## Conventions

- Components: PascalCase (e.g., `Header.svelte`)
- Server utilities: kebab-case (e.g., `summary-service.js`)
- Commit style: emoji + imperative summary (see `AGENTS.md`)

