# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. The code is the source of truth; this document reflects the current implementation.

## Project Overview

YouTube 영상 자막과 댓글을 수집해 요약/인사이트를 제공하는 SvelteKit + Supabase 애플리케이션입니다.

## Tech Stack

- **Frontend**: SvelteKit 2 (Svelte 5), Tailwind CSS 4, Skeleton UI
- **Backend**: Supabase (PostgreSQL)
- **Testing**: Vitest, Playwright
- **Language**: TypeScript
- **Package Manager & Runtime**: Bun (개발/런타임 모두 Bun 사용)

### TypeScript Guidelines

- **타입 추론 우선**: TypeScript가 자동으로 타입을 추론하게 하여 최대한 간결하게 작성
- **명시적 타입**: 타입 추론이 불가능하거나 명확하지 않을 때만 명시적으로 표기
- **함수 파라미터**: 타입 명시 필수
- **함수 반환 타입**: 추론 가능하면 생략
- **변수 선언**: 초기값으로 타입 추론 가능하면 타입 생략

### Svelte Guidelines

- **TypeScript 필수**: 모든 Svelte 파일은 반드시 `<script lang="ts">` 사용
- **JSDoc 금지**: JSDoc 대신 TypeScript 타입 명시만 사용
- **타입 안전성**: 모든 props와 변수는 명확한 타입 정의

## Essential Commands

### Development

```bash
bun run dev         # Dev server on http://localhost:7777
bun run build       # Production build
bun run preview     # Preview build on http://localhost:17777
```

### Code Quality

```bash
bun run check       # Svelte + JS checks (via svelte-check)
bun run format      # Prettier write
bun run lint        # ESLint + Prettier check
```

### Testing

```bash
bun run test            # All tests (unit + E2E)
bun run test:unit       # Vitest unit/component tests
bun run test:e2e        # Playwright E2E tests
bun run test:integration # Integration tests
```

### Deployment

```bash
bun run build       # Build for production
```

## Architecture & Key Patterns

### Authentication Flow

- Supabase Auth (email/password + Google OAuth)
- Sessions via cookies using `@supabase/ssr`
- Protected routes validated in `hooks.server.ts`
- `safeGetSession()` validates JWT via `getUser()` (never use `session.user` directly)
- Auth guard includes defaults for `/private/*` (unauthenticated → `/auth`) and redirects `/auth` → `/private` when authenticated. 현재 `/private` 라우트는 미사용이며, 추후 비공개 영역 도입 시 활성화됩니다.

### Supabase Configuration

- **Schema**: `public` schema 사용 (마이그레이션도 `public` 기준)
- **Local Development**: Supabase CLI로 로컬 인스턴스 실행
  - `supabase start` - 로컬 Supabase 시작
  - `supabase stop` - 로컬 Supabase 정지
  - `supabase status` - 현재 상태 및 URL/Key 확인
  - 로컬: `http://127.0.0.1:55321` (supabase/config.toml)
- **Remote**: 환경변수(`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_KEY`)로 구성
- **Admin Client**: `event.locals.adminSupabase` (service role key 기반, 서버 전용)
- **User Client**: `event.locals.supabase` (쿠키 자동 처리)
- **Type Safety**: `src/lib/types/database.types.ts` (Supabase 타입 생성물)

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
- **백그라운드 작업 패턴**: Remote Functions에서 Promise를 반환하지 않고 `.catch()` 체이닝으로 백그라운드 실행
  ```js
  // 응답 후 백그라운드 처리
  summaryService.analyzeSummary(videoId, options).catch(async (err) => {
  	console.error('백그라운드 분석 실패:', err);
  	// 에러 처리 로직
  });
  return summaryData; // 즉시 응답 반환
  ```

#### Store + Infinite Scroll 패턴 (실제 구현 요약)

- SummaryStore가 list/detail/category/tag/metrics/community 쿼리를 통합 관리 (`src/lib/stores/summary.svelte.ts`).
- 목록은 `#listQueries` 배열로 페이지 단위 Remote Query를 보관, `IntersectionObserver`로 sentinel 교차 시 `loadMore()` 호출.
- Realtime 변경 시, 변경된 `created_at` 범위에 해당하는 list 쿼리만 `refresh()`, 상세 쿼리는 낙관적 업데이트(`set`).
- Remote Query 타입 가드는 공개 API(`refresh`) 존재 여부로 판별하여 안전하게 `.set()` 호출.

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

