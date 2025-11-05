# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

YouTube 영상 자막을 추출해 다국어 요약/인사이트를 제공하는 SvelteKit + Supabase 애플리케이션입니다. Cloudflare Workers에 배포되며, Edge Functions로 AI 요약 파이프라인을 구성합니다.

## Tech Stack

- **Frontend**: SvelteKit 2 (Svelte 5), Tailwind CSS 4, Skeleton UI
- **Backend**: Supabase (PostgreSQL + Edge Functions), Cloudflare Workers
- **Testing**: Vitest, Playwright, Deno Test
- **Language**: JavaScript with JSDoc (TypeScript 미사용)
- **Package Manager**: pnpm (npm 사용 금지)
- **i18n**: Paraglide.js

## Essential Commands

### Development

```bash
pnpm dev         # Dev server on http://localhost:7777
pnpm build       # Production build
pnpm preview     # Preview build on http://localhost:17777
```

### Code Quality

```bash
pnpm check       # Svelte + JS checks (via jsconfig)
pnpm format      # Prettier write
pnpm lint        # ESLint + Prettier check
```

### Testing

```bash
pnpm test        # All tests (unit + E2E)
pnpm test:unit   # Vitest unit/component tests
pnpm test:e2e    # Playwright E2E tests
```

### Deployment

```bash
pnpm deploy      # Deploy to Cloudflare Workers (zheon.xiyo.dev)
```

### Edge Functions (Supabase)

```bash
pnpm edge:test:all   # Run all Deno tests
pnpm edge:deploy     # Deploy functions to Supabase
pnpm edge:format     # Format Deno code
pnpm edge:lint       # Lint Deno code
pnpm edge:check      # Type-check Deno code
```

## Architecture & Key Patterns

### Authentication Flow

- Supabase Auth (email/password)
- Sessions via cookies using `@supabase/ssr`
- Protected routes validated in `hooks.server.js`
- `safeGetSession()` validates JWT via `getUser()` (never use `session.user` directly)

### Supabase Configuration

- **Schema**: `zheon` (not public)
- **Connection**: 모든 연결은 리모트 서버와 한다 (로컬 테스트 불필요)
- **Admin Client**: Available via `event.locals.adminSupabase` in server hooks
- **MCP**: supabase 관련은 supabase MCP를 꼭 사용하기

### Error Handling (Go-style)

```js
// Supabase Go 스타일 명시적 에러 처리
const { data, error: dbError } = await supabase.from('table').select('*');
if (dbError) throw error(500, dbError.message); // SvelteKit이 +error.svelte 자동 렌더링
return data; // 조회 결과 없음: 빈 배열 [] 반환 (null 아님)
```

### Remote Functions (SvelteKit Experimental)

- **SSR 데이터 로딩**: 이 앱은 SSR 앱으로, 데이터를 채워서 제공해야 함
  - 예전: universal load에서 데이터를 채워서 제공
  - 현재: remote functions로 데이터를 채워서 제공 (필수)

- **올바른 SSR await 패턴** (컴포넌트에서 직접 데이터 로드):

  ```js
  // 패턴 1: $derived + await (권장)
  import { getSubscriptions } from './data.remote';
  let data = $derived(await getSubscriptions({}));

  // 패턴 2: 마크업에서 직접 await
  {#each await getSubscriptions() as subscription}

  // 패턴 3: 동적 파라미터 (자동 리페치)
  import { page } from '$app/state';
  let post = $derived(await getPost({ id: page.params.id }));
  ```

- **잘못된 패턴** (사용 금지):

  ```js
  // ❌ load 함수 없이 data props 사용
  let { data } = $props(); // data가 undefined

  // ❌ $effect에서 query 호출 (SSR 동작 안함)
  $effect(() => {
  	getPost(params.id).then((data) => (summary = data));
  });
  ```

- **Query 캐싱**: 같은 쿼리는 자동 캐시 `getPosts() === getPosts()`, 수동 리프레시 `getPosts().refresh()`
- **query.batch**: 같은 macrotask 내 여러 호출을 자동으로 하나의 쿼리로 배칭 (n+1 해결)
- **서버-서버 호출**: Remote Functions는 서버에서 다른 Remote Function 호출 가능
- **waitUntil 패턴**: Cloudflare Workers에서 응답 후 백그라운드 처리
  - command: 프로그래매틱 호출용
  - form: HTML form 제출용

### Valibot Schema Validation

```js
// undefined 사용 원칙
v.optional(); // undefined만 허용, null 거부
v.nullable(); // null만 허용, undefined 거부
v.nullish(); // null + undefined 모두 허용

// Supabase upsert 시:
// - undefined: JSON에서 제거되어 기존 값 유지
// - null: JSON에 포함되어 기존 값을 NULL로 덮어씀
```

### 스키마 검증 원칙

- 스키마에 정의된 필드만 전달
- 함수 내부에서 자동 생성되는 필드는 스키마에서 제외
- 예: `updated_at`은 함수 내부에서 생성하므로 스키마와 호출 데이터에서 제외

### Async Components (Svelte 5)

- `svelte.config.js`에서 `experimental.async: true` 활성화
- 컴포넌트에서 top-level await 사용 가능

## Project Structure

```
src/
├─ routes/              # SvelteKit pages + API routes
│  ├─ (main)/           # Routes with header layout
│  └─ (non-header)/     # Routes without header (auth)
├─ lib/
│  ├─ components/       # Reusable Svelte components (PascalCase)
│  ├─ server/           # Server utilities (kebab-case)
│  ├─ types/            # TypeScript type definitions
│  │  └─ database.types.ts  # Supabase generated types
│  └─ paraglide/        # i18n runtime (auto-generated)
└─ hooks.server.js      # Auth middleware + Supabase clients

supabase/
├─ migrations/          # Database migrations
├─ functions/           # Deno Edge Functions (if any)
├─ tests/              # Deno tests
└─ config.toml         # Local Supabase config

messages/              # i18n message files (ko.json, en.json)
```

## Deployment Configuration

- **Platform**: Cloudflare Workers
- **Domain**: zheon.xiyo.dev
- **Adapter**: @sveltejs/adapter-cloudflare
- **Config**: `wrangler.toml` (routes, vars, assets)
- **Compatibility**: `nodejs_compat` flag enabled

## Development Ports

- Dev server: 7777
- Preview server: 17777
- Wrangler dev: 5170

## Important Notes

- Internationalization: Paraglide.js를 다국어용으로 사용 (messages/\*.json)
- Lucide icons: `@lucide/svelte` 사용 (lucide-svelte 금지)
- Performance measurement: `console.time()/timeEnd()` 사용 (performance.now() 금지)
- Chrome debugging (MCP): 크롬 실행 시 `--remote-debugging-port=9222` 필요
