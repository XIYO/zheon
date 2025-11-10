# 타입 에러 수정 계획 - 최우선 순위

**대상**: JSDoc 타입 누락 및 Supabase 타입 불일치 (45개 에러)
**예상 시간**: 3-4시간

---

## 📋 수정 대상 파일 목록

| 파일 | 에러 수 | 타입 | 우선순위 |
|------|---------|------|----------|
| `hooks.server.ts` | 12개 | 쿠키 콜백 + Supabase 타입 | 🔴 최우선 |
| `transcript-service.js` | 6개 | 함수 파라미터 타입 | 🔴 최우선 |
| 기타 service 파일들 | ~27개 | 함수 파라미터 타입 | 🟡 높음 |

---

## 1️⃣ hooks.server.ts 수정 (12개 에러)

### 문제 1: 쿠키 콜백 파라미터 타입 누락

**현재 코드 (27-30줄):**
```typescript
setAll: (cookiesToSet) => {
    cookiesToSet.forEach(({ name, value, options }) => {
        event.cookies.set(name, value, { ...options, path: '/' });
    });
}
```

**에러:**
- Parameter 'cookiesToSet' implicitly has an 'any' type
- Binding element 'name' implicitly has an 'any' type (3개)

**수정 방법:**
```typescript
import type { CookieSerializeOptions } from 'cookie';

setAll: (cookiesToSet: Array<{
    name: string;
    value: string;
    options: CookieSerializeOptions;
}>) => {
    cookiesToSet.forEach(({ name, value, options }) => {
        event.cookies.set(name, value, { ...options, path: '/' });
    });
}
```

### 문제 2: Supabase 클라이언트 타입 불일치

**현재 코드 (21-34줄):**
```typescript
event.locals.supabase = createServerClient(
    publicEnv.PUBLIC_SUPABASE_URL,
    publicEnv.PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
        cookies: {
            getAll: () => event.cookies.getAll(),
            setAll: (cookiesToSet) => { /* ... */ }
        }
    }
);
```

**에러:**
- Type 'string | undefined' is not assignable to type 'string'
- Supabase schema type mismatch

**수정 방법 1 - 환경 변수 검증:**
```typescript
const supabaseUrl = publicEnv.PUBLIC_SUPABASE_URL;
const supabaseKey = publicEnv.PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
}

event.locals.supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    { /* ... */ }
);
```

**수정 방법 2 - Non-null assertion (더 간단):**
```typescript
event.locals.supabase = createServerClient(
    publicEnv.PUBLIC_SUPABASE_URL!,
    publicEnv.PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { /* ... */ }
);
```

**수정 방법 3 - 타입 단언 (스키마 타입 불일치 해결):**
```typescript
import type { Database } from '$lib/types/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';

event.locals.supabase = createServerClient<Database>(
    publicEnv.PUBLIC_SUPABASE_URL!,
    publicEnv.PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
        cookies: {
            getAll: () => event.cookies.getAll(),
            setAll: (cookiesToSet: Array<{
                name: string;
                value: string;
                options: CookieSerializeOptions;
            }>) => {
                cookiesToSet.forEach(({ name, value, options }) => {
                    event.cookies.set(name, value, { ...options, path: '/' });
                });
            }
        }
    }
) as SupabaseClient<Database, 'public', 'public'>;
```

**✅ 최종 권장: 방법 3 (환경 변수 검증 + 타입 단언)**

---

## 2️⃣ transcript-service.js 수정 (6개 에러)

### 문제: 함수 파라미터에 JSDoc 타입 주석 누락

**현재 코드 (55-67줄):**
```javascript
/**
 * DB에서 자막 조회
 */
export async function findTranscriptInDB(supabase, videoId) {
    const { data: existing, error: checkError } = await supabase
        .from('transcripts')
        .select('id, data')
        .eq('video_id', videoId)
        .maybeSingle();

    if (checkError) {
        throw new Error(`자막 확인 실패: ${checkError.message}`);
    }

    return existing;
}
```

**에러:**
- Parameter 'supabase' implicitly has an 'any' type
- Parameter 'videoId' implicitly has an 'any' type

**수정 방법:**
```javascript
import type { Database } from '$lib/types/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * DB에서 자막 조회
 * @param {SupabaseClient<Database>} supabase - Supabase 클라이언트
 * @param {string} videoId - YouTube 영상 ID
 * @returns {Promise<{id: string, data: any} | null>}
 */
export async function findTranscriptInDB(supabase, videoId) {
    const { data: existing, error: checkError } = await supabase
        .from('transcripts')
        .select('id, data')
        .eq('video_id', videoId)
        .maybeSingle();

    if (checkError) {
        throw new Error(`자막 확인 실패: ${checkError.message}`);
    }

    return existing;
}
```

**동일한 패턴으로 수정할 함수들:**

