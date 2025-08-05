# Supabase 개발 가이드

이 프로젝트에서 Supabase를 사용하는 방법과 Edge Functions 개발 지침입니다.

## 프로젝트 정보

- Project ID: `iefgdhwmgljjacafqomd`
- Project URL: <https://iefgdhwmgljjacafqomd.supabase.co>
- Dashboard: <https://supabase.com/dashboard/project/iefgdhwmgljjacafqomd>

## Edge Functions 개발

### 디렉토리 구조

```text
supabase/
├── functions/         # Edge Function 코드
│   ├── _shared/      # 공유 코드 (언더스코어 prefix)
│   ├── youtube-process/
│   │   └── index.ts
│   └── .env          # 로컬 환경 변수
└── tests/            # Deno 테스트
```

### 환경 변수 설정

**프로덕션 전용**: Dashboard → Settings → Edge Functions → Secrets

- `SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`

로컬 개발은 운영 DB를 직접 사용하므로 `.env` 파일 불필요

### 주요 명령어

#### 함수 생성

```bash
# 새 Edge Function 생성
supabase functions new <function-name>
# 예시: supabase functions new youtube-process
```

#### 개발

```bash
# 로컬 서버 시작
supabase start

# Edge Functions 로컬 실행
supabase functions serve
supabase functions serve youtube-process --no-verify-jwt  # JWT 검증 없이
```

#### 테스트

**Deno Task 방식 (권장)**:
```bash
# supabase 디렉토리에서 실행
cd supabase && deno task test                    # 모든 테스트
cd supabase && deno task test --filter="Hello"  # 특정 테스트만

# 또는 프로젝트 루트에서
deno task test --filter="Hello Function"        # 필터링 테스트
```

**npm 스크립트 방식**:
```bash
pnpm edge:test          # 모든 테스트 (deno task test 래퍼)
pnpm edge:format        # 코드 포맷팅
pnpm edge:lint          # 린트 검사  
pnpm edge:check         # 타입 체크
```

**개별 테스트 실행**:
```bash
# 절대 경로로 직접 실행
deno test --allow-all --env-file=.env ./supabase/tests/hello-test.ts

# 테스트 옵션들
deno test --help                    # 모든 옵션 확인
deno test --filter="pattern"        # 패턴 매칭
deno test --watch                   # 감시 모드
deno test --coverage                # 커버리지 수집
```

#### 배포

```bash
# 환경변수와 함수 한 번에 배포 (권장)
pnpm edge:deploy:with-secrets

# 환경변수만 설정
pnpm edge:secrets:set
# 또는
supabase secrets set --env-file=.env --project-ref iefgdhwmgljjacafqomd

# 설정된 환경변수 확인
pnpm edge:secrets:list

# 함수만 배포
pnpm edge:deploy
# 또는
supabase functions deploy --project-ref iefgdhwmgljjacafqomd

# 특정 함수만 배포
supabase functions deploy hello --project-ref iefgdhwmgljjacafqomd
```

#### 기타 명령어

```bash
# 함수 목록 확인
supabase functions list

# 함수 다운로드 (프로덕션에서)
supabase functions download <function-name>

# 함수 삭제
supabase functions delete <function-name>
```

### 개발 워크플로우

1. **함수 생성**: `supabase functions new [function-name]`
2. **코드 작성**: `supabase/functions/[function-name]/index.ts`
3. **로컬 테스트**: `supabase functions serve`
4. **단위 테스트**: `pnpm edge:test:unit`
5. **타입 체크**: `pnpm edge:check`
6. **배포**: `pnpm edge:deploy` 또는 `supabase functions deploy [function-name]`
7. **로그 확인**: Dashboard → Logs → Edge Functions

### 의존성 관리

#### udd 설치 및 사용

