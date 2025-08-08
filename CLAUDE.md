# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Zheon is a YouTube video summarization application built with SvelteKit, Supabase, and deployed on Cloudflare Workers. It processes YouTube videos to extract subtitles and generate AI-powered summaries in multiple languages.

## Development Commands

### Core Development

```bash
# Development server (http://localhost:5173)
pnpm dev

# Build for production
pnpm build

# Preview production build (http://localhost:4173)
pnpm preview

# Type checking and validation
pnpm check
pnpm check:watch

# Code formatting and linting
pnpm format          # Write prettier formatting
pnpm lint           # Check formatting and ESLint

# Testing
pnpm test           # Run all tests (unit + E2E)
pnpm test:unit      # Run Vitest unit tests
pnpm test:e2e       # Run Playwright E2E tests
```

### Supabase Edge Functions

```bash
# Test Edge Functions
pnpm edge:test:all  # Run all Deno tests

# Deploy Edge Functions
pnpm edge:deploy    # Deploy functions only
pnpm edge:deploy:with-secrets  # Deploy with environment variables

# Code quality
pnpm edge:format    # Format Deno code
pnpm edge:lint      # Lint Deno code
pnpm edge:check     # Type check Deno code

# Secrets management
pnpm edge:secrets:set   # Set environment variables
pnpm edge:secrets:list  # List configured secrets
```

### Deployment

```bash
# Deploy to Cloudflare Workers
pnpm deploy
```

## Architecture Overview

### Tech Stack

- **Frontend**: SvelteKit 2.x with Svelte 5
- **Styling**: TailwindCSS 4 + Skeleton UI (presets only)
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Deployment**: Cloudflare Workers
- **Testing**: Vitest + Playwright + Deno Test
- **Language**: JavaScript (not TypeScript)

### Project Structure

```
src/
├── routes/          # SvelteKit pages and API routes
│   ├── (main)/     # Routes with header layout
│   │   ├── dashboard/
│   │   └── summary/[id]/
│   └── (non-header)/  # Routes without header
│       └── auth/
├── lib/
│   ├── components/  # Reusable Svelte components (PascalCase)
│   ├── server/      # Server-side utilities (kebab-case)
│   └── paraglide/   # i18n runtime (auto-generated)
├── app.css         # Global styles with Skeleton UI theme
└── hooks.server.js # Authentication middleware

supabase/
├── functions/      # Deno Edge Functions
│   ├── _shared/    # Shared utilities (underscore prefix)
│   └── [function]/ # Individual function directories
├── migrations/     # Database migrations
└── tests/         # Deno test files
```

### Key Architectural Patterns

#### 1. Authentication Flow

- Supabase Auth with email/password
- Session management via cookies (using @supabase/ssr)
- Protected routes check authentication in hooks.server.js
- Sign in/out flows in auth routes

#### 2. Data Flow for Video Processing

1. User submits YouTube URL → dashboard/+page.server.js
2. Server validates URL and checks for existing summary
3. If no summary exists:
   - Call Supabase Edge Function `summary`
   - Edge Function extracts subtitles and generates AI summary
   - Store in database with user association
4. Return summary to client

#### 3. Database Schema

- `video_summaries` table stores processed videos
- Fields: id, user_id, youtube_url, title, summary, content, language, created_at
- Normalized YouTube URLs for deduplication
- User-specific summaries with same video support

#### 4. Server-Side Utilities Pattern

All server utilities follow consistent patterns:

- `*-utils.js`: Pure utility functions
- `*-service.js`: Business logic with external dependencies
- Error handling via custom error classes
- Validation utilities for form data

## Critical Implementation Details

### Supabase Integration

- Project ID: `iefgdhwmgljjacafqomd`
- Use `supabase.functions.invoke()` for Edge Function calls (not fetch)
- Environment variables set via Dashboard → Settings → Edge Functions → Secrets
- Direct production database usage (no local Supabase instance)

### Skeleton UI Styling

- Use ONLY Skeleton preset classes (defined in existing CLAUDE.md design section)
- Available presets: filled, tonal, outlined, glass, elevated, ghost, gradient
- Pattern: `preset-{type}-{color}-{shade}`
- Keep basic design minimal, apply varied styles only to hero sections

### Testing Strategy

- Unit tests: Adjacent to source files as `*.test.js`
- Component tests: Use Testing Library + Vitest
- E2E tests: In `e2e/` directory using Playwright
- Edge Functions: Deno tests in `supabase/tests/`
- Mock utilities available in `src/lib/test-utils.js`

### Form Handling

- All forms use native FormData with progressive enhancement
- Server-side validation in `+page.server.js` actions
- Client-side enhancements optional via `use:enhance`

### Error Handling

- Custom error utilities in `lib/server/error-utils.js`
- Consistent error page via `+error.svelte`
- User-friendly error messages with fallback to generic messages

### Internationalization

- Paraglide.js for i18n (messages in `messages/` directory)
- Runtime generated in `src/lib/paraglide/`
- Language detection based on user preferences

## Development Guidelines

### Code Style

- **Components**: PascalCase (`Header.svelte`)
- **Utilities**: kebab-case (`auth-utils.js`)
- **Prettier**: Tabs, single quotes, no trailing commas
- **ESLint**: Svelte plugin + custom Skeleton UI rules

### Commit Messages

Use emoji prefixes:

- ✨ Feature additions
- 🔧 Bug fixes
- ♻️ Refactoring
- 🧪 Test additions
- 📝 Documentation
- 🚀 Performance/deployment

### Security

- Never commit secrets (use .env locally)
- Set production secrets via Supabase Dashboard
- Validate all user inputs server-side
- Use Supabase RLS for data access control

## Common Development Tasks

### Adding a New Page

1. Create route in `src/routes/` with appropriate layout group
2. Add `+page.svelte` for UI
3. Add `+page.server.js` for data loading/actions
4. Use Skeleton UI presets for styling

### Creating an Edge Function

```bash
# Create new function
supabase functions new [function-name]

# Test locally
supabase functions serve [function-name] --no-verify-jwt

# Deploy
pnpm edge:deploy
```

### Running Tests for Specific Features

```bash
# Test specific file
pnpm test:unit -- auth-utils.test.js

# Test with pattern matching
pnpm test:unit -- --testNamePattern="validation"

# Run E2E test for specific feature
pnpm test:e2e dashboard.test.js
```

### Debugging Edge Functions

```bash
# Check logs in Dashboard
# Or use Chrome DevTools
supabase functions serve --inspect-mode brk
# Navigate to chrome://inspect
```

## Important Notes

- The project uses JavaScript with JSDoc types, not TypeScript
- Cloudflare Workers deployment via wrangler (see wrangler.toml)
- Production URL: zheon.xiyo.dev
- Always run `pnpm format` and `pnpm lint` before committing
- Test changes with both unit and E2E tests when applicable
