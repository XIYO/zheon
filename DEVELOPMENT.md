# Development Guide

## Prerequisites

- Node.js 18+ or Bun runtime
- Docker & Docker Compose (optional)

## Setup

```bash
# Install dependencies
bun install

# Configure environment variables
cp .env.sample .env
# Edit .env and add your API keys

# Start development server
bun run dev
```

Development server runs on http://localhost:7777

## Scripts

```bash
bun run dev          # Start dev server
bun run build        # Build for production
bun run preview      # Preview production build
bun run check        # Type check
bun run lint         # Lint code
bun run format       # Format code
bun run test         # Run all tests
bun run test:unit    # Run unit tests
bun run test:e2e     # Run E2E tests
```

## Tech Stack

- **Frontend**: SvelteKit 2, Svelte 5, Tailwind CSS 4, Skeleton UI
- **Backend**: Supabase (PostgreSQL, Realtime)
- **AI**: Gemini API
- **Language**: TypeScript
- **Package Manager**: Bun
- **Testing**: Vitest, Playwright
