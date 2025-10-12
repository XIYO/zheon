# Supabase CLI 완벽 가이드

> **버전**: Supabase CLI 2.48.3
> **설치 방법**: `brew install supabase/tap/supabase`

이 문서는 Supabase CLI의 모든 명령어와 사용법을 상세하게 설명합니다. Supabase CLI는 로컬 개발 환경 구축부터 프로덕션 배포까지 전체 워크플로우를 지원합니다.

## 목차

1. [빠른 시작](#빠른-시작)
2. [로컬 개발](#로컬-개발)
3. [데이터베이스 관리](#데이터베이스-관리)
4. [Edge Functions](#edge-functions)
5. [마이그레이션](#마이그레이션)
6. [타입 생성](#타입-생성)
7. [시크릿 관리](#시크릿-관리)
8. [프로젝트 관리](#프로젝트-관리)
9. [전역 플래그](#전역-플래그)

---

## 빠른 시작

### `supabase bootstrap`

스타터 템플릿으로부터 Supabase 프로젝트를 부트스트랩합니다.

```bash
supabase bootstrap
```

**설명**: 이 명령어는 사전 구성된 템플릿을 사용하여 새 프로젝트를 빠르게 시작할 수 있게 해줍니다. Next.js, SvelteKit, Flutter 등 다양한 프레임워크 템플릿을 제공합니다.

---

## 로컬 개발

### `supabase init`

로컬 프로젝트를 초기화합니다.

```bash
supabase init
```

**설명**: 현재 디렉토리에 `supabase/` 폴더를 생성하고 기본 설정 파일(`config.toml`)을 만듭니다. 모든 로컬 개발의 시작점입니다.

**생성되는 구조**:
```
supabase/
├── config.toml          # 프로젝트 설정
├── seed.sql             # 초기 데이터
└── migrations/          # 마이그레이션 파일들
```

### `supabase start`

로컬 개발을 위한 Supabase 컨테이너들을 시작합니다.

```bash
supabase start
```

**주요 플래그**:
- `-x, --exclude strings`: 시작하지 않을 컨테이너 지정
  ```bash
  supabase start --exclude gotrue,realtime
  ```
- `--ignore-health-check`: 비정상 서비스를 무시하고 exit 0 반환

**시작되는 서비스들**:
- `postgres`: PostgreSQL 데이터베이스
- `gotrue`: 인증 서비스
- `postgrest`: REST API
- `realtime`: 실시간 구독
- `storage-api`: 스토리지 서비스
- `kong`: API 게이트웨이
- `studio`: Supabase Studio (웹 대시보드)
- `edge-runtime`: Deno Edge Functions 런타임
- `logflare`: 로그 수집
- `vector`: 로그 처리
- `imgproxy`: 이미지 변환
- `postgres-meta`: 데이터베이스 메타데이터 API
- `mailpit`: 이메일 테스팅 서버
- `supavisor`: 연결 풀링

**실행 후**:
- Studio: http://localhost:54323
- API URL: http://localhost:54321
- DB: postgresql://postgres:postgres@localhost:54322/postgres

### `supabase stop`

모든 로컬 Supabase 컨테이너를 중지합니다.

```bash
supabase stop
```

**설명**: Docker 컨테이너들을 정리하고 중지합니다. 데이터는 보존됩니다(볼륨 제거 시 `--no-backup` 사용).

### `supabase status`

로컬 Supabase 컨테이너 상태를 표시합니다.

```bash
supabase status
```

**출력 형식**:
```
         API URL: http://localhost:54321
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
```

### `supabase link`

Supabase 프로젝트에 연결합니다.

```bash
supabase link --project-ref <project-ref>
```

**설명**: 로컬 프로젝트를 원격 Supabase 프로젝트와 연결합니다. 프로젝트 ref는 대시보드 URL에서 확인할 수 있습니다.

**예시**:
```bash
supabase link --project-ref iefgdhwmgljjacafqomd
```

### `supabase unlink`

Supabase 프로젝트 연결을 해제합니다.

```bash
supabase unlink
```

### `supabase login`

액세스 토큰으로 인증합니다.

```bash
supabase login
```

**설명**: 브라우저를 열어 Supabase 대시보드에 로그인하고 CLI 액세스 토큰을 생성합니다. 토큰은 `~/.supabase/access-token`에 저장됩니다.

### `supabase logout`

로컬에서 로그아웃하고 액세스 토큰을 삭제합니다.

```bash
supabase logout
```

### `supabase services`

모든 Supabase 서비스의 버전을 표시합니다.

```bash
supabase services
```

### `supabase test`

로컬 Supabase 컨테이너에서 테스트를 실행합니다.

```bash
supabase test
```

### `supabase inspect`

Supabase 프로젝트를 검사하는 도구들입니다.

```bash
supabase inspect
```

**설명**: 데이터베이스 성능, 인덱스, 테이블 크기 등을 분석하는 다양한 도구를 제공합니다.

### `supabase seed`

`supabase/config.toml`에서 Supabase 프로젝트를 시드합니다.

```bash
supabase seed
```

**설명**: `supabase/seed.sql` 파일을 실행하여 데이터베이스에 초기 데이터를 삽입합니다.

---

## 데이터베이스 관리

### `supabase db`

PostgreSQL 데이터베이스를 관리합니다.

#### `supabase db start`

로컬 Postgres 데이터베이스를 시작합니다.

```bash
supabase db start
```

#### `supabase db reset`

로컬 데이터베이스를 현재 마이그레이션으로 리셋합니다.

```bash
supabase db reset
```

**설명**: 데이터베이스를 완전히 삭제하고 모든 마이그레이션을 다시 실행합니다. 개발 중 깨끗한 상태로 돌아갈 때 유용합니다.

**주의**: 로컬 데이터가 모두 삭제됩니다!

#### `supabase db diff`

로컬 데이터베이스의 스키마 변경사항을 diff합니다.

```bash
# 로컬 데이터베이스와 마이그레이션 파일 비교 (기본값)
supabase db diff

# diff를 새 마이그레이션 파일로 저장
supabase db diff -f add_new_table

# 연결된 프로젝트와 비교
supabase db diff --linked

# 특정 스키마만 포함
supabase db diff -s public,auth
```

**주요 플래그**:
- `-f, --file string`: diff를 새 마이그레이션 파일에 저장
- `--linked`: 로컬 마이그레이션과 연결된 프로젝트 비교
- `--local`: 로컬 마이그레이션과 로컬 데이터베이스 비교 (기본값)
- `-s, --schema strings`: 포함할 스키마 (쉼표로 구분)
- `--use-migra`: migra를 사용하여 diff 생성 (기본값)
- `--use-pg-schema`: pg-schema-diff 사용
- `--use-pgadmin`: pgAdmin 사용
- `--db-url string`: 특정 데이터베이스 URL과 비교

**워크플로우 예시**:
```bash
# 1. Studio에서 수동으로 테이블 생성
# 2. 변경사항을 마이그레이션 파일로 저장
supabase db diff -f create_users_table
# 3. 생성된 파일 확인
cat supabase/migrations/20231215120000_create_users_table.sql
```

#### `supabase db push`

새 마이그레이션을 원격 데이터베이스에 푸시합니다.

```bash
# 연결된 프로젝트에 푸시 (기본값)
supabase db push

# 실제 적용하지 않고 dry-run
supabase db push --dry-run

# 시드 데이터 포함
supabase db push --include-seed

# 커스텀 롤 포함
supabase db push --include-roles
```

**주요 플래그**:
- `--linked`: 연결된 프로젝트에 푸시 (기본값)
- `--local`: 로컬 데이터베이스에 푸시
- `--dry-run`: 실제 적용하지 않고 실행될 마이그레이션만 출력
- `--include-all`: 원격 히스토리에 없는 모든 마이그레이션 포함
- `--include-roles`: `supabase/roles.sql`의 커스텀 롤 포함
- `--include-seed`: 시드 데이터 포함
- `--db-url string`: 특정 데이터베이스 URL에 푸시
- `-p, --password string`: 원격 Postgres 비밀번호

**중요**: 프로덕션에 푸시하기 전에 항상 `--dry-run`으로 먼저 확인하세요!

#### `supabase db pull`

원격 데이터베이스에서 스키마를 가져옵니다.

```bash
supabase db pull
```

**설명**: 원격 데이터베이스의 현재 스키마를 로컬 마이그레이션 파일로 가져옵니다. 팀원이 만든 변경사항을 동기화할 때 유용합니다.

#### `supabase db dump`

원격 데이터베이스에서 데이터나 스키마를 덤프합니다.

```bash
# 데이터 덤프
supabase db dump --data-only > data.sql

# 스키마 덤프
supabase db dump --schema-only > schema.sql

# 전체 덤프
supabase db dump > full_backup.sql
```

#### `supabase db lint`

로컬 데이터베이스의 타이핑 에러를 확인합니다.

```bash
supabase db lint
```

**설명**: plpgsql 함수, 트리거 등의 SQL 코드에서 문법 오류와 타입 오류를 검사합니다.

---

## Edge Functions

### `supabase functions`

Supabase Edge Functions를 관리합니다.

#### `supabase functions new`

새 Function을 로컬에 생성합니다.

```bash
supabase functions new hello-world
```

**생성되는 구조**:
```
supabase/functions/hello-world/
└── index.ts
```

**기본 템플릿**:
```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

Deno.serve(async (req) => {
  const data = {
    message: `Hello from Edge Function!`,
  }

  return new Response(
    JSON.stringify(data),
    { headers: { "Content-Type": "application/json" } },
  )
})
```

#### `supabase functions serve`

모든 Functions를 로컬에서 serve합니다.

```bash
# 기본 실행
supabase functions serve

# JWT 검증 비활성화
supabase functions serve --no-verify-jwt

# 디버깅 모드 (Chrome DevTools)
supabase functions serve --inspect-mode brk

# 환경 변수 파일 지정
supabase functions serve --env-file ./local.env

# import map 지정
supabase functions serve --import-map ./import_map.json
```

**주요 플래그**:
- `--env-file string`: Function 환경에 로드할 env 파일 경로
- `--import-map string`: import map 파일 경로
- `--inspect`: `--inspect-mode brk`의 별칭
- `--inspect-main`: 메인 워커 디버깅 허용
- `--inspect-mode [run|brk|wait]`: 디버깅용 인스펙터 활성화
  - `run`: 즉시 실행
  - `brk`: 첫 줄에서 중단
  - `wait`: 디버거 연결 대기
- `--no-verify-jwt`: JWT 검증 비활성화

**디버깅 워크플로우**:
```bash
# 1. 디버그 모드로 서빙
supabase functions serve --inspect-mode brk

# 2. Chrome 브라우저에서 chrome://inspect 열기

# 3. "Remote Target"에서 함수 선택하여 DevTools 열기
```

**로컬 테스트**:
```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/hello-world' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  --header 'Content-Type: application/json' \
  --data '{"name":"Functions"}'
```

#### `supabase functions deploy`

연결된 Supabase 프로젝트에 Function을 배포합니다.

```bash
# 특정 함수 배포
supabase functions deploy hello-world

# 모든 함수 배포
supabase functions deploy

# JWT 검증 비활성화하고 배포
supabase functions deploy hello-world --no-verify-jwt

# import map과 함께 배포
supabase functions deploy hello-world --import-map ./import_map.json

# 병렬 배포 (여러 함수)
supabase functions deploy --jobs 4

# 로컬에 없는 원격 함수 삭제 (prune)
supabase functions deploy --prune

# Management API 사용하여 번들링
supabase functions deploy --use-api

# Docker 사용하여 번들링 (기본값)
supabase functions deploy --use-docker
```

**주요 플래그**:
- `--import-map string`: import map 파일 경로
- `-j, --jobs uint`: 최대 병렬 작업 수 (기본값: 1)
- `--no-verify-jwt`: Function의 JWT 검증 비활성화
- `--project-ref string`: Supabase 프로젝트 ref
- `--prune`: Supabase에는 있지만 로컬에 없는 함수 삭제
- `--use-api`: Management API로 함수 번들링
- `--use-docker`: Docker로 함수 번들링 (기본값)

**배포 전 체크리스트**:
1. `supabase functions serve`로 로컬 테스트 완료
2. 환경 변수를 `supabase secrets set`으로 설정
3. `--dry-run` 없지만 `--prune` 사용 시 주의
4. 배포 후 원격에서 테스트

#### `supabase functions list`

Supabase의 모든 Functions를 나열합니다.

```bash
supabase functions list
```

#### `supabase functions download`

Supabase에서 Function을 다운로드합니다.

```bash
supabase functions download hello-world
```

**설명**: 원격에 배포된 함수 코드를 로컬로 가져옵니다.

#### `supabase functions delete`

Supabase에서 Function을 삭제합니다.

```bash
supabase functions delete hello-world
```

---

## 마이그레이션

### `supabase migration`

데이터베이스 마이그레이션 스크립트를 관리합니다.

#### `supabase migration new`

빈 마이그레이션 스크립트를 생성합니다.

```bash
supabase migration new create_users_table
```

**생성되는 파일**:
```
supabase/migrations/20231215120000_create_users_table.sql
```

**파일명 규칙**: `{timestamp}_{description}.sql`

#### `supabase migration list`

로컬 및 원격 마이그레이션을 나열합니다.

```bash
# 로컬 마이그레이션 목록
supabase migration list

# 원격 마이그레이션과 비교
supabase migration list --linked
```

**출력 예시**:
```
        LOCAL      │   REMOTE   │     TIME (UTC)
  ─────────────────┼────────────┼──────────────────────
    20231215120000 │ 2023121512 │ 2023-12-15 12:00:00
```

#### `supabase migration up`

로컬 데이터베이스에 대기 중인 마이그레이션을 적용합니다.

```bash
supabase migration up
```

#### `supabase migration down`

마지막 n개 버전까지 적용된 마이그레이션을 되돌립니다.

```bash
# 마지막 1개 되돌리기
supabase migration down

# 마지막 3개 되돌리기
supabase migration down --version 3
```

**주의**: 프로덕션에서는 매우 신중하게 사용하세요!

#### `supabase migration fetch`

히스토리 테이블에서 마이그레이션 파일을 가져옵니다.

```bash
supabase migration fetch
```

**설명**: 원격 데이터베이스의 `supabase_migrations.schema_migrations` 테이블에서 마이그레이션 히스토리를 가져옵니다.

#### `supabase migration repair`

마이그레이션 히스토리 테이블을 복구합니다.

```bash
supabase migration repair
```

**설명**: 마이그레이션 히스토리가 손상되었을 때 복구합니다. 일반적으로 사용할 일이 없어야 합니다.

#### `supabase migration squash`

여러 마이그레이션을 단일 파일로 squash합니다.

```bash
supabase migration squash
```

**설명**: 많은 마이그레이션 파일들을 하나로 합쳐서 관리를 단순화합니다. 주로 개발 초기에 사용합니다.

---

## 타입 생성

### `supabase gen types`

Postgres 스키마에서 타입을 생성합니다.

#### TypeScript (기본값)

```bash
# 로컬 데이터베이스에서 생성
supabase gen types --local > src/lib/database.types.ts

# 연결된 프로젝트에서 생성
supabase gen types --linked > src/lib/database.types.ts

# 특정 프로젝트에서 생성
supabase gen types --project-id abc-def-123 > types/supabase.ts

# 특정 스키마만 포함
supabase gen types --linked --schema public --schema auth > types/database.ts

# 데이터베이스 URL에서 직접 생성
supabase gen types --db-url 'postgresql://user:pass@host:5432/db' > types.ts

# PostgREST v9 호환 모드
supabase gen types --linked --postgrest-v9-compat > types.ts
```

#### Go

```bash
supabase gen types --lang=go --linked > types/database.go
```

#### Swift

```bash
# internal 접근 제어 (기본값)
supabase gen types --lang=swift --linked > Database.swift

# public 접근 제어
supabase gen types --lang=swift --swift-access-control public > Database.swift
```

**주요 플래그**:
- `--lang [typescript|go|swift]`: 출력 언어 (기본값: typescript)
- `--local`: 로컬 dev 데이터베이스에서 생성
- `--linked`: 연결된 프로젝트에서 생성
- `--project-id string`: 프로젝트 ID로 생성
- `--db-url string`: 데이터베이스 URL에서 생성
- `-s, --schema strings`: 포함할 스키마 (쉼표로 구분)
- `--postgrest-v9-compat`: PostgREST v9 이하와 호환되는 타입 생성
- `--swift-access-control [internal|public]`: Swift 타입의 접근 제어
- `--query-timeout duration`: 데이터베이스 쿼리 최대 타임아웃 (기본값: 15s)

**생성된 TypeScript 타입 사용 예시**:
```typescript
import { Database } from './lib/database.types'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient<Database>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

// 이제 타입이 자동으로 추론됩니다
const { data, error } = await supabase
  .from('users')
  .select('*')
```

### `supabase gen bearer-jwt`

Data API 접근용 Bearer Auth JWT를 생성합니다.

```bash
supabase gen bearer-jwt
```

**설명**: 테스트용 JWT 토큰을 생성합니다. `supabase functions serve`에서 인증 테스트할 때 유용합니다.

### `supabase gen signing-key`

JWT 서명 키를 생성합니다.

```bash
supabase gen signing-key
```

---

## 시크릿 관리

### `supabase secrets`

Supabase 시크릿(환경 변수)을 관리합니다.

#### `supabase secrets set`

Supabase에 시크릿을 설정합니다.

```bash
# 단일 시크릿 설정
supabase secrets set MY_SECRET=my_value

# 여러 시크릿 설정
supabase secrets set API_KEY=xyz DATABASE_URL=postgresql://...

# .env 파일에서 설정
supabase secrets set --env-file ./prod.env

# 특정 프로젝트에 설정
supabase secrets set MY_SECRET=value --project-ref abc-def-123
```

**중요**:
- Edge Functions는 자동으로 재배포되어 새 시크릿을 사용합니다
- 시크릿은 암호화되어 저장되며 Edge Functions 런타임에서만 접근 가능합니다
- Git에 커밋하지 마세요!

**Edge Function에서 사용**:
```typescript
Deno.serve(async (req) => {
  const apiKey = Deno.env.get('API_KEY')
  const dbUrl = Deno.env.get('DATABASE_URL')

  // 환경 변수 사용
})
```

#### `supabase secrets list`

Supabase의 모든 시크릿을 나열합니다.

```bash
supabase secrets list
```

**출력 예시**:
```
NAME           │ DIGEST
───────────────┼─────────────────
API_KEY        │ 8a2f3b1c...
DATABASE_URL   │ 9c4e5d2a...
```

**설명**: 보안상 실제 값은 표시되지 않고 digest만 표시됩니다.

#### `supabase secrets unset`

Supabase의 시크릿을 제거합니다.

```bash
# 단일 시크릿 제거
supabase secrets unset MY_SECRET

# 여러 시크릿 제거
supabase secrets unset API_KEY DATABASE_URL
```

---

## 프로젝트 관리

### `supabase projects`

Supabase 프로젝트를 관리합니다.

#### `supabase projects list`

모든 Supabase 프로젝트를 나열합니다.

```bash
supabase projects list
```

**출력 예시**:
```
┌───────────────────┬─────────────┬──────────┐
│       NAME        │ PROJECT REF │  REGION  │
├───────────────────┼─────────────┼──────────┤
│ my-awesome-app    │ abc123def   │ us-east-1│
│ another-project   │ xyz789ghi   │ eu-west-1│
└───────────────────┴─────────────┴──────────┘
```

#### `supabase projects create`

Supabase에 프로젝트를 생성합니다.

```bash
supabase projects create my-project --org-id my-org --region us-east-1
```

**주요 옵션**:
- `--org-id`: 조직 ID (필수)
- `--region`: 프로젝트 리전 (예: us-east-1, eu-west-1, ap-southeast-1)
- `--db-password`: 데이터베이스 비밀번호

#### `supabase projects delete`

Supabase 프로젝트를 삭제합니다.

```bash
supabase projects delete --project-ref abc-def-123
```

**주의**: 되돌릴 수 없습니다! 모든 데이터가 영구적으로 삭제됩니다.

#### `supabase projects api-keys`

Supabase 프로젝트의 모든 API 키를 나열합니다.

```bash
supabase projects api-keys --project-ref abc-def-123
```

**출력 예시**:
```
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 추가 관리 API

### `supabase branches`

Supabase 프리뷰 브랜치를 관리합니다.

```bash
supabase branches
```

**설명**: 프리뷰 브랜치는 프로덕션에 영향 없이 변경사항을 테스트할 수 있는 격리된 환경입니다.

### `supabase orgs`

Supabase 조직을 관리합니다.

```bash
supabase orgs list
```

### `supabase storage`

Supabase Storage 객체를 관리합니다.

```bash
supabase storage
```

### `supabase backups`

Supabase 물리적 백업을 관리합니다.

```bash
supabase backups list --project-ref abc-def-123
```

### `supabase domains`

Supabase 프로젝트의 커스텀 도메인을 관리합니다.

```bash
supabase domains
```

### `supabase ssl-enforcement`

SSL 강제 설정을 관리합니다.

```bash
supabase ssl-enforcement
```

### `supabase postgres-config`

Postgres 데이터베이스 설정을 관리합니다.

```bash
supabase postgres-config
```

### `supabase network-restrictions`

네트워크 제한을 관리합니다.

```bash
supabase network-restrictions
```

### `supabase network-bans`

네트워크 밴을 관리합니다.

```bash
supabase network-bans
```

### `supabase sso`

프로젝트의 Single Sign-On (SSO) 인증을 관리합니다.

```bash
supabase sso
```

### `supabase snippets`

Supabase SQL 스니펫을 관리합니다.

```bash
supabase snippets
```

### `supabase encryption`

Supabase 프로젝트의 암호화 키를 관리합니다.

```bash
supabase encryption
```

### `supabase vanity-subdomains`

Supabase 프로젝트의 vanity 서브도메인을 관리합니다.

```bash
supabase vanity-subdomains
```

### `supabase config`

Supabase 프로젝트 설정을 관리합니다.

```bash
supabase config
```

---

## 전역 플래그

모든 명령어에서 사용할 수 있는 플래그들입니다.

### 출력 형식

```bash
--output, -o [env|pretty|json|toml|yaml]
```

**설명**: 상태 변수의 출력 형식을 지정합니다.

**예시**:
```bash
# JSON 형식으로 출력
supabase status -o json

# YAML 형식으로 출력
supabase projects list -o yaml
```

### 디버그 모드

```bash
--debug
```

**설명**: stderr로 디버그 로그를 출력합니다.

**예시**:
```bash
supabase start --debug
```

### 프로필

```bash
--profile string
```

**설명**: Supabase API 연결 시 특정 프로필을 사용합니다. (기본값: "supabase")

**사용 사례**: 여러 Supabase 계정을 관리할 때 유용합니다.

**예시**:
```bash
# 개인 프로필로 로그인
supabase login --profile personal

# 회사 프로필로 로그인
supabase login --profile company

# 특정 프로필로 프로젝트 목록 확인
supabase projects list --profile company
```

### 작업 디렉토리

```bash
--workdir string
```

**설명**: Supabase 프로젝트 디렉토리 경로를 지정합니다.

**예시**:
```bash
supabase start --workdir /path/to/my-project
```

### 자동 승인

```bash
--yes
```

**설명**: 모든 프롬프트에 yes로 자동 응답합니다.

**예시**:
```bash
# 확인 없이 프로젝트 삭제
supabase projects delete --project-ref abc-def-123 --yes
```

### DNS Resolver

```bash
--dns-resolver [native|https]
```

**설명**: 도메인 이름 조회 시 사용할 resolver를 지정합니다. (기본값: native)

**사용 사례**:
- `native`: 시스템 DNS 사용
- `https`: DNS over HTTPS (DoH) 사용 (방화벽 뒤에서 유용)

### 실험적 기능

```bash
--experimental
```

**설명**: 실험적 기능을 활성화합니다.

**주의**: 프로덕션에서는 사용하지 마세요!

### 네트워크 ID

```bash
--network-id string
```

**설명**: 생성된 네트워크 대신 지정된 Docker 네트워크를 사용합니다.

**사용 사례**: 여러 Docker 컨테이너를 같은 네트워크에서 실행할 때 유용합니다.

### 지원 티켓 생성

```bash
--create-ticket
```

**설명**: CLI 에러 발생 시 자동으로 지원 티켓을 생성합니다.

---

## 일반적인 워크플로우

### 새 프로젝트 시작

```bash
# 1. 프로젝트 초기화
supabase init

# 2. 로컬 개발 환경 시작
supabase start

# 3. Studio 열기
open http://localhost:54323

# 4. 원격 프로젝트 연결
supabase link --project-ref your-project-ref

# 5. 기존 스키마 가져오기 (선택사항)
supabase db pull
```

### 데이터베이스 변경 워크플로우

```bash
# 방법 1: 마이그레이션 파일 직접 작성
supabase migration new add_profiles_table
# supabase/migrations/xxx_add_profiles_table.sql 편집
supabase db reset  # 로컬에 적용

# 방법 2: Studio에서 변경 후 diff
# Studio에서 테이블 생성
supabase db diff -f add_profiles_table
# 생성된 마이그레이션 파일 확인 및 수정

# 원격에 배포
supabase db push --dry-run  # 먼저 확인
supabase db push             # 실제 배포
```

### Edge Function 개발 워크플로우

```bash
# 1. 새 함수 생성
supabase functions new my-function

# 2. 로컬에서 테스트
supabase functions serve

# 3. 다른 터미널에서 테스트 요청
curl -i --location --request POST 'http://localhost:54321/functions/v1/my-function' \
  --header 'Authorization: Bearer eyJ...' \
  --header 'Content-Type: application/json' \
  --data '{"test": "data"}'

# 4. 환경 변수 설정 (필요시)
supabase secrets set MY_API_KEY=secret_value

# 5. 배포
supabase functions deploy my-function

# 6. 프로덕션에서 테스트
curl -i --location --request POST 'https://your-project.supabase.co/functions/v1/my-function' \
  --header 'Authorization: Bearer your-anon-key' \
  --header 'Content-Type: application/json' \
  --data '{"test": "data"}'
```

### 타입 생성 자동화

```bash
# package.json에 스크립트 추가
{
  "scripts": {
    "types:local": "supabase gen types --local > src/lib/database.types.ts",
    "types:remote": "supabase gen types --linked > src/lib/database.types.ts"
  }
}

# 사용
pnpm types:local   # 로컬 DB에서 타입 생성
pnpm types:remote  # 원격 DB에서 타입 생성
```

### 팀 협업 워크플로우

```bash
# 팀원 A: 데이터베이스 변경
supabase db diff -f add_feature_x
git add supabase/migrations/xxx_add_feature_x.sql
git commit -m "Add feature X database schema"
git push

# 팀원 B: 변경사항 적용
git pull
supabase db reset  # 모든 마이그레이션 재실행

# 또는
supabase migration up  # 새 마이그레이션만 실행
```

---

## 문제 해결

### 로컬 환경이 시작되지 않을 때

```bash
# 모든 컨테이너 중지
supabase stop

# Docker 정리
docker system prune -a

# 다시 시작
supabase start
```

### 마이그레이션 충돌

```bash
# 마이그레이션 히스토리 확인
supabase migration list

# 로컬 DB 리셋
supabase db reset

# 원격에서 스키마 다시 가져오기
supabase db pull
```

### Edge Function 배포 실패

```bash
# 로컬에서 먼저 테스트
supabase functions serve

# 디버그 모드로 확인
supabase functions serve --inspect-mode brk

# 환경 변수 확인
supabase secrets list

# Docker 이미지 재빌드
supabase functions deploy --use-docker
```

### 타입 생성 실패

```bash
# 연결 확인
supabase status

# 데이터베이스 직접 연결 테스트
psql postgresql://postgres:postgres@localhost:54322/postgres

# 타임아웃 늘리기
supabase gen types --local --query-timeout 30s > types.ts
```

---

## 유용한 팁

### 1. 로컬 개발 속도 향상

불필요한 서비스 제외하여 시작 시간 단축:

```bash
# Realtime이 필요 없다면
supabase start --exclude realtime

# Storage가 필요 없다면
supabase start --exclude storage-api,imgproxy
```

### 2. 환경별 설정 관리

```bash
# 개발
supabase link --project-ref dev-project
supabase secrets set --env-file .env.dev

# 스테이징
supabase link --project-ref staging-project
supabase secrets set --env-file .env.staging

# 프로덕션
supabase link --project-ref prod-project
supabase secrets set --env-file .env.prod
```

### 3. CI/CD 통합

```yaml
# GitHub Actions 예시
- name: Setup Supabase CLI
  uses: supabase/setup-cli@v1
  with:
    version: latest

- name: Run migrations
  run: |
    supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
    supabase db push
  env:
    SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

- name: Deploy Edge Functions
  run: |
    supabase functions deploy --no-verify-jwt=false
```

### 4. 데이터베이스 백업

```bash
# 정기적으로 덤프 생성
supabase db dump --linked > backups/backup-$(date +%Y%m%d).sql

# 백업 복원 (로컬)
psql postgresql://postgres:postgres@localhost:54322/postgres < backup.sql
```

### 5. 마이그레이션 파일 네이밍 컨벤션

```bash
# 좋은 예
supabase migration new add_user_profiles_table
supabase migration new update_posts_add_status_column
supabase migration new create_comments_table

# 나쁜 예
supabase migration new changes
supabase migration new fix
supabase migration new update
```

---

## 추가 자료

- 공식 문서: https://supabase.com/docs
- CLI GitHub: https://github.com/supabase/cli
- Discord 커뮤니티: https://discord.supabase.com
- 예제: https://github.com/supabase/supabase/tree/master/examples

---

**마지막 업데이트**: 2025-10-12
**CLI 버전**: 2.48.3
