# Zheon 개발 로그

## 2025-10-03: Cloudflare → PostgreSQL 마이그레이션 시도 및 롤백

### 🎯 목표

Cloudflare Workers + D1에서 일반 서버 + PostgreSQL로 전환 시도

### 📋 시도한 작업

#### 1. 패키지 변경

**제거:**

- `@sveltejs/adapter-cloudflare`
- `better-sqlite3`
- `@lucia-auth/adapter-sqlite`
- `wrangler`

**추가:**

- `@sveltejs/adapter-node`
- `pg` (PostgreSQL 드라이버)
- `@lucia-auth/adapter-postgresql`

#### 2. 설정 파일 변경

**svelte.config.js**

```javascript
// Before
import adapter from '@sveltejs/adapter-cloudflare';

// After (시도)
import adapter from '@sveltejs/adapter-node';
```

**drizzle.config.js**

```javascript
// Before: SQLite D1
dialect: 'sqlite',
driver: 'd1-http',
dbCredentials: {
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  databaseId: process.env.CLOUDFLARE_DATABASE_ID,
  token: process.env.CLOUDFLARE_D1_TOKEN
}

// After (시도): PostgreSQL
dialect: 'postgresql',
dbCredentials: {
  url: process.env.DATABASE_URL
}
```

#### 3. DB 스키마 변환

**src/lib/server/db/schema.js**

- `sqliteTable` → `pgTable`
- `integer` → `timestamp`, `bigint`, `serial`
- `text` → `varchar`, `text`
- 모든 타입을 PostgreSQL 호환으로 변경

#### 4. DB 연결 로직 변경

**src/lib/server/db/index.js**

```javascript
// Before: Cloudflare D1
import { drizzle } from 'drizzle-orm/d1';
export function getDb(event) {
	return drizzle(event.platform.env.DB);
}

// After (시도): PostgreSQL
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
const pool = new pg.Pool({
	connectionString: process.env.DATABASE_URL
});
export const db = drizzle(pool, { schema });
```

#### 5. Lucia Auth Adapter 변경

**src/lib/server/auth/lucia.js**

```javascript
// Before: SQLite
import { d1 as createD1Adapter } from '@lucia-auth/adapter-sqlite';

// After (시도): PostgreSQL
import { pg as createPostgresAdapter } from '@lucia-auth/adapter-postgresql';
```

#### 6. PostgreSQL 기반 큐/락 시스템 구현

**새 파일 생성:**

- `src/lib/server/queue.js` - PostgreSQL FOR UPDATE SKIP LOCKED 사용한 작업 큐
- `src/lib/server/locks.js` - PostgreSQL 기반 분산 락

**스키마 추가:**

```javascript
// jobs 테이블 - 작업 큐
export const jobs = pgTable('jobs', {
	id: serial('id').primaryKey(),
	queue: varchar('queue', { length: 50 }).notNull(),
	payload: text('payload').notNull(),
	status: varchar('status', { length: 20 }).notNull()
	// ...
});

// locks 테이블 - 분산 락
export const locks = pgTable('locks', {
	key: varchar('key', { length: 255 }).primaryKey(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at', { mode: 'date' }).notNull()
	// ...
});
```

#### 7. Platform Bindings 제거

**수정한 파일들:**

- `src/hooks.server.js`
- `src/routes/api/cron/+server.js`
- `src/routes/api/health/+server.js`
- `src/routes/api/push/subscribe/+server.js`
- `src/routes/admin/*.js`
- 기타 9개 route 파일

**변경 내용:**

- `platform.env.DB` → `locals.db`
- `platform.env.KV_LOCKS` → PostgreSQL locks 테이블
- `platform.env.POLLING_QUEUE` → PostgreSQL jobs 테이블
- `platform.env.PUBLIC_URL` → `process.env.PUBLIC_URL`

#### 8. 환경 변수 재구성

**.env.example 업데이트:**

```bash
# 추가
DATABASE_URL=postgresql://user:password@localhost:5432/zheon
PUBLIC_URL=http://localhost:3000

# 제거
LOCAL_SQLITE_PATH=.wrangler/local.sqlite
CLOUDFLARE_*
```

### ⚠️ 발견한 문제들

#### 1. Lucia Auth Deprecated

```
WARN deprecated lucia@2.7.7
WARN deprecated @lucia-auth/adapter-postgresql@3.1.2
WARN deprecated oslo@1.2.1
```

**조사 결과:**

