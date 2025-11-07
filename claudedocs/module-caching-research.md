# Node.js와 SvelteKit 모듈 캐싱 및 싱글톤 패턴 연구

## 요약

Node.js와 SvelteKit 환경에서 모듈 캐싱과 싱글톤 패턴이 실제로 동작하는 방식에 대한 종합 분석입니다. 결론부터 말하면, **hooks.server.ts는 요청마다 재실행되지만, 모듈 레벨 변수는 프로세스 수명 동안 유지됩니다.**

---

## 1. Node.js 모듈 캐싱 메커니즘

### 1.1 공식 문서 근거

**Node.js 공식 문서 (nodejs.org/api/modules.html):**

> "Modules are cached after the first time they are loaded. This means (among other things) that every call to `require('foo')` will get exactly the same object returned, if it would resolve to the same file."

핵심 포인트:
- **모듈은 첫 로드 후 캐싱됨**
- **동일 파일에 대한 모든 `require()` 호출은 정확히 같은 객체를 반환**
- **프로세스 수명 동안 캐시 유지**

### 1.2 모듈 캐싱의 동작 원리

```javascript
// counter.js - 모듈 레벨 변수
let count = 0;

function increment() {
  return ++count;
}

module.exports = { increment };
```

```javascript
// app.js - 여러 번 require
const counter1 = require('./counter');
const counter2 = require('./counter');

console.log(counter1 === counter2); // true - 정확히 같은 객체
console.log(counter1.increment()); // 1
console.log(counter2.increment()); // 2 - 상태 공유
```

**메모리 모델:**
- 첫 `require()`시 모듈 코드 실행 → 힙에 객체 생성
- `require.cache`에 경로를 키로 객체 참조 저장
- 이후 `require()`는 캐시에서 같은 객체 반환
- **모듈 레벨 변수는 힙에 존재하며 프로세스가 살아있는 동안 유지**

### 1.3 모듈 래퍼 함수

Node.js는 각 모듈을 다음과 같은 함수로 래핑:

```javascript
(function(exports, require, module, __filename, __dirname) {
  // 모듈 코드가 여기에 위치
  let count = 0; // 이 변수는 모듈 스코프에 존재
});
```

- **모듈 스코프**: 함수 스코프로 인해 모듈 레벨 변수는 전역이 아닌 해당 모듈에만 속함
- **클로저**: 모듈 함수는 한 번만 실행되지만, 반환된 `exports` 객체는 클로저를 통해 모듈 레벨 변수에 접근 가능
- **싱글톤 보장**: 함수가 한 번만 실행되므로 자연스럽게 싱글톤 패턴

---

## 2. SvelteKit hooks.server.ts 실행 모델

### 2.1 공식 문서 근거

**SvelteKit 공식 문서 (svelte.dev/docs/kit/hooks):**

> "The handle hook runs every time the SvelteKit server receives a request — whether that happens while the app is running, or during prerendering — and determines the response."

핵심 포인트:
- **`handle` 함수는 요청마다 실행됨**
- **하지만 모듈 자체는 한 번만 로드됨**

### 2.2 실제 동작 분석

```typescript
// hooks.server.ts
import { createServerClient } from '@supabase/ssr';

// 모듈 레벨 코드 - 프로세스 시작 시 한 번만 실행
console.log('Module loaded at:', new Date());
let requestCount = 0;

// handle 함수 - 요청마다 실행
const supabase: Handle = async ({ event, resolve }) => {
  requestCount++; // 모듈 레벨 변수 공유
  console.log('Request count:', requestCount);

  // 요청마다 새로운 클라이언트 생성
  event.locals.supabase = createServerClient(...);
  return resolve(event);
};

export const handle = sequence(supabase, adminSupabase, authGuard);
```

**실행 흐름:**
1. **서버 시작**: `hooks.server.ts` 모듈 로드 → 모듈 레벨 코드 실행 (1회)
2. **요청 1**: `handle` 함수 실행 → `requestCount: 1`
3. **요청 2**: `handle` 함수 실행 → `requestCount: 2`
4. **요청 N**: `handle` 함수 실행 → `requestCount: N`

**메모리 관점:**
- `hooks.server.ts` 모듈: 힙에 한 번 로드
- `requestCount` 변수: 힙에 존재하며 모든 요청이 공유
- `handle` 함수: 각 요청마다 새로운 실행 컨텍스트 (스택), 하지만 클로저로 동일 힙의 변수 접근

### 2.3 왜 매번 새로운 클라이언트를 생성하는가?

```typescript
// 잘못된 패턴 - 모듈 레벨 싱글톤
const globalClient = createServerClient(...); // 모든 요청이 같은 클라이언트 공유

// 올바른 패턴 - 요청별 인스턴스
const supabase: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient(...); // 요청마다 새로운 클라이언트
};
```

**이유:**
1. **요청 격리**: 각 요청은 독립적인 쿠키와 세션을 가짐
2. **동시성 안전**: 여러 요청이 동시에 처리될 때 상태 혼선 방지
3. **메모리 관리**: 요청 종료 후 클라이언트 GC 가능

