# 전(展, Zheon)

<div align="center">
  <strong>유튜브 영상을 직접 보지 않고도 인공지능이 영상을 전개하여 무료 인사이트 제공 솔루션</strong>
  <br />
  <br />
  <a href="https://zheon.xiyo.dev">🌐 Live Demo</a>
</div>

---

## 📖 프로젝트 소개

Zheon은 YouTube 영상의 자막과 댓글을 AI로 분석하여 핵심 내용을 요약하고, 커뮤니티 반응을 한눈에 파악할 수 있는 웹 애플리케이션입니다. 긴 영상을 끝까지 보지 않아도 핵심 내용과 시청자 반응을 빠르게 이해할 수 있습니다.

---

## ✨ 주요 기능

- **AI 요약**: Gemini API를 활용한 영상 자막 요약
- **커뮤니티 분석**: 댓글 기반 감정 분석, 연령대 분석, 핵심 의견 추출
- **콘텐츠 메트릭**: 교육성, 오락성, 정확성, 명확성, 깊이 등 5가지 지표로 콘텐츠 평가
- **자동 카테고리/태그**: AI 기반 자동 분류

---

## 🛠 기술 스택

### Frontend
- **SvelteKit 2** - Svelte 5 기반 풀스택 프레임워크
- **Tailwind CSS 4** - 유틸리티 퍼스트 CSS 프레임워크
- **Skeleton UI** - Svelte 전용 UI 컴포넌트 라이브러리

### Backend
- **Supabase** - PostgreSQL 기반 BaaS
- **Supabase Realtime** - 실시간 데이터 동기화
- **Gemini API** - Google AI 모델을 활용한 요약 생성

### Development
- **TypeScript** - 타입 안전성을 위한 정적 타입 언어
- **Bun** - 빠른 JavaScript 런타임 및 패키지 매니저
- **Vitest** - 단위 테스트 프레임워크
- **Playwright** - E2E 테스트 프레임워크

---

## 🚀 설치 및 사용법

### 사전 요구사항

Node.js 18+ 또는 Bun 런타임이 필요합니다.

### 1. API 키 발급

프로젝트 실행을 위해 다음 2개의 API 키를 발급받아야 합니다:

#### 1) Gemini API Key
1. [Google AI Studio](https://aistudio.google.com/apikey) 접속
2. "Create API Key" 클릭하여 키 생성
3. 생성된 키 복사

#### 2) Supabase Keys
1. [Supabase](https://supabase.com) 계정 생성 및 프로젝트 생성
2. Project Settings → API 메뉴 이동
3. 다음 3개 값 복사:
   - `Project URL` (PUBLIC_SUPABASE_URL)
   - `anon public` key (PUBLIC_SUPABASE_PUBLISHABLE_KEY)
   - `service_role` key (SUPABASE_SECRET_KEY)

### 2. 프로젝트 설정

```bash
# 리포지토리 클론
git clone https://github.com/XIYO/zheon.git
cd zheon

# 의존성 설치
bun install

# 환경 변수 설정
cp .env.sample .env
```

### 3. 환경 변수 입력

`.env` 파일을 열어 발급받은 API 키들을 입력합니다:

```bash
# AI API Keys - Gemini API Key 필수
GEMINI_API_KEY=여기에-발급받은-gemini-키-입력
GEMINI_MODEL=gemini-2.5-flash-lite

# Supabase - 필수
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_PUBLISHABLE_KEY=여기에-발급받은-publishable-키-입력
SUPABASE_SECRET_KEY=여기에-발급받은-secret-키-입력
```

### 4. 데이터베이스 설정

Supabase 프로젝트에 필요한 테이블을 생성합니다:

```bash
# Supabase CLI 설치 (없는 경우)
bun install -g supabase

# 마이그레이션 실행
bun supabase db push
```

### 5. 실행

#### 개발 모드
```bash
bun run dev
```
브라우저에서 http://localhost:7777 접속

#### 프로덕션 빌드
```bash
# 빌드
bun run build

# 프리뷰
bun run preview
```
브라우저에서 http://localhost:17777 접속

---

## 📝 사용 방법

1. 메인 페이지에서 YouTube 영상 URL 입력
2. AI가 자동으로 자막과 댓글을 분석
3. 요약, 카테고리, 메트릭, 커뮤니티 인사이트 확인
4. 목록에서 다른 요약된 영상들 탐색

---

## 🧪 테스트

```bash
# 단위 테스트
bun run test:unit

# E2E 테스트
bun run test:e2e

# 모든 테스트
bun run test
```

---

## 📦 빌드

```bash
# 프로덕션 빌드
bun run build

# 빌드 결과는 build/ 디렉토리에 생성됩니다
```

---

## 🤝 기여하기

프로젝트에 기여하고 싶으시다면:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

---

## 🔗 링크

- [Live Demo](https://zheon.xiyo.dev)
- [GitHub Repository](https://github.com/XIYO/zheon)
- [Issues](https://github.com/XIYO/zheon/issues)

---

## 🙏 감사의 말

이 프로젝트는 다음 오픈소스 프로젝트들을 사용합니다:

- [SvelteKit](https://kit.svelte.dev/)
- [Supabase](https://supabase.com/)
- [Gemini API](https://ai.google.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Skeleton UI](https://www.skeleton.dev/)
