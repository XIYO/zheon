# Architecture

This document describes Zheon’s system architecture, technology stack, key patterns, and core data flows.

## Tech Stack

- Frontend: SvelteKit 2.x (Svelte 5)
- Styling: Tailwind CSS 4 + Skeleton UI presets
- Backend: Supabase (PostgreSQL + Edge Functions)
- Deployment: Cloudflare Workers (adapter-cloudflare)
- Testing: Vitest, Playwright, Deno test (for Edge Functions)
- Language: JavaScript with JSDoc (no TypeScript)

## Project Structure

```
src/
├─ routes/              # SvelteKit pages + API routes
│  ├─ (main)/           # Routes with header layout
│  │  ├─ dashboard/
│  │  └─ summary/[id]/
│  └─ (non-header)/     # Routes without header
│     └─ auth/
├─ lib/
│  ├─ components/       # Reusable Svelte components (PascalCase)
│  ├─ server/           # Server utilities (kebab-case)
│  └─ paraglide/        # i18n runtime (generated)
├─ app.css              # Global styles
└─ hooks.server.js      # Auth middleware

supabase/
├─ functions/           # Deno Edge Functions
│  ├─ _shared/          # Shared utilities
│  └─ [function]/       # Individual functions
├─ migrations/          # Database migrations
└─ tests/               # Deno tests
```

## Key Architectural Patterns

### 1) Authentication Flow

- Supabase Auth (email/password)
- Sessions via cookies using `@supabase/ssr`
- Protected routes validated in `hooks.server.js`

### 2) Video Processing Data Flow

1. User submits a YouTube URL from `dashboard/+page.server.js`.
2. Server validates the URL and checks for an existing summary.
3. If none exists, call Supabase Edge Function `summary` which:
   - Extracts subtitles/metadata
   - Generates AI summary/insights
   - Stores results in DB
4. Return result to client and render.

### 3) Database Schema (high level)

- `video_summaries`
  - id, user_id, youtube_url, title, summary, content, language, created_at
  - Normalized YouTube URL for deduplication
  - User-specific summaries (same video allowed across users)

### 4) Server Utilities Pattern

- `*-utils.js`: Pure utilities
- `*-service.js`: Business logic with external deps
- Validation and error utilities for consistent server actions

## Internationalization

- Paraglide.js for runtime i18n
- Messages under `messages/`, runtime in `src/lib/paraglide/`

## Error Handling

- Custom error helpers (see `lib/server/*-utils.js`)
- `+error.svelte` provides consistent user-facing errors

## Notes

- Keep UI minimal; apply Skeleton presets selectively (hero/cta)
- Prefer streaming/edge-friendly APIs to fit Cloudflare Workers limits