---

## 3. 싱글톤 패턴의 실제 동작

### 3.1 모듈 레벨 싱글톤 (유효)

```javascript
// database.js - 프로세스 수명 동안 유지되는 싱글톤
let dbConnection = null;

async function getConnection() {
  if (!dbConnection) {
    dbConnection = await connectToDatabase();
    console.log('New DB connection created');
  }
  return dbConnection;
}

module.exports = { getConnection };
```

**동작:**
- 첫 호출: 연결 생성 + 캐싱
- 이후 호출: 캐시된 연결 반환
- **모든 요청이 같은 연결 공유 (커넥션 풀)**

### 3.2 요청별 인스턴스 (hooks.server.ts 패턴)

```typescript
// hooks.server.ts - 요청마다 새로운 인스턴스
const supabase: Handle = async ({ event, resolve }) => {
  // 매번 새로운 클라이언트 생성
  event.locals.supabase = createServerClient(...);
  return resolve(event);
};
```

**동작:**
- 각 요청: 새로운 클라이언트 생성
- 요청 종료: 클라이언트 GC 대상
- **요청 간 격리 보장**

### 3.3 StackOverflow 검증

**질문: "Singleton pattern in nodejs - is it needed?"**

답변 요약:
> "When Node's module caching fails, that singleton pattern fails. Since modules may resolve to a different filename based on the location of the calling module (loading from node_modules folders), it is not a guarantee that require('foo') will always return the exact same object, if it would resolve to different files."

**주의사항:**
- 같은 모듈이 다른 경로로 해석되면 별도 캐시 → 싱글톤 실패
- 예: `node_modules`에 중복 설치된 패키지
- **단일 파일 경로 → 싱글톤 보장**

---

## 4. Cloudflare Workers 환경 (adapter-cloudflare)

### 4.1 기본 동작

Cloudflare Workers는 Node.js와 다른 런타임:
- V8 Isolates 기반 (Node.js가 아님)
- 각 요청은 독립된 Isolate에서 실행 가능
- **모듈 캐싱 동작이 다를 수 있음**

### 4.2 Cloudflare Workers 모듈 캐싱

공식 문서 근거:
- Workers는 Isolate 재사용으로 성능 최적화
- **같은 Isolate 내에서는 모듈 캐싱 유지**
- **다른 Isolate는 독립적인 모듈 캐시**

```javascript
// worker.js
let count = 0;

export default {
  async fetch(request) {
    return new Response(`Count: ${++count}`);
  }
};
```

**동작:**
- Isolate A: count = 1, 2, 3, ... (재사용 시)
- Isolate B: count = 1, 2, 3, ... (독립적)
- **완전한 싱글톤 보장 없음**

### 4.3 현재 프로젝트는 adapter-node 사용

```javascript
// svelte.config.js
import adapter from '@sveltejs/adapter-node';

const config = {
  kit: {
    adapter: adapter(),
  }
};
```

**결론:**
- **표준 Node.js 환경에서 실행**
- **모듈 캐싱 보장**
- **싱글톤 패턴 유효**

---

## 5. 실험적 검증

### 5.1 검증 코드 예제

```typescript
// test-singleton.ts - 검증용 모듈
let instanceCount = 0;
let requestCount = 0;

class Counter {
  id: number;

  constructor() {
    this.id = ++instanceCount;
    console.log(`Counter instance ${this.id} created`);
  }

  increment() {
    return ++requestCount;
  }
}

// 싱글톤 인스턴스
const singleton = new Counter();

export function getCounter() {
  return singleton;
}
```

```typescript
// hooks.server.ts - 싱글톤 테스트
import { getCounter } from './test-singleton';

const testHandle: Handle = async ({ event, resolve }) => {
  const counter = getCounter();
  console.log('Counter ID:', counter.id); // 항상 1
  console.log('Request count:', counter.increment()); // 1, 2, 3, ...
  return resolve(event);
};
```

**예상 출력:**
```
서버 시작:
Counter instance 1 created

요청 1:
Counter ID: 1
Request count: 1

요청 2:
Counter ID: 1
Request count: 2

요청 3:
Counter ID: 1
Request count: 3
```

### 5.2 실제 프로젝트의 사례

```typescript
// hooks.server.ts - 현재 구현
const supabase: Handle = async ({ event, resolve }) => {
  // 매번 새로운 클라이언트 생성 (의도적)
  event.locals.supabase = createServerClient(
    publicEnv.PUBLIC_SUPABASE_URL,
    publicEnv.PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => event.cookies.getAll(), // 요청별 쿠키
        setAll: (cookiesToSet) => { ... }
      }
    }
  );
  return resolve(event);
};
```

**왜 싱글톤을 사용하지 않는가?**
- `createServerClient`는 쿠키 기반 인증
- 각 요청의 쿠키가 다름 → 클라이언트도 달라야 함
- **요청 격리가 목적**

---

## 6. 메모리 할당 위치

### 6.1 힙 vs 스택