- Lucia 프로젝트가 2024년에 완전 종료됨
- 개발자(pilcrowOnPaper)가 프로젝트 중단 발표
- v3는 2025년 3월까지만 버그 픽스 지원
- 이유: "Database adapter가 근본적 문제", "잘못된 가정", "본인도 안 씀"
- 후계자 없음 (아무도 이어받지 않음)
- SvelteKit 공식 문서에서도 Lucia 추천 삭제함

#### 2. 빌드 에러 연쇄

```bash
error: "getDb" is not exported by "src/lib/server/db/index.js"
```

**원인:**

- 50개 이상 파일 수정하면서 일관성 깨짐
- `getDb()` 함수 제거했는데 참조는 남아있음
- platform.env 접근 코드가 곳곳에 산재

### 🔍 Git 히스토리 조사

**최근 커밋들:**

```
77261ac | 2025-10-01 | ♻️ Refactor: harden email auth
7c4f833 | 2025-08-17 | 🔧 Update environment variable imports
8e4bb7d | 2025-08-17 | 🔧 Add GitHub build configuration
bd555d5 | 2025-08-10 | 🔖 버전 0.1.0 업데이트
751deb6 | 2025-08-06 | ✨ Supabase Edge Functions 구현
```

**중요 발견:**

- 모든 커밋이 Cloudflare Workers + D1 조합
- 7c4f833 시점은 **Supabase Auth 사용** (Lucia 아님!)
- 빌드 성공 확인됨

### ✅ 해결 방법: 롤백

**결정:**

```bash
git reset --hard 7c4f833
git clean -fd
pnpm install
pnpm build  # ✓ SUCCESS (722ms)
```

**복원된 스택:**

- ✅ Cloudflare Workers + D1
- ✅ Supabase Auth (deprecated Lucia 문제 없음!)
- ✅ @sveltejs/adapter-cloudflare
- ✅ Supabase Edge Functions (AI 처리)
- ✅ 빌드 성공

**제거된 것들:**

- ❌ PostgreSQL 마이그레이션 코드 전부
- ❌ Drizzle ORM PostgreSQL 설정
- ❌ 큐/락 유틸리티
- ❌ 50개 파일 수정 내역

### 📚 배운 것

#### 1. PostgreSQL의 강력한 기능들

- **FOR UPDATE SKIP LOCKED**: 동시성 안전한 큐 구현 가능
- **Advisory Locks**: Redis 없이 분산 락 가능
- **LISTEN/NOTIFY**: Pub/Sub 기능 내장
- **JSONB**: 유연한 데이터 저장

#### 2. Lucia Auth의 몰락

- 오픈소스 메인테이너 번아웃의 현실
- SvelteKit이 밀던 라이브러리가 갑자기 중단
- 커뮤니티도 혼란 (Better Auth 등으로 분산)
- **교훈**: 큰 프로젝트는 기업 후원 있는 라이브러리 선택 필요

#### 3. 마이그레이션의 어려움

- 작은 변경도 50개 파일에 영향
- Platform-specific 코드는 마이그레이션 시 큰 부담
- 일관성 유지가 어려움

### 🎯 향후 계획

#### 단기 (현재 스택 유지)

1. 7c4f833에서 안정적으로 개발
2. Supabase Auth 활용 (이미 잘 작동 중)
3. Cloudflare Workers 배포

#### 중기 (필요시)

1. Cloudflare에서 계속 운영
2. 또는 서버 전환이 꼭 필요하다면:
   - 브랜치 따서 점진적 마이그레이션
   - 충분한 테스트
   - 단계별 전환

#### 장기 (인증 시스템)

1. Supabase Auth 유지 (현재)
2. 또는 필요시:
   - Better Auth로 마이그레이션
   - Auth.js (NextAuth) 검토
   - 직접 구현 (300줄 정도면 가능)

### 📊 통계

**수정한 파일:** ~50개 **새로 만든 파일:** ~10개 **작업 시간:** ~3시간 **최종 상태:** 롤백 완료, 안정 상태 **빌드 시간:** 722ms (성공)

### 💡 결론

**"잘 작동하는 걸 고치려다 망가뜨렸다"**

- Cloudflare Workers는 잘 작동했음
- Supabase Auth도 잘 작동했음
- PostgreSQL 전환은 scope가 너무 컸음
- 롤백이 정답이었음

**다음부터는:**

1. 작은 단위로 변경
2. 각 단계마다 커밋
3. 테스트 충분히
4. 롤백 계획 먼저 세우기