```bash
# udd (Update Deno Dependencies) 설치
deno install -rf --global --allow-read=. --allow-net --allow-write=. --allow-run=git,deno -n udd https://deno.land/x/udd/main.ts

# PATH에 추가 (필요한 경우)
export PATH="/Users/$USER/.deno/bin:$PATH"

# 의존성 업데이트
cd supabase
udd **/*.ts
```

#### JSR 패키지 사용 (권장)

```typescript
// npm 대신 JSR 사용
import { createClient } from "jsr:@supabase/supabase-js@2"  // ✅ JSR (권장)
// import { createClient } from "npm:@supabase/supabase-js@2"  // ❌ npm
```

JSR 장점:

- 더 나은 TypeScript 지원
- 자동 문서화
- 프로버넌스 증명 (Provenance Attestation)
- Deno와의 네이티브 통합

### Edge Functions 패턴

#### 기본 구조

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

Deno.serve(async (req) => {
  try {
    const { data } = await req.json()
    
    // 처리 로직
    
    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
```

#### 코드 공유 (_shared 폴더)

```typescript
// supabase/functions/_shared/supabaseClient.ts
import { createClient } from "jsr:@supabase/supabase-js@2"

export const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_ANON_KEY")!
)

// 함수에서 사용
import { supabaseClient } from "../_shared/supabaseClient.ts"
```

#### 함수 간 호출 (HTTP 체이닝)

```typescript
const response = await fetch(
  "https://iefgdhwmgljjacafqomd.supabase.co/functions/v1/other-function",
  {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ data })
  }
)
```

### Realtime 통합

#### Broadcast 사용 (프론트엔드 알림)

```typescript
// Edge Function에서
const { data, error } = await supabaseClient
  .channel('subtitle-updates')
  .send({
    type: 'broadcast',
    event: 'subtitle-ready',
    payload: { videoId, status: 'completed' }
  })

// 프론트엔드에서
const channel = supabase.channel('subtitle-updates')
channel.on('broadcast', { event: 'subtitle-ready' }, (payload) => {
  console.log('Subtitle ready:', payload)
}).subscribe()
```

### 테스트 및 검증

#### Hello Function 테스트 분석

**테스트 성공 원리**: `verify_jwt = true` 설정에도 불구하고 테스트가 성공하는 이유

1. **supabase.functions.invoke() 특별 처리**
   ```typescript
   // invoke() 메서드는 내부적으로 특별한 인증 로직 사용
   const { data, error } = await supabase.functions.invoke('hello', {
     body: { name: "World" }
   })
   ```

2. **테스트 환경에서의 anon key 동작**
   - 직접 HTTP 요청: 401 Unauthorized (차단됨)
   - invoke() 요청: 200 OK (성공함)
   - **함수 실행 카운트**: 인증 실패 시 차감 안 됨 ⭐

3. **실제 테스트 결과**
   ```bash
   # 3개의 Hello Function 테스트 모두 성공
   ✅ Hello function test passed: { message: "Hello World!" }
   ✅ Hello function integration working perfectly!  
   ✅ Production hello function working correctly
   ```

#### Deno Test 사용 (공식 권장)

Supabase Edge Functions는 Deno의 내장 테스트 프레임워크를 사용합니다.

**중요**: Supabase 공식 권장사항에 따라 **모든 테스트는 `invoke()` 메서드를 사용**해야 합니다.

```typescript
// supabase/functions/tests/function-name-test.ts
import { assert, assertEquals } from "jsr:@std/assert@1"
import { createClient } from "jsr:@supabase/supabase-js@2"
import "jsr:@std/dotenv/load"

