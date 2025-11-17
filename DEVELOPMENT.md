# 개발 가이드

## 사전 요구사항

- Bun 런타임
- Docker & Docker Compose
- Supabase CLI (선택)

## 환경 설정

### 1. API 키 발급

**Gemini API Key**: [Google AI Studio](https://aistudio.google.com/apikey)에서 발급

### 2. Supabase 설정

**로컬 개발 (권장)**

```bash
# Supabase 로컬 실행
supabase start
```

출력되는 다음 값을 `.env`에 입력:
- `API URL` → `PUBLIC_SUPABASE_URL`
- `Publishable key` → `PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `Secret key` → `SUPABASE_SECRET_KEY`

**원격 Supabase**

[Supabase](https://supabase.com)에서 프로젝트 생성 후 Settings → API에서 키 확인

### 3. 실행

```bash
# 의존성 설치
bun install

# 환경변수 설정
cp .env.sample .env
# .env 파일을 열어 API 키 입력

# Tor 프록시 실행
docker-compose up -d tor-proxy

# 개발 서버 실행
bun run dev
```

개발 서버: http://localhost:7777

## 스크립트

```bash
bun run dev          # 개발 서버
bun run build        # 빌드
bun run preview      # 미리보기
bun run check        # 타입 체크
bun run lint         # 린트
bun run format       # 포맷
bun run test         # 테스트
```
