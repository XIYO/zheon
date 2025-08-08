# Repository Guidelines

## Project Structure & Modules

- `src/`: SvelteKit app code
  - `routes/`: pages and server handlers (grouped as `(main)`, `(non-header)`)
  - `lib/components/`: reusable Svelte components (PascalCase, e.g., `Header.svelte`)
  - `lib/server/`: server utilities (kebab-case JS, e.g., `summary-service.js`)
  - `lib/types/`: shared types; `paraglide/` i18n runtime
- `static/`: public assets
- `tests/`: server/client tests; `e2e/`: Playwright tests
- `supabase/functions/`: Deno Edge Functions for backend logic
- Key config: `svelte.config.js` (Cloudflare adapter), `vite.config.js`, `wrangler.toml`

## Build, Test, Develop

- `pnpm dev`: run app locally (Vite dev server)
- `pnpm build` / `pnpm preview`: production build and local preview
- `pnpm check`: Svelte + TS checks with `jsconfig.json`
- `pnpm format` / `pnpm lint`: Prettier write; Prettier check + ESLint (Svelte + custom rules)
- `pnpm test`: run unit and E2E; `pnpm test:unit`, `pnpm test:e2e`
- Storybook: `pnpm storybook`, `pnpm build-storybook`
- Edge Functions: `pnpm edge:test:all`, `pnpm edge:check`, `pnpm edge:format`, `pnpm edge:lint`
- Deploy: `pnpm deploy` (wrangler deploy to Cloudflare)

## Style & Naming

- Prettier: tabs, single quotes, width 100, no trailing commas; Svelte and Tailwind class-order plugins.
- ESLint: `eslint-plugin-svelte`, `eslint-config-prettier`, custom `skeleton-ui/color-pairs` rule enforced.
- Naming: Components PascalCase (`*.svelte`); utilities kebab-case (`*-utils.js`, `*-service.js`); tests `*.test.{js,ts}` adjacent to code; E2E in `e2e/`.

## Testing

- Frameworks: Vitest (+ Testing Library for Svelte), Playwright.
- Locations: unit/component tests near sources or in `tests/`; E2E in `e2e/`.
- Commands: `pnpm test`, `pnpm test:unit -- --watch`, `pnpm test:e2e`.
- Details and helpers: see `TESTING.md`, `vitest-setup-client.js`, `playwright.config.js`.

## Commits & PRs

- Commit style: emoji + imperative summary (seen in history). Examples: `✨ Feature: ...`, `🔧 Fix: ...`, `🧪 Tests: ...`, `♻️ Refactor: ...`, `🚀 Perf/Deploy: ...`. Keep scope small.
- PRs: clear description, linked issues, screenshots for UI, test plan. Ensure `pnpm format`, `pnpm lint`, `pnpm test` pass and docs updated.

## Security & Config

- Do not commit secrets. Use `.env` and `supabase/.env.local` locally; set Edge secrets via `pnpm edge:secrets:set`.
- Cloudflare: review `wrangler.toml` routes and `adapter-cloudflare` output before deploy.