### Svelte Stores with Context API

이 앱은 Svelte Context API를 사용하여 타입 안전한 스토어 관리를 구현합니다:

```ts
// src/lib/stores/summary.svelte.ts
class SummaryStore {
	// 스토어 로직
}

const [getSummaryStore, setSummaryStore] = createContext<SummaryStore>();

export const createSummaryStore = (): SummaryStore => {
	const store = new SummaryStore();
	setSummaryStore(store);
	return store;
};

export { getSummaryStore };
```

사용 패턴:

- 루트 레이아웃(`src/routes/+layout.svelte`)에서 `createSummaryStore()` 호출 및 Realtime 구독 시작
- 하위 컴포넌트에서 `getSummaryStore()` 호출하여 스토어 접근
- 스토어는 Remote Functions와 Realtime을 통합 관리 (무한 스크롤, 낙관적 업데이트 포함)

### Supabase Realtime Integration

Realtime 구독은 Svelte Store 내부에서 관리하며 onMount cleanup 사용:

```ts
// 스토어 메서드
subscribe(supabase: SupabaseClient<Database>) {
  const channel = supabase
    .channel('summary-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'summaries' }, handler)
    .subscribe();

  return () => supabase.removeChannel(channel);
}

// 컴포넌트에서 사용
onMount(() => {
  const unsubscribe = store.subscribe(supabase);
  return unsubscribe;
});
```

## Project Structure

```
src/
├─ routes/              # SvelteKit pages + API routes
│  ├─ (main)/           # Routes with header layout
│  │  ├─ +layout.svelte # Header + SummaryForm
│  │  ├─ +page.svelte   # Home (SummaryList)
│  │  └─ [videoId]/     # Summary detail pages
│  └─ (non-header)/     # Routes without header (auth)
│     └─ auth/          # Auth pages (sign-in, sign-up, callback, etc)
├─ lib/
│  ├─ components/       # Reusable Svelte components (PascalCase)
│  ├─ remote/           # Remote Functions (*.remote.ts)
│  │  ├─ summary.remote.ts    # Summary queries and forms
│  │  ├─ summary.schema.ts    # Valibot schemas
│  │  └─ youtube/             # YouTube-related remote functions
│  ├─ stores/           # Svelte stores (*.svelte.ts)
│  │  └─ summary.svelte.ts    # SummaryStore with Realtime
│  ├─ server/           # Server-only utilities (kebab-case)
│  │  ├─ services/            # Business logic services
│  │  └─ youtube-proxy.ts     # YouTube proxy via Tor
│  ├─ types/            # TypeScript type definitions
│  │  └─ database.types.ts    # Supabase generated types
└─ hooks.server.ts      # Auth middleware + Supabase clients

supabase/
├─ migrations/          # Database migrations
└─ config.toml         # Supabase config

```

## Deployment Configuration

- **Platform**: Raspberry Pi 4
- **Adapter**: @sveltejs/adapter-node
- **Runtime**: Bun (Dockerfile: oven/bun 이미지 사용, `bun run build/index.js` 실행)

## Development Ports

- Dev server: 7777 (vite.config.js)
- Preview server: 17777

## Important Notes

- **Language**: TypeScript with type inference priority
- **Icons**: `@lucide/svelte` 사용 (lucide-svelte 금지)
- **Performance**: `console.time()/timeEnd()/timeLog()` 선호 (빠른 계측), 고급 로깅은 `src/lib/logger.js`
- **YouTube/Gemini Proxy**: 모든 외부 호출은 Tor SOCKS5 프록시 경유 (`TOR_SOCKS5_PROXY`)
- **Unhandled Rejections**: Global handler in `hooks.server.ts`가 모든 unhandled promise rejections 로깅

## Environment Variables (현재 코드 기준)

```bash
# Supabase
PUBLIC_SUPABASE_URL=...
PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...

# AI
GEMINI_API_KEY=...

# Network
TOR_SOCKS5_PROXY=socks5://127.0.0.1:9050

# OAuth (선택)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```
