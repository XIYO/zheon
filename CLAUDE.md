- 수파베이스 모든 연결은 리모트 서버와 한다. 로컬 테스튼는 필요 없다.

## 에러 핸들링

### Supabase Go 스타일 에러 처리
Supabase는 Go 스타일의 명시적 에러 처리를 사용합니다:

```js
const { data, error: dbError } = await supabase
  .from('table')
  .select('*');

if (dbError) throw error(500, dbError.message);
return data;
```

### 이유
- **명시적**: try-catch 없이도 에러를 명시적으로 확인 가능
- **가독성**: 들여쓰기 지옥 방지, 한 줄로 에러 처리
- **타입 안전**: error가 null이면 data가 유효함을 보장
- **조회 결과 없음**: 빈 배열 `[]` 반환 (null 아님), `?? []` 폴백 불필요

### SvelteKit 에러 처리
`throw error()`는 자동으로 `+error.svelte`를 렌더링:

```js
if (dbError) throw error(500, dbError.message);
// 1. 개발 환경: 콘솔에 스택 트레이스 자동 출력
// 2. SvelteKit: +error.svelte 자동 렌더링
// 3. 사용자: 500 에러 페이지와 메시지 표시
```

`console.error()` 불필요 - SvelteKit이 자동 처리
- npm 사용 금지 무조건 pnpm만 사용
- 이 프로제트는 다국어를 지원해야한다 paraglidejs를 다구거용으로쓴다.

## Remote Functions

### 서버-서버 호출
- Remote Functions는 서버에서 다른 Remote Function 호출 가능
- 서버에서는 일반 함수처럼 동작

### query.batch
- 같은 macrotask 내 여러 호출을 자동으로 하나의 쿼리로 배칭
- n+1 문제 자동 해결
- 클라이언트는 단일 호출, 서버는 자동 배칭

### command/form + waitUntil 패턴
- Cloudflare Workers: waitUntil로 응답 후 백그라운드 처리
- 일반 환경: Promise로 비동기 실행
- 프론트엔드는 즉시 응답 받음, 실패해도 에러 전달 안됨
- command: 프로그래매틱 호출용
- form: HTML form 제출용

## Valibot 스키마

### optional vs nullable vs nullish
- `v.optional()`: undefined만 허용, null 거부
- `v.nullable()`: null만 허용, undefined 거부
- `v.nullish()`: null + undefined 모두 허용

### undefined 사용 원칙
- falsy 값 처리 시 `|| null` 대신 undefined 사용 (명시적 또는 암묵적)
- undefined는 JSON에서 제거되어 Supabase upsert 시 기존 값 유지
- null은 JSON에 포함되어 기존 값을 NULL로 강제 덮어씀

### 스키마 검증
- 스키마에 정의된 필드만 전달
- 함수 내부에서 자동 생성되는 필드는 스키마에서 제외하고 전달하지 않음
- 예: `updated_at`은 함수 내부에서 생성하므로 스키마와 호출 데이터에서 제외

## Supabase 인증

### session.user 사용 금지
- `session.user`는 쿠키에서 직접 읽은 검증되지 않은 데이터
- 클라이언트: session 반환 시 user 속성 제거
- 검증된 `user` 객체만 사용 (`supabase.auth.getUser()` 결과)
- 서버: `safeGetSession()` 사용 (getUser()로 JWT 검증)
- supabase 관련은 supabase mcp를 꼭 사용하기