```javascript
// 모듈 코드
let count = 0;              // 힙 (모듈 스코프)
const obj = { value: 1 };   // 힙 (객체)

function handler() {
  let local = 10;           // 스택 (함수 스코프)
  count++;                  // 힙의 count 변수 수정
  return local + count;     // 스택의 local + 힙의 count
}
```

**메모리 모델:**
- **모듈 레벨 변수**: 힙에 할당, 프로세스 수명 동안 유지
- **함수 레벨 변수**: 스택에 할당, 함수 종료 시 해제
- **클로저**: 스택 변수를 힙으로 승격 (필요 시)

### 6.2 Node.js 메모리 구조

```
┌─────────────────────────────────┐
│  Node.js Process                │
├─────────────────────────────────┤
│  require.cache                  │  ← 모듈 캐시
│  ├─ /path/to/module.js: {...}  │
│  └─ /path/to/hooks.ts: {...}   │
├─────────────────────────────────┤
│  Heap                           │
│  ├─ Module objects              │
│  ├─ Module-level variables      │  ← count, singleton 등
│  └─ Long-lived objects          │
├─────────────────────────────────┤
│  Stack (per request)            │
│  ├─ Function call frames        │
│  └─ Local variables             │  ← 요청 종료 시 해제
└─────────────────────────────────┘
```

---

## 7. 결론

### 7.1 핵심 사실

1. **Node.js 모듈 캐싱**
   - 모듈은 첫 로드 후 `require.cache`에 캐싱
   - 동일 파일 경로 → 항상 같은 객체 반환
   - 프로세스 수명 동안 캐시 유지

2. **hooks.server.ts 실행 모델**
   - 모듈 로드: 서버 시작 시 1회
   - `handle` 함수: 요청마다 실행
   - 모듈 레벨 변수: 모든 요청이 공유

3. **싱글톤 패턴**
   - 모듈 레벨 변수/객체 → 자연스러운 싱글톤
   - Node.js 환경에서 보장됨 (단일 파일 경로)
   - Cloudflare Workers는 Isolate마다 독립적

4. **요청별 인스턴스의 필요성**
   - 쿠키, 세션 등 요청별 컨텍스트
   - 동시성 안전
   - 메모리 누수 방지

### 7.2 실무 권장사항

**싱글톤이 적절한 경우:**
```typescript
// DB 커넥션 풀 - 모든 요청이 공유
let dbPool = null;

export async function getPool() {
  if (!dbPool) {
    dbPool = await createPool();
  }
  return dbPool;
}
```

**요청별 인스턴스가 적절한 경우:**
```typescript
// Supabase 클라이언트 - 요청별 쿠키
const supabase: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient(...);
  return resolve(event);
};
```

### 7.3 최종 검증

**실험 방법:**
```typescript
// hooks.server.ts
let requestCounter = 0;
let moduleLoadTime = new Date().toISOString();

const testHandle: Handle = async ({ event, resolve }) => {
  console.log('Module loaded at:', moduleLoadTime); // 항상 같음
  console.log('Request number:', ++requestCounter); // 증가
  return resolve(event);
};
```

**예상 로그:**
```
서버 시작:
Module loaded at: 2025-11-07T10:00:00.000Z

요청 1:
Module loaded at: 2025-11-07T10:00:00.000Z
Request number: 1

요청 2:
Module loaded at: 2025-11-07T10:00:00.000Z
Request number: 2
```

---

## 8. 참고 자료

1. **Node.js 공식 문서**
   - https://nodejs.org/api/modules.html#caching
   - "Modules are cached after the first time they are loaded"

2. **SvelteKit 공식 문서**
   - https://svelte.dev/docs/kit/hooks
   - "The handle hook runs every time the SvelteKit server receives a request"

3. **StackOverflow**
   - https://stackoverflow.com/questions/13179109/singleton-pattern-in-nodejs-is-it-needed
   - 모듈 캐싱 실패 케이스와 주의사항

4. **Cloudflare Workers 문서**
   - https://developers.cloudflare.com/workers/
   - Isolate 기반 실행 모델

---

## 9. 추가 고려사항

### 9.1 프로세스 재시작

Node.js 프로세스가 재시작되면:
- 모든 모듈 캐시 초기화
- 모듈 레벨 변수 초기화
- **싱글톤 재생성**

### 9.2 Hot Module Replacement (HMR)

개발 환경에서 HMR 사용 시:
- 모듈 재로드 가능
- 캐시 무효화
- **싱글톤 재생성 가능**

### 9.3 클러스터 모드

`cluster` 모듈 사용 시:
- 각 워커 프로세스는 독립적인 메모리 공간
- **워커 간 싱글톤 공유 불가**
- 공유 필요 시 Redis 등 외부 저장소 사용

---

**작성일**: 2025-11-07
**조사 범위**: Node.js 모듈 캐싱, SvelteKit hooks, Cloudflare Workers
**결론**: hooks.server.ts는 요청마다 실행되지만, 모듈 레벨 싱글톤은 프로세스 수명 동안 유지됨
