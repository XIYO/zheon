# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

YouTube 영상 자막을 추출해 다국어 요약/인사이트를 제공하는 SvelteKit + Supabase 애플리케이션입니다.

## Tech Stack

- **Frontend**: SvelteKit 2 (Svelte 5), Tailwind CSS 4, Skeleton UI
- **Backend**: Supabase (PostgreSQL)
- **Testing**: Vitest, Playwright
- **Language**: TypeScript
- **Package Manager**: bun (npm/pnpm 사용 금지)
- **i18n**: Paraglide.js

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
bun dev         # Dev server on http://localhost:7777
bun build       # Production build
bun preview     # Preview build on http://localhost:17777
```

### Code Quality

```bash
bun check       # Svelte + JS checks (via jsconfig)
bun format      # Prettier write
bun lint        # ESLint + Prettier check
```

### Testing

```bash
bun test        # All tests (unit + E2E)
bun test:unit   # Vitest unit/component tests
bun test:e2e    # Playwright E2E tests
```

### Deployment

```bash
bun build       # Build for production
```

## Architecture & Key Patterns

### Authentication Flow

- Supabase Auth (email/password)
- Sessions via cookies using `@supabase/ssr`
- Protected routes validated in `hooks.server.ts`
- `safeGetSession()` validates JWT via `getUser()` (never use `session.user` directly)
- Auth middleware redirects: `/private/*` requires auth, `/auth` redirects to `/private` when authenticated

### Supabase Configuration

- **Schema**: `public` schema used (not custom `zheon` schema in migrations)
- **Local Development**: Supabase CLI로 로컬 인스턴스 실행
  - `supabase start` - 로컬 Supabase 시작
  - `supabase stop` - 로컬 Supabase 정지
  - `supabase status` - 현재 상태 및 URL/Key 확인
  - 로컬: `http://127.0.0.1:55321` (config.toml에 정의)
- **Remote Production**: `https://iefgdhwmgljjacafqomd.supabase.co`
- **Admin Client**: Available via `event.locals.adminSupabase` in server hooks
- **User Client**: Available via `event.locals.supabase` with automatic cookie handling
- **Type Safety**: Database types generated in `src/lib/types/database.types.ts`

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

- Layout에서 `createSummaryStore()` 호출하여 컨텍스트 설정
- 하위 컴포넌트에서 `getSummaryStore()` 호출하여 스토어 접근
- 스토어는 Remote Functions와 Realtime을 통합 관리

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
│  │  ├─ +layout.svelte # Main layout with header
│  │  ├─ +page.svelte   # Home page (SummaryForm + SummaryList)
│  │  └─ [id]/          # Summary detail pages
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
│  └─ paraglide/        # i18n runtime (auto-generated)
└─ hooks.server.ts      # Auth middleware + Supabase clients

supabase/
├─ migrations/          # Database migrations
└─ config.toml         # Supabase config

messages/              # i18n message files (ko.json, en.json)
```

## Deployment Configuration

- **Platform**: Raspberry Pi 4 (Bun runtime)
- **Adapter**: @sveltejs/adapter-auto (configured in svelte.config.js)

## Development Ports

- Dev server: 7777 (configured in vite.config)
- Preview server: 17777
- Wrangler dev: 5170

## Important Notes

- **Language**: TypeScript with type inference priority
- **Internationalization**: Paraglide.js를 다국어용으로 사용 (messages/\*.json)
- **Icons**: `@lucide/svelte` 사용 (lucide-svelte 금지)
- **Performance**: `console.time()/timeEnd()/timeLog()` 사용 (performance.now() 금지)
- **YouTube Proxy**: YouTube access via Tor SOCKS5 proxy (configured in hooks.server.ts)
- **Unhandled Rejections**: Global handler in hooks.server.ts logs all unhandled promise rejections
