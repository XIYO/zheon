# Zheon - YouTube 인사이트 분석 플랫폼

YouTube 영상의 자막과 댓글을 AI로 분석하여 요약, 감정, 연령대, 콘텐츠 메트릭을 제공하는 인사이트 플랫폼입니다.

## 주요 기능

### YouTube 영상 분석

- **자막 수집**: 다국어 자막 자동 추출 및 저장
- **댓글 수집**: 최대 5배치 댓글 수집 (최근 댓글 우선)
- **채널 정보**: 채널 메타데이터 및 구독자 정보 수집

### AI 기반 콘텐츠 분석

- **AI 요약**: Gemini 2.5 Flash Lite를 활용한 영상 요약 생성
- **카테고리 분류**: 계층적 카테고리 자동 분류 (우선순위 지원)
- **태그 추출**: 가중치 기반 태그 자동 생성
- **콘텐츠 메트릭**: 교육성, 오락성, 신뢰도, 명확성, 깊이 등 5가지 지표 분석 (0-100점)

### 커뮤니티 감정 분석

- **Plutchik 8축 감정 모델**: joy, trust, fear, surprise, sadness, disgust, anger, anticipation
- **VAD 모델**: Valence(긍정도), Arousal(활성도) 평균값 제공
- **감정 통계**: 주요 감정 추출, 엔트로피 계산, 감정 분포 분석
- **대표 댓글**: 각 감정별 대표 댓글 자동 선택

### 연령대 분석

- **4개 연령 그룹**: 10대, 20대, 30대, 40대+ 비율 분석
- **통계 지표**: 중앙값 나이, 성인 비율 제공
- **대표 댓글**: 각 연령대별 대표 댓글 자동 선택

### 시각화

- **레이더 차트**: 감정 분포 및 콘텐츠 메트릭 시각화
- **파이 차트**: 연령대 분포 시각화
- **Realtime 동기화**: Supabase Realtime으로 분석 결과 실시간 업데이트

### UI/UX

- **무한 스크롤**: 커서 기반 페이지네이션으로 효율적인 목록 로딩
- **다국어 지원**: Paraglide.js 기반 i18n (한국어, 영어)
- **반응형 디자인**: Tailwind CSS 4 + Skeleton UI
- **TTS 음성 생성**: 요약문을 ElevenLabs TTS로 음성 파일 생성
- **오디오 플레이어**: 요약 음성 재생 기능

### 기술적 특징

- **SSR**: SvelteKit 2 기반 서버사이드 렌더링
- **Remote Functions**: SvelteKit 실험적 기능으로 타입 안전한 서버 함수
- **Async Components**: Svelte 5 top-level await 지원
- **Svelte Stores**: Context API 기반 타입 안전한 상태 관리
- **Go 스타일 에러 처리**: `{ data, error }` 패턴으로 명시적 에러 관리
- **백그라운드 작업**: Promise 반환 없이 백그라운드 분석 처리
- **YouTube Proxy**: Tor SOCKS5 프록시를 통한 YouTube 접근

## 예정된 기능

### YouTube 자막 번역 및 한국어 TTS 오버레이

- **자막 번역**: 영어 자막을 한국어로 AI 번역 (문맥 유지)
- **세그먼트별 TTS**: 번역된 자막을 세그먼트별로 음성 파일 생성
- **자막 오버레이**: YouTube iframe 위에 한국어 자막 실시간 표시
- **음성 동기화**: YouTube iframe API로 영상 재생 시간과 한국어 음성 동기화
- **음성 토글**: 원본 음성 vs 한국어 음성 전환 기능
- **자막 커스터마이징**: 폰트 크기, 위치 조절, 이중 자막 지원

상세 구현 계획: [docs/todos/youtube-subtitle-translation-tts-overlay.md](docs/todos/youtube-subtitle-translation-tts-overlay.md)

## 기술 스택

### Frontend

- **SvelteKit 2**: SSR 프레임워크
- **Svelte 5**: 최신 Svelte (Runes, Async Components)
- **Tailwind CSS 4**: 유틸리티 CSS 프레임워크
- **Skeleton UI**: UI 컴포넌트 라이브러리
- **Bits UI**: 헤드리스 컴포넌트
- **@lucide/svelte**: 아이콘 라이브러리

### Backend & Database

- **Supabase**: PostgreSQL + Auth + Realtime + Storage
- **Cloudflare Workers**: 프로덕션 배포 환경
- **Deno**: Edge Functions 런타임

### AI & Analysis

- **Gemini 2.5 Flash Lite**: AI 분석 엔진
- **Vercel AI SDK**: AI 통합 라이브러리
- **Plutchik 감정 모델**: 8축 감정 분석
- **VAD 모델**: Valence-Arousal-Dominance 감정 분석

### Media & i18n

- **ElevenLabs**: TTS 음성 생성
- **YouTubei.js**: YouTube 데이터 스크래핑
- **Paraglide.js**: 다국어 지원

### Testing & Quality

- **Vitest**: 단위 테스트
- **Playwright**: E2E 테스트
- **ESLint + Prettier**: 코드 품질 관리
- **Deno Test**: Edge Function 테스트

## 프로젝트 구조