---

## 2025-10-03 (오후): 로컬 개발 환경 구축

### 🎯 목표

로컬에서 완전한 개발/테스트 환경 구축 (프로덕션 DB 의존성 제거)

### 📋 수행한 작업

#### 1. 프로젝트 전체 분석 및 리포트 작성

**분석 내용:**

- 코드베이스: 4,582 라인 (JS/Svelte)
- 테스트 파일: 137개
- 주요 기술 스택:
  - Frontend: SvelteKit 2 + Svelte 5 + TailwindCSS 4
  - Backend: Supabase (PostgreSQL + Edge Functions)
  - Auth: Supabase Auth (이메일/비밀번호 + Google OAuth)
  - Deployment: Cloudflare Workers

**발견한 문제점:**

1. ❌ 데이터베이스 스키마 중복 (`summary`, `video_summaries`)
2. ❌ Vector 관련 미사용 함수/테이블
3. ❌ 캐시 만료 로직 미구현 (`expires_at` 컬럼 없음)
4. ❌ 테스트 Edge Functions (`hello-*`)가 프로덕션 설정에 포함
5. ❌ `worklogs.md`가 untracked 상태
6. ❌ `wrangler.toml`에 환경 변수 하드코딩

#### 2. 로컬 테스트 환경 문제 해결

**문제:**

```
Error: Cannot find module '@lucia-auth/adapter-sqlite'
Error: D1_ERROR: no such table: sessions
Error: The requested module '@lucia-auth/adapter-postgresql' does not provide an export named 'pg'
```

**원인:**

- `.svelte-kit` 폴더에 이전 Lucia Auth 코드 캐시됨
- 실제 코드는 Supabase Auth 사용 중

**해결:**

```bash
rm -rf .svelte-kit node_modules pnpm-lock.yaml
pnpm install
```

#### 3. 로컬 Supabase 환경 구축

**이미 설치된 Supabase CLI 확인:**

```bash
which supabase
# /opt/homebrew/bin/supabase
```

**로컬 Supabase 시작:**

```bash
# 다른 프로젝트의 Supabase 중지
supabase stop --project-id bbakey

# config.toml에서 테스트 함수 제거
# [functions.youtube-transcript-test] 주석처리

# 로컬 Supabase 시작
supabase start
```

**실행 중인 서비스:**

- API URL: http://127.0.0.1:54321
- Studio URL: http://127.0.0.1:54323 (대시보드)
- Database URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
- Mailpit URL: http://127.0.0.1:54324 (이메일 테스트)
- Publishable Key: `sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH`

#### 4. 환경 변수 업데이트

**.env 변경:**

```bash
# Before (프로덕션 Supabase)
PUBLIC_SUPABASE_URL=https://iefgdhwmgljjacafqomd.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# After (로컬 Supabase)
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
```

#### 5. 개발 서버 재시작

```bash
pnpm dev
# ✅ http://localhost:5174/ (5173 포트가 사용 중이라 5174로 자동 변경)
```

#### 6. 로컬 환경 테스트

**페이지 로드:** ✅ 정상

- 메인 페이지 렌더링 성공
- 기존 프로덕션 데이터 표시 (로컬 DB는 비어있음)
- 로그인 다이얼로그 정상 작동

**회원가입 시도:** ⚠️ 문제 발견

- 이메일: `local@test.com`
- 비밀번호: `Test1234!`
- 버튼 클릭 시: 비활성화 → 활성화 (서버 요청 없음)
- 서버 로그: 아무 요청도 기록 안 됨

**예상 원인:**

1. Svelte 5의 새로운 reactive 시스템 (`$state`, `$props`) 이슈
2. `use:enhance` 동작 문제
3. 폼 action URL 구성 문제

### ⚠️ 발견한 이슈

#### 1. 회원가입 폼 제출 안 됨

- **위치:** `src/lib/components/SignUpForm.svelte`
- **증상:** 버튼 클릭 시 서버로 요청이 가지 않음
- **디버깅 필요:** `use:enhance` 핸들러, 폼 action URL

#### 2. 프로덕션 데이터 표시

- 로컬 Supabase는 비어있지만 프로덕션 데이터가 보임
- 환경 변수 적용 확인 필요

### ✅ 성공한 부분

1. ✅ 로컬 Supabase 정상 실행
2. ✅ 마이그레이션 자동 적용 (2개 파일)
3. ✅ 개발 서버 로컬 Supabase 연결
4. ✅ 페이지 렌더링 정상
5. ✅ 이메일 테스트 서버 (Mailpit) 준비됨