1. **findTranscriptInDB** (55줄)
```javascript
/**
 * @param {SupabaseClient<Database>} supabase
 * @param {string} videoId
 * @returns {Promise<{id: string, data: any} | null>}
 */
export async function findTranscriptInDB(supabase, videoId) { /* ... */ }
```

2. **saveTranscriptToDB** (72줄)
```javascript
/**
 * @param {SupabaseClient<Database>} supabase
 * @param {string} videoId
 * @param {object} transcriptData
 * @returns {Promise<boolean>}
 */
export async function saveTranscriptToDB(supabase, videoId, transcriptData) { /* ... */ }
```

---

## 3️⃣ 기타 service 파일들 수정

### 패턴: 모든 서비스 함수에 동일한 JSDoc 타입 추가

**템플릿:**
```javascript
import type { Database } from '$lib/types/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * 함수 설명
 * @param {SupabaseClient<Database>} supabase - Supabase 클라이언트
 * @param {string} id - 리소스 ID
 * @param {object} [options] - 선택적 옵션
 * @returns {Promise<ReturnType>}
 */
export async function functionName(supabase, id, options) {
    // 구현
}
```

**적용 대상:**
- comment-service.js (있다면)
- summary-service.js (있다면)
- 기타 *-service.js 파일들

---

## 📝 실행 계획

### Phase 1: 핵심 인프라 수정 (1시간)
```bash
# 1. hooks.server.ts 수정
✓ 쿠키 콜백 타입 추가
✓ 환경 변수 non-null assertion
✓ Supabase 클라이언트 타입 단언
✓ adminSupabase도 동일하게 수정 (85-86줄)
```

### Phase 2: 서비스 레이어 수정 (1.5시간)
```bash
# 2. transcript-service.js 수정
✓ findTranscriptInDB 타입 추가
✓ saveTranscriptToDB 타입 추가
✓ extractTranscript는 이미 타입 있음 (확인)

# 3. 다른 service 파일들 검색 및 수정
✓ Glob으로 모든 *-service.js 찾기
✓ 동일한 패턴으로 JSDoc 추가
```

### Phase 3: Remote Functions 수정 (0.5시간)
```bash
# 4. channel.remote.ts 확인
✓ 이미 타입이 잘 정의되어 있음 (Valibot 스키마 사용)
✓ 다른 remote 파일들도 확인

# 5. API routes 수정
✓ api/summaries/[id]/analyze/+server.ts 확인 및 수정
```

### Phase 4: 검증 (0.5시간)
```bash
# 6. 타입 체크 실행
pnpm check

# 7. 에러 수 확인
# 목표: 111개 → 66개 이하 (45개 감소)

# 8. 커밋 및 푸시
git add .
git commit -m "fix: add explicit types for all service functions

- Add JSDoc types to transcript-service.js
- Fix Supabase client types in hooks.server.ts
- Add cookie callback parameter types
- Resolve 45 type errors related to implicit 'any' types"

git push
```

---

## ✅ 성공 기준

- [ ] `pnpm check` 에러 수: 111개 → 66개 이하
- [ ] hooks.server.ts 에러: 12개 → 0개
- [ ] transcript-service.js 에러: 6개 → 0개
- [ ] 모든 service 함수에 명시적 타입 존재
- [ ] 빌드 성공: `pnpm build`

---

## 🚀 시작 명령어

```bash
# 1. 타입 체크로 현재 상태 확인
pnpm check 2>&1 | tee type-errors-before.log

# 2. 수정 시작
# (각 파일 수정)

# 3. 타입 체크로 개선 확인
pnpm check 2>&1 | tee type-errors-after.log

# 4. 에러 수 비교
echo "Before: $(grep -c 'Error:' type-errors-before.log)"
echo "After: $(grep -c 'Error:' type-errors-after.log)"
```

---

## 💡 주의사항

1. **JavaScript 파일에서 TypeScript 타입 import**
   ```javascript
   // ✅ 올바른 방법 (타입만 import)
   import type { Database } from '$lib/types/database.types';
   import type { SupabaseClient } from '@supabase/supabase-js';

   // ❌ 잘못된 방법 (런타임 import)
   import { Database } from '$lib/types/database.types';
   ```

2. **JSDoc 주석 위치**
   ```javascript
   // ✅ 함수 바로 위에
   /**
    * @param {string} id
    */
   export async function func(id) {}

   // ❌ 멀리 떨어진 위치
   /**
    * @param {string} id
    */

   export async function func(id) {}
   ```

3. **Non-null assertion 사용 조건**
   - 환경 변수가 확실히 존재할 때만 사용
   - 런타임에서 undefined 가능성 있으면 명시적 검증 필요

---

이 계획대로 진행하시겠습니까? 승인하시면 바로 수정 작업을 시작하겠습니다.