```text
src/
├─ routes/              # SvelteKit 페이지
│  ├─ (main)/           # 헤더 있는 레이아웃
│  │  ├─ +layout.svelte # SummaryStore 초기화 + Realtime 구독
│  │  ├─ +page.svelte   # 홈 페이지 (SummaryForm + SummaryList)
│  │  └─ [videoId]/     # 상세 페이지 (SummaryDetail)
│  └─ (non-header)/     # 헤더 없는 레이아웃 (인증 페이지)
├─ lib/
│  ├─ components/       # Svelte 컴포넌트
│  │  ├─ SummaryForm.svelte        # YouTube URL 입력 폼
│  │  ├─ SummaryList.svelte        # 요약 목록 + 무한 스크롤
│  │  ├─ SummaryDetail.svelte      # 요약 상세 뷰
│  │  ├─ RadarChart.svelte         # 감정 분석 레이더 차트
│  │  ├─ PieChart.svelte           # 연령대 분포 파이 차트
│  │  └─ MetricsRadarChart.svelte  # 콘텐츠 메트릭 차트
│  ├─ remote/           # Remote Functions
│  │  ├─ summary.remote.ts         # 요약 쿼리/폼
│  │  ├─ community.remote.ts       # 커뮤니티 분석
│  │  ├─ audio.remote.ts           # TTS 음성 생성
│  │  └─ youtube/                  # YouTube 관련
│  ├─ server/           # 서버 전용 로직
│  │  ├─ services/                 # 비즈니스 로직
│  │  │  ├─ summary.service.ts    # 요약 분석 오케스트레이션
│  │  │  ├─ ai.service.ts         # AI 분석 (Gemini)
│  │  │  ├─ community-metrics.service.ts  # 커뮤니티 메트릭
│  │  │  └─ youtube/               # YouTube 서비스
│  │  │     ├─ transcription.service.ts   # 자막 수집
│  │  │     └─ comment.service.ts         # 댓글 수집
│  │  └─ content-analysis.ts       # 카테고리/태그 관리
│  ├─ stores/           # Svelte Stores
│  │  └─ summary.svelte.ts         # SummaryStore + Realtime
│  └─ types/            # TypeScript 타입
│     └─ database.types.ts         # Supabase 생성 타입
└─ hooks.server.ts      # Auth 미들웨어 + Supabase 클라이언트

supabase/
├─ migrations/          # 데이터베이스 마이그레이션
├─ functions/           # Deno Edge Functions
└─ tests/              # Deno 테스트

docs/
├─ todos/              # 예정된 기능 문서
└─ *.md                # 기술 문서

messages/              # i18n 메시지 파일 (ko.json, en.json)
```

## 데이터베이스 스키마

### 핵심 테이블

- **summaries**: 요약 메인 정보 (제목, 요약, 처리 상태)
- **videos**: YouTube 영상 메타데이터
- **channels**: YouTube 채널 정보
- **transcripts**: 자막 데이터 (JSONB)
- **comments**: 댓글 데이터 (JSONB)
- **content_community_metrics**: 감정/연령대 메트릭
- **content_metrics**: 콘텐츠 품질 메트릭
- **categories**: 계층적 카테고리
- **tags**: 콘텐츠 태그
- **video_categories**: 영상-카테고리 매핑 (우선순위)
- **video_tags**: 영상-태그 매핑 (가중치)

## 개발 환경

### 필수 요구사항

- Node.js 18+
- pnpm 8+
- Supabase 계정
- Gemini API 키
- ElevenLabs API 키

### 환경 변수

```bash
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

### 개발 명령어

```bash
pnpm install         # 의존성 설치
pnpm dev             # 개발 서버 (http://localhost:7777)
pnpm build           # 프로덕션 빌드
pnpm preview         # 프로덕션 미리보기 (http://localhost:17777)
```

### 코드 품질

```bash
pnpm check           # Svelte + JS 타입 체크
pnpm format          # Prettier 포맷팅
pnpm lint            # ESLint + Prettier 검사
```

### 테스트

```bash
pnpm test            # 모든 테스트 실행
pnpm test:unit       # Vitest 단위 테스트
pnpm test:e2e        # Playwright E2E 테스트
```

### 배포

```bash
pnpm deploy          # Cloudflare Workers 배포
pnpm edge:deploy     # Supabase Edge Functions 배포
```

### Edge Functions

```bash
pnpm edge:test:all   # Deno 테스트 실행
pnpm edge:format     # Deno 코드 포맷팅
pnpm edge:lint       # Deno 코드 린트
pnpm edge:check      # Deno 타입 체크
```

## 배포 환경

- **프로덕션 도메인**: [zheon.xiyo.dev](https://zheon.xiyo.dev)
- **플랫폼**: Cloudflare Workers
- **데이터베이스**: Supabase PostgreSQL
- **Edge Functions**: Supabase Deno Runtime

## 개발 포트

- Dev server: **7777**
- Preview server: **17777**
- Wrangler dev: **5170**

## 라이선스

MIT

## 기여

이슈 및 풀 리퀘스트는 언제든지 환영합니다.

## 문서

- [CLAUDE.md](CLAUDE.md): AI 개발 가이드 및 프로젝트 규칙
- [docs/todos/](docs/todos/): 예정된 기능 상세 계획
- [docs/content-analysis-system-final.md](docs/content-analysis-system-final.md): 콘텐츠 분석 시스템 상세
- [docs/embedding-fundamentals.md](docs/embedding-fundamentals.md): 임베딩 기초