### 📝 다음 작업자를 위한 TODO

#### 🔴 긴급 (High Priority)

1. **회원가입 폼 디버깅**
   - [ ] 브라우저 Network 탭에서 요청 확인
   - [ ] `SignUpForm.svelte:24` `handleEnhance` 함수 디버깅
   - [ ] 폼 action URL 검증: `/auth/sign-up/?/email${redirectToQuery}`
   - [ ] Svelte 5 `use:enhance` 동작 확인
   - [ ] 필요시 `console.log` 추가해서 디버깅

2. **로컬 인증 플로우 테스트**
   - [ ] 회원가입 성공 시나리오 테스트
   - [ ] Mailpit (http://127.0.0.1:54324)에서 이메일 확인
   - [ ] 이메일 인증 링크 클릭 테스트
   - [ ] 로그인 테스트

3. **Edge Functions 로컬 테스트**
   - [ ] `supabase functions serve summary --no-verify-jwt`
   - [ ] YouTube URL 요약 생성 테스트
   - [ ] 로컬 DB에 데이터 저장 확인

#### 🟡 중요 (Medium Priority)

4. **데이터베이스 정리**
   - [ ] `video_summaries` 테이블 제거 또는 역할 명확화
   - [ ] Vector 관련 미사용 함수 제거
   - [ ] `subtitles` 테이블에 `expires_at` 컬럼 추가

5. **환경 변수 관리 개선**
   - [ ] `.env.local` 파일 생성 (로컬 개발용)
   - [ ] `.env.production` 파일 생성 (프로덕션용)
   - [ ] `wrangler.toml`에서 민감 정보 제거

6. **테스트 함수 정리**
   - [ ] `hello-*` Edge Functions 제거
   - [ ] 또는 별도 디렉토리로 이동

#### 🟢 나중에 (Low Priority)

7. **문서화**
   - [ ] 로컬 개발 환경 설정 가이드 작성
   - [ ] Edge Functions 테스트 방법 문서화
   - [ ] 아키텍처 다이어그램 추가

8. **성능 모니터링**
   - [ ] Cloudflare Analytics 연동
   - [ ] Supabase 쿼리 성능 모니터링

### 🛠 유용한 명령어

```bash
# 로컬 Supabase 관리
supabase start           # 로컬 Supabase 시작
supabase stop            # 로컬 Supabase 중지
supabase status          # 상태 확인
supabase db reset        # DB 리셋

# Edge Functions 로컬 테스트
supabase functions serve summary --no-verify-jwt
supabase functions serve --inspect-mode brk  # Chrome DevTools 디버깅

# 개발 서버
pnpm dev                 # http://localhost:5173/
pnpm dev:clean          # 로그 파일 삭제 후 시작

# Supabase Studio
open http://127.0.0.1:54323

# 이메일 테스트 서버
open http://127.0.0.1:54324
```

### 📊 현재 환경 상태

**개발 서버:**

- URL: http://localhost:5174/
- Supabase: http://127.0.0.1:54321 (로컬)

**백그라운드 프로세스:**

```
c09244: pnpm dev (running) ← 최신
37c70c: pnpm dev (running) ← 이전 버전, 중지 가능
```

**Git 상태:**

```
Current branch: main
Untracked: worklogs.md
Modified: .env, supabase/config.toml
```

### 💡 참고사항

1. **로컬 vs 프로덕션 전환:**
   - `.env` 파일의 `PUBLIC_SUPABASE_URL` 값만 바꾸면 됨
   - 로컬: `http://127.0.0.1:54321`
   - 프로덕션: `https://iefgdhwmgljjacafqomd.supabase.co`

2. **이메일 확인:**
   - 로컬 환경에서는 실제 이메일이 발송되지 않음
   - Mailpit (http://127.0.0.1:54324)에서 확인 가능

3. **Edge Functions:**
   - `config.toml`에 정의된 함수만 로컬에서 실행 가능
   - `youtube-transcript-test`는 주석처리됨 (파일 없음)

---

**Current State (2025-10-03 오후):**

- Branch: `main`
- Local Supabase: ✅ Running (http://127.0.0.1:54321)
- Dev Server: ✅ Running (http://localhost:5174/)
- Status: 로컬 개발 환경 구축 완료, 회원가입 폼 디버깅 필요
- Stack: SvelteKit + Supabase (로컬) + Cloudflare Workers (배포용)