Deno.test("Function Test", async () => {
  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  )
  
  // ✅ 공식 권장: invoke() 사용
  const { data, error } = await client.functions.invoke("function-name", {
    body: { test: "data" }
  })
  
  assert(!error)
  assertEquals(data.status, "success")
})
```

#### 테스트 규칙

**✅ 권장 방법:**

- `supabase.functions.invoke()` 사용
- Supabase 클라이언트 통합
- TypeScript 타입 안전성
- 자동 에러 핸들링

**❌ 권장하지 않는 방법:**

- 직접 `fetch()` 호출 (HTTP 레벨 테스트 필요시에만 사용)
- 혼합 방식 (일관성 저해)

**예외 상황:**

- CORS 헤더 검증이 필요한 경우
- HTTP 상태 코드 직접 확인이 필요한 경우
- 브라우저 동작 시뮬레이션이 필요한 경우

#### 테스트 실행

**환경 변수**: 프로젝트 루트의 `.env` 파일 사용

```bash
# 모든 Edge Functions 테스트
pnpm edge:test

# 환경 변수 테스트
pnpm edge:test:env

# 전체 테스트
pnpm edge:test:all

# 직접 실행 (Deno 2.4+ --env-file 옵션)
deno test --allow-all --env-file=.env supabase/tests/all-functions-test.ts
```

#### 운영 DB 직접 테스트

이 프로젝트는 로컬 DB 없이 운영 Supabase를 직접 사용합니다.

##### 설정 방법

1. Supabase Dashboard → Settings → Edge Functions → Secrets에서 환경 변수 설정:
   - `SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`

2. 테스트 실행:

```bash
supabase functions serve
pnpm edge:test
```

##### 테스트 전용 스키마 사용 (선택사항)

```sql
-- 테스트 전용 스키마 생성
CREATE SCHEMA IF NOT EXISTS test;

-- 테스트 테이블 생성
CREATE TABLE test.subtitles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 테스트 후 정리
DROP SCHEMA test CASCADE;
```

#### Edge Function에서 데이터베이스 사용 예제

```typescript
// 방법 1: Supabase 클라이언트 사용 (RLS 적용)
import { createClient } from "jsr:@supabase/supabase-js@2"

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: {
        headers: { Authorization: req.headers.get("Authorization")! }
      }
    }
  )
  
  // RLS가 적용된 쿼리
  const { data, error } = await supabase
    .from("subtitles")
    .select("*")
    .eq("video_id", "test")
  
  return new Response(JSON.stringify({ data }))
})

// 방법 2: Service Role Key 사용 (RLS 우회)
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

// 방법 3: 직접 PostgreSQL 연결 (Deno Postgres)
import postgres from "https://deno.land/x/postgresjs/mod.js"

const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!)
const result = await sql`SELECT * FROM subtitles`
```

### 디버깅

1. **Chrome DevTools 디버깅**

   ```bash
   # inspect 모드로 실행
   supabase functions serve --inspect-mode brk
   
   # Chrome에서 chrome://inspect 접속
   # 127.0.0.1:8083 추가하여 디버깅
   ```

2. **로그 확인**
   - Dashboard: Logs → Edge Functions
   - CLI: `supabase functions logs function-name --project-ref iefgdhwmgljjacafqomd`

3. **일반적인 문제**
   - 401: anon key 확인 (`supabase status`)
   - 404: 함수 배포 확인
   - 500: 환경 변수 및 코드 오류 확인

### 베스트 프랙티스

1. **Fat Functions**: 작은 함수 여러 개보다 큰 함수 몇 개가 더 효율적
2. **하이픈 네이밍**: `youtube-process` (URL 친화적)
3. **에러 핸들링**: try-catch로 모든 에러 처리
4. **타입 안정성**: TypeScript 사용, 배포 전 타입 체크
5. **환경 변수**: 민감한 정보는 절대 코드에 하드코딩하지 않음

### 제한사항

- 실행 시간: 150초
- 메모리: 512MB
- 페이로드 크기: 6MB
- 계층적 라우팅 미지원 (flat structure only)

### 유용한 링크

- [Edge Functions 문서](https://supabase.com/docs/guides/functions)
- [Deno 문서](https://deno.land/manual)
- [프로젝트 대시보드](https://supabase.com/dashboard/project/iefgdhwmgljjacafqomd)
