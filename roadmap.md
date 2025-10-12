# Edge Function 리팩토링 로드맵

## 📋 목차
1. [프로젝트 개요](#프로젝트-개요)
2. [기술 스택](#기술-스택)
3. [아키텍처 설계](#아키텍처-설계)
4. [구현 단계](#구현-단계)
5. [테스트 가이드](#테스트-가이드)
6. [배포 절차](#배포-절차)
7. [트러블슈팅](#트러블슈팅)

---

## 프로젝트 개요

### 현재 문제점
- LangChain 사용으로 인한 무거운 번들 크기 (~2MB)
- 단일 Edge Function에 모든 로직 집중 (자막 추출 + AI 요약)
- 독립적인 테스트 불가능
- 에러 추적 어려움
- Zod v3 사용 (구버전)

### 목표
- **2개의 독립적인 Edge Function으로 분리**
  - `subtitle-extractor`: YouTube 자막 추출 전용
  - `insight-generator`: AI 인사이트 생성 전용
- **최신 기술 스택 적용**
  - LangChain → Vercel AI SDK 5.0
  - Zod → Valibot 1.1 (2.27배 가벼움)
- **독립 테스트 가능한 구조**
- **번들 크기 최소화** (Tree-shakable)

### 예상 효과
- 번들 크기 50% 이상 감소
- 각 기능별 독립 테스트 가능
- 디버깅 시간 70% 단축
- 재사용 가능한 모듈화

---

## 기술 스택

### 최신 npm 패키지 버전 (2025-10-10 기준)

| 패키지 | 버전 | 용도 | 번들 크기 |
|--------|------|------|-----------|
| **ai** | `5.0.65` | Vercel AI SDK 코어 | ~100KB |
| **@ai-sdk/google** | `2.0.18` | Google Gemini 프로바이더 | ~50KB |
| **valibot** | `1.1.0` | 스키마 검증 (Zod 대체) | 1.74MB |
| **youtubei.js** | `15.1.1` | YouTube 자막/메타데이터 추출 | ~500KB |
| **@supabase/supabase-js** | `2.75.0` | Supabase 클라이언트 (JSR) | ~200KB |

### Valibot을 선택한 이유

```
Valibot vs Zod 비교
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                Valibot    Zod
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
번들 크기         1.74MB    3.96MB
Tree-shakable    ✅ 예     ❌ 아니오
성능             빠름      보통
AI SDK 지원      ✅        ✅
2025 트렌드      🔥 최신    레거시화
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Vercel AI SDK를 선택한 이유

```
Vercel AI SDK vs LangChain 비교
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    AI SDK     LangChain
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
번들 크기           ~100KB     ~2MB
Deno 지원           완벽       제한적
학습 곡선           완만       가파름
Streaming           간단       복잡
TypeScript 타입     우수       보통
2025년 트렌드       최신 표준   레거시화
Next.js 통합        네이티브    외부 라이브러리
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 아키텍처 설계

### 전체 구조

```
┌──────────────────────────────────────────────────────────┐
│                     SvelteKit 클라이언트                    │
│                  (src/routes/(main)/+page.server.js)      │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│           Supabase Edge Function: summary                   │
│                    (오케스트레이터)                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 1. DB에 pending 레코드 생성                          │  │
│  │ 2. subtitle-extractor 호출 → 자막 추출              │  │
│  │ 3. insight-generator 호출 → AI 인사이트 생성        │  │
│  │ 4. DB에 completed 업데이트                           │  │
│  │ 5. 에러 시 DB failed 업데이트                        │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────┬─────────────────────────┬────────────────────────┘
           │                         │
           ▼                         ▼
┌─────────────────────┐   ┌──────────────────────────┐
│ subtitle-extractor  │   │  insight-generator       │
│                     │   │                          │
│ ├─ YouTube.js       │   │ ├─ Vercel AI SDK 5.0    │
│ ├─ SOCKS5 프록시    │   │ ├─ Google Gemini        │
│ └─ xiyo.dev:19050   │   │ └─ Valibot 스키마       │
└─────────────────────┘   └──────────────────────────┘
         │                             │
         ▼                             ▼
    자막 + 메타데이터              구조화된 인사이트
    (title, channel, etc)         (title, summary, insights)
```

### 폴더 구조

```
supabase/
├── functions/
│   ├── subtitle-extractor/          # 🎬 자막 추출 전용 Function
│   │   ├── index.ts                 # 메인 로직
│   │   └── deno.json                # youtubei.js 의존성
│   │
│   ├── insight-generator/           # 🤖 AI 인사이트 생성 전용 Function
│   │   ├── index.ts                 # 메인 로직
│   │   └── deno.json                # ai, @ai-sdk/google, valibot 의존성
│   │
│   ├── summary/                     # 🎯 오케스트레이터 Function
│   │   ├── index.ts                 # 기존 파일 수정
│   │   └── deno.json                # @supabase/supabase-js 의존성
│   │
│   └── _shared/                     # 공유 유틸리티
│       ├── cors.ts                  # CORS 헤더 처리
│       ├── supabase-client.ts       # Supabase 클라이언트
│       └── youtube-proxy.ts         # ⭐ NEW: SOCKS5 프록시 로직 분리
│
└── tests/                           # 🧪 독립 테스트 스크립트
    ├── test-subtitle-extractor.ts   # 자막 추출 테스트
    ├── test-insight-generator.ts    # AI 생성 테스트
    └── test-full-pipeline.ts        # 전체 파이프라인 테스트
```

---

## 구현 단계

### Phase 1: 공유 유틸리티 준비 (30분)

#### 1.1 SOCKS5 프록시 로직 분리

**파일**: `supabase/functions/_shared/youtube-proxy.ts`

```typescript
/**
 * SOCKS5 프록시를 통한 YouTube 접근
 * Tor 아이솔레이션: 각 요청마다 새로운 UUID 생성
 */

/**
 * UUID v4 생성 (Deno 네이티브)
 */
export function generateUUID(): string {
	return crypto.randomUUID();
}

/**
 * SOCKS5 프록시를 통한 커스텀 fetch 함수 생성
 * @returns 프록시 설정된 fetch 함수
 */
export function createProxyFetch() {
	return async (input: RequestInfo | URL, init?: RequestInit) => {
		// 각 요청마다 새로운 UUID 생성 (Tor 아이솔레이션)
		const username = generateUUID();
		const password = generateUUID();
		const proxyUrl = `socks5://${username}:${password}@xiyo.dev:19050`;

		console.log(`[Proxy] Using SOCKS5: ${proxyUrl.replace(/:[^:@]+@/, ':****@')}`);

		// Deno의 createHttpClient로 SOCKS5 프록시 설정
		const client = Deno.createHttpClient({
			proxy: { url: proxyUrl }
		});

		try {
			const response = await fetch(input, {
				...init,
				client
			});
			return response;
		} finally {
			client.close();
		}
	};
}

/**
 * YouTube URL에서 비디오 ID 추출
 */
export function extractVideoId(url: string): string | null {
	const patterns = [
		/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
		/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
		/youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
	];

	for (const pattern of patterns) {
		const match = url.match(pattern);
		if (match && match[1]) {
			return match[1];
		}
	}

	return null;
}
```

**체크리스트:**
- [ ] 파일 생성: `supabase/functions/_shared/youtube-proxy.ts`
- [ ] UUID 생성 함수 구현
- [ ] SOCKS5 프록시 fetch 함수 구현
- [ ] Video ID 추출 함수 구현
- [ ] 코드 포맷팅 (`pnpm edge:format`)

---

### Phase 2: subtitle-extractor Function 구현 (1시간)

#### 2.1 deno.json 설정

**파일**: `supabase/functions/subtitle-extractor/deno.json`

```json
{
  "imports": {
    "youtubei.js": "npm:youtubei.js@15.1.1"
  }
}
```

#### 2.2 메인 로직 구현

**파일**: `supabase/functions/subtitle-extractor/index.ts`

```typescript
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { Innertube } from 'youtubei.js';
import { corsValidation, corsResponse, corsError } from '../_shared/cors.ts';
import { createProxyFetch, extractVideoId } from '../_shared/youtube-proxy.ts';

console.log('🎬 Subtitle Extractor Function Started');

Deno.serve(async (req) => {
	// CORS 검증
	const validation = corsValidation(req, ['POST']);
	if (validation) return validation;

	try {
		// 요청 본문 파싱
		const { url } = await req.json();

		if (!url) {
			return corsError('URL is required', 'MISSING_URL', 400);
		}

		console.log(`[Subtitle Extractor] Processing: ${url}`);

		// 비디오 ID 추출
		const videoId = extractVideoId(url);
		if (!videoId) {
			return corsError('Invalid YouTube URL format', 'INVALID_URL', 400);
		}

		console.log(`[Subtitle Extractor] Video ID: ${videoId}`);

		// SOCKS5 프록시를 통한 Innertube 클라이언트 생성
		const proxyFetch = createProxyFetch();
		const yt = await Innertube.create({
			fetch: proxyFetch as any // SOCKS5 프록시 사용
		});

		console.log(`[Subtitle Extractor] Fetching video info via proxy...`);
		const info = await yt.getInfo(videoId);

		// 메타데이터 수집
		const metadata = {
			title: info.basic_info.title || 'Unknown Title',
			channelName: info.basic_info.author || 'Unknown Channel',
			duration: info.basic_info.duration || 0,
			viewCount: info.basic_info.view_count || 0,
			publishDate: info.basic_info.publish_date || null
		};

		console.log(`[Subtitle Extractor] Title: ${metadata.title}`);

		// 자막 가져오기
		console.log(`[Subtitle Extractor] Fetching transcript...`);
		const transcriptData = await info.getTranscript();

		if (!transcriptData?.transcript?.content?.body?.initial_segments) {
			return corsError(
				'No transcript available for this video',
				'NO_TRANSCRIPT',
				404
			);
		}

		// 자막 텍스트 추출
		const transcript = transcriptData.transcript.content.body.initial_segments
			.map((segment: any) => segment.snippet?.text || '')
			.join(' ')
			.trim();

		if (!transcript || transcript.length === 0) {
			return corsError('Transcript is empty', 'EMPTY_TRANSCRIPT', 404);
		}

		console.log(`[Subtitle Extractor] ✅ Success: ${transcript.length} characters`);

		// 성공 응답
		return corsResponse({
			success: true,
			transcript,
			metadata,
			stats: {
				transcriptLength: transcript.length,
				segmentCount: transcriptData.transcript.content.body.initial_segments.length
			}
		});

	} catch (error) {
		console.error('[Subtitle Extractor] ❌ Error:', error);

		const errorMessage = error instanceof Error ? error.message : String(error);

		if (errorMessage.includes('Video unavailable')) {
			return corsError('Video is unavailable or restricted', 'VIDEO_UNAVAILABLE', 404);
		}

		return corsError(errorMessage, 'EXTRACTION_ERROR', 500);
	}
});
```

#### 2.3 config.toml 설정

**파일**: `supabase/config.toml` (기존 파일에 추가)

```toml
[functions.subtitle-extractor]
enabled = true
verify_jwt = true  # 인증 필요
import_map = "./functions/subtitle-extractor/deno.json"
entrypoint = "./functions/subtitle-extractor/index.ts"
```

**체크리스트:**
- [ ] `deno.json` 생성 및 youtubei.js 의존성 추가
- [ ] `index.ts` 구현
- [ ] CORS 처리 추가
- [ ] 에러 핸들링 구현
- [ ] `config.toml`에 함수 등록
- [ ] 코드 포맷팅 (`pnpm edge:format`)
- [ ] 타입 체크 (`pnpm edge:check`)

---

### Phase 3: insight-generator Function 구현 (1.5시간)

#### 3.1 deno.json 설정

**파일**: `supabase/functions/insight-generator/deno.json`

```json
{
  "imports": {
    "ai": "npm:ai@5.0.65",
    "@ai-sdk/google": "npm:@ai-sdk/google@2.0.18",
    "valibot": "npm:valibot@1.1.0"
  }
}
```

#### 3.2 메인 로직 구현

**파일**: `supabase/functions/insight-generator/index.ts`

```typescript
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import * as v from 'valibot';
import { corsValidation, corsResponse, corsError } from '../_shared/cors.ts';

console.log('🤖 Insight Generator Function Started');

// Valibot 스키마 정의 - 구조화된 인사이트 출력
const InsightSchema = v.object({
	title: v.pipe(
		v.string(),
		v.minLength(10, '제목은 최소 10자 이상이어야 합니다'),
		v.maxLength(100, '제목은 최대 100자까지 가능합니다')
	),
	summary: v.pipe(
		v.string(),
		v.minLength(400, '요약은 최소 400자 이상이어야 합니다'),
		v.maxLength(600, '요약은 최대 600자까지 가능합니다')
	),
	insights: v.pipe(
		v.string(),
		v.minLength(1800, '인사이트는 최소 1800자 이상이어야 합니다'),
		v.maxLength(2200, '인사이트는 최대 2200자까지 가능합니다')
	)
});

// 프롬프트 템플릿
const PROMPT_TEMPLATE = `
당신은 YouTube 영상 자막을 분석하여 핵심 내용을 추출하고, 독자에게 학습 가치를 제공하는 전문 요약가입니다.

===== 분석할 영상 자막 =====
{transcript}
===========================

아래 세 가지 항목을 작성해주세요:

【1. title - 제목】
영상의 핵심 주제를 정확하게 표현하는 전문적이고 명확한 한글 제목을 작성하세요.

【2. summary - 500자 요약】
영상의 핵심 내용을 500자 분량으로 체계적으로 정리하세요:
- 영상이 다루는 주제와 목적
- 핵심 아이디어와 주요 논점 (우선순위 순으로)
- 실용적인 결론 또는 시사점

작성 지침:
- 정확히 500자 분량으로 작성 (±50자 허용)
- 영상에서 실제로 언급된 내용만 포함
- 간결하고 명료한 문장 사용
- 독자가 영상의 전체 맥락을 파악할 수 있도록 구성

【3. insights - 2000자 핵심 인사이트】
영상 내용을 바탕으로 독자의 이해를 돕는 2000자 분량의 심화 분석을 작성하세요.

다음 섹션을 포함해야 합니다:

## 핵심 개념 설명
영상에서 다룬 중요한 개념들을 상세히 설명합니다:
- 각 개념의 정의와 의미
- 개념 간의 관계와 맥락
- 실무에서의 적용 방법

## 사전 지식 및 배경 개념
영상을 완전히 이해하기 위해 알아두면 좋은 사전 지식:
- 영상에서 전제하는 기본 개념들
- 관련 분야의 기초 이론
- 이해를 돕는 비유나 예시

## 추천 학습 자료
더 깊이 학습하고 싶은 독자를 위한 참고 자료:
- 관련 논문이나 학술 자료 (저자, 제목 포함)
- 추천 도서 (저자, 제목 포함)
- 유용한 온라인 강의나 문서
- 관련 커뮤니티나 포럼

작성 지침:
- 정확히 2000자 분량으로 작성 (±100자 허용)
- 영상 내용을 기반으로 하되, 학습에 도움되는 추가 정보 포함 가능
- 구체적인 자료명, 저자명 등 실존하는 자료만 언급
- 마크다운 형식으로 깔끔하게 구성
- 독자가 바로 활용할 수 있는 실용적인 정보 제공
`;

Deno.serve(async (req) => {
	// CORS 검증
	const validation = corsValidation(req, ['POST']);
	if (validation) return validation;

	try {
		// 요청 본문 파싱
		const { transcript, metadata } = await req.json();

		if (!transcript) {
			return corsError('Transcript is required', 'MISSING_TRANSCRIPT', 400);
		}

		console.log(`[Insight Generator] Processing transcript: ${transcript.length} characters`);

		// Gemini API 키 확인
		const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
		if (!geminiApiKey) {
			return corsError('GEMINI_API_KEY is not configured', 'CONFIG_ERROR', 500);
		}

		// Gemini 모델 설정
		const model = google('gemini-2.5-flash-lite-preview-09-2025', {
			apiKey: geminiApiKey
		});

		// 프롬프트 생성
		const prompt = PROMPT_TEMPLATE.replace('{transcript}', transcript);

		console.log(`[Insight Generator] Calling Gemini API...`);

		// AI 인사이트 생성 (Valibot 스키마로 구조화된 출력)
		const result = await generateObject({
			model,
			schema: InsightSchema,
			temperature: 0.3, // 일관성을 위해 낮은 temperature
			prompt
		});

		console.log(`[Insight Generator] ✅ Success: Generated title "${result.object.title}"`);

		// 성공 응답
		return corsResponse({
			success: true,
			...result.object,
			stats: {
				titleLength: result.object.title.length,
				summaryLength: result.object.summary.length,
				insightsLength: result.object.insights.length,
				inputTranscriptLength: transcript.length
			}
		});

	} catch (error) {
		console.error('[Insight Generator] ❌ Error:', error);

		const errorMessage = error instanceof Error ? error.message : String(error);

		// Valibot 검증 에러
		if (errorMessage.includes('validation') || errorMessage.includes('Invalid')) {
			return corsError(
				'AI output validation failed. Please try again.',
				'VALIDATION_ERROR',
				500
			);
		}

		// API 할당량 초과
		if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
			return corsError(
				'API rate limit exceeded. Please try again later.',
				'RATE_LIMIT_ERROR',
				429
			);
		}

		return corsError(errorMessage, 'GENERATION_ERROR', 500);
	}
});
```

#### 3.3 config.toml 설정

**파일**: `supabase/config.toml` (기존 파일에 추가)

```toml
[functions.insight-generator]
enabled = true
verify_jwt = true  # 인증 필요
import_map = "./functions/insight-generator/deno.json"
entrypoint = "./functions/insight-generator/index.ts"
```

**체크리스트:**
- [ ] `deno.json` 생성 및 ai, @ai-sdk/google, valibot 의존성 추가
- [ ] Valibot 스키마 정의
- [ ] `index.ts` 구현
- [ ] 프롬프트 템플릿 작성
- [ ] CORS 처리 추가
- [ ] 에러 핸들링 (검증 실패, API 할당량 등)
- [ ] `config.toml`에 함수 등록
- [ ] 코드 포맷팅 (`pnpm edge:format`)
- [ ] 타입 체크 (`pnpm edge:check`)

---

### Phase 4: 독립 테스트 스크립트 작성 (45분)

#### 4.1 자막 추출 테스트

**파일**: `supabase/tests/test-subtitle-extractor.ts`

```typescript
/**
 * Subtitle Extractor 독립 테스트
 *
 * 실행 방법:
 * deno run --allow-net --allow-env supabase/tests/test-subtitle-extractor.ts
 */

import { assertEquals, assertExists } from "jsr:@std/assert";

const SUPABASE_URL = Deno.env.get('PUBLIC_SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('PUBLIC_SUPABASE_ANON_KEY');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
	console.error('❌ Missing environment variables');
	Deno.exit(1);
}

const TEST_VIDEOS = [
	{
		name: 'Rick Astley - Never Gonna Give You Up',
		url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
		expectedMinLength: 1000 // 최소 예상 자막 길이
	},
	{
		name: 'Short Test Video',
		url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
		expectedMinLength: 500
	}
];

console.log('🧪 Starting Subtitle Extractor Tests\n');

for (const test of TEST_VIDEOS) {
	console.log(`Testing: ${test.name}`);
	console.log(`URL: ${test.url}\n`);

	try {
		const response = await fetch(
			`${SUPABASE_URL}/functions/v1/subtitle-extractor`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
				},
				body: JSON.stringify({ url: test.url })
			}
		);

		const result = await response.json();

		// 응답 검증
		assertEquals(response.status, 200, 'Should return 200 OK');
		assertEquals(result.success, true, 'Should be successful');
		assertExists(result.transcript, 'Transcript should exist');
		assertExists(result.metadata, 'Metadata should exist');
		assertExists(result.metadata.title, 'Title should exist');

		// 자막 길이 검증
		const transcriptLength = result.transcript.length;
		assertEquals(
			transcriptLength >= test.expectedMinLength,
			true,
			`Transcript length (${transcriptLength}) should be >= ${test.expectedMinLength}`
		);

		console.log('✅ PASS');
		console.log(`   - Transcript Length: ${transcriptLength} chars`);
		console.log(`   - Title: ${result.metadata.title}`);
		console.log(`   - Channel: ${result.metadata.channelName}`);
		console.log(`   - Duration: ${result.metadata.duration}s\n`);

	} catch (error) {
		console.error(`❌ FAIL: ${error.message}\n`);
		Deno.exit(1);
	}
}

console.log('🎉 All tests passed!');
```

#### 4.2 인사이트 생성 테스트

**파일**: `supabase/tests/test-insight-generator.ts`

```typescript
/**
 * Insight Generator 독립 테스트
 *
 * 실행 방법:
 * deno run --allow-net --allow-env supabase/tests/test-insight-generator.ts
 */

import { assertEquals, assertExists } from "jsr:@std/assert";

const SUPABASE_URL = Deno.env.get('PUBLIC_SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('PUBLIC_SUPABASE_ANON_KEY');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
	console.error('❌ Missing environment variables');
	Deno.exit(1);
}

const SAMPLE_TRANSCRIPT = `
Rick Astley의 "Never Gonna Give You Up"은 1987년 발표된 팝 노래입니다.
이 노래는 변치 않는 사랑과 헌신에 대한 약속을 담고 있습니다.
가사의 핵심 메시지는 "절대 포기하지 않겠다", "절대 실망시키지 않겠다"는 반복적인 약속입니다.
이 노래는 후에 인터넷 밈 "릭롤링"의 원천이 되어 현대 디지털 문화에 큰 영향을 미쳤습니다.
80년대 팝 음악의 정수를 보여주는 대표적인 곡입니다.
`.repeat(10); // 충분한 길이 확보

console.log('🧪 Starting Insight Generator Tests\n');
console.log(`Sample transcript length: ${SAMPLE_TRANSCRIPT.length} chars\n`);

try {
	const response = await fetch(
		`${SUPABASE_URL}/functions/v1/insight-generator`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
			},
			body: JSON.stringify({
				transcript: SAMPLE_TRANSCRIPT,
				metadata: {
					title: 'Rick Astley - Never Gonna Give You Up',
					channelName: 'Rick Astley'
				}
			})
		}
	);

	const result = await response.json();

	// 응답 검증
	assertEquals(response.status, 200, 'Should return 200 OK');
	assertEquals(result.success, true, 'Should be successful');
	assertExists(result.title, 'Title should exist');
	assertExists(result.summary, 'Summary should exist');
	assertExists(result.insights, 'Insights should exist');

	// 길이 검증 (Valibot 스키마 준수)
	const titleLength = result.title.length;
	const summaryLength = result.summary.length;
	const insightsLength = result.insights.length;

	assertEquals(
		titleLength >= 10 && titleLength <= 100,
		true,
		`Title length (${titleLength}) should be 10-100 chars`
	);

	assertEquals(
		summaryLength >= 400 && summaryLength <= 600,
		true,
		`Summary length (${summaryLength}) should be 400-600 chars`
	);

	assertEquals(
		insightsLength >= 1800 && insightsLength <= 2200,
		true,
		`Insights length (${insightsLength}) should be 1800-2200 chars`
	);

	console.log('✅ PASS');
	console.log(`   - Title: ${result.title}`);
	console.log(`   - Title Length: ${titleLength} chars`);
	console.log(`   - Summary Length: ${summaryLength} chars`);
	console.log(`   - Insights Length: ${insightsLength} chars\n`);

	console.log('📝 Generated Summary:');
	console.log(result.summary);
	console.log('\n📝 Generated Insights (first 200 chars):');
	console.log(result.insights.substring(0, 200) + '...\n');

	console.log('🎉 All tests passed!');

} catch (error) {
	console.error(`❌ FAIL: ${error.message}\n`);
	Deno.exit(1);
}
```

#### 4.3 전체 파이프라인 테스트

**파일**: `supabase/tests/test-full-pipeline.ts`

```typescript
/**
 * 전체 파이프라인 통합 테스트
 * subtitle-extractor → insight-generator 순차 호출
 *
 * 실행 방법:
 * deno run --allow-net --allow-env supabase/tests/test-full-pipeline.ts
 */

import { assertEquals, assertExists } from "jsr:@std/assert";

const SUPABASE_URL = Deno.env.get('PUBLIC_SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('PUBLIC_SUPABASE_ANON_KEY');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
	console.error('❌ Missing environment variables');
	Deno.exit(1);
}

const TEST_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

console.log('🧪 Starting Full Pipeline Test\n');
console.log(`Test URL: ${TEST_URL}\n`);

try {
	// Step 1: 자막 추출
	console.log('📥 Step 1: Extracting subtitles...');

	const extractResponse = await fetch(
		`${SUPABASE_URL}/functions/v1/subtitle-extractor`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
			},
			body: JSON.stringify({ url: TEST_URL })
		}
	);

	const extractResult = await extractResponse.json();

	assertEquals(extractResponse.status, 200, 'Extraction should succeed');
	assertEquals(extractResult.success, true, 'Extraction should be successful');
	assertExists(extractResult.transcript, 'Transcript should exist');

	console.log(`✅ Extraction successful (${extractResult.transcript.length} chars)\n`);

	// Step 2: 인사이트 생성
	console.log('🤖 Step 2: Generating insights...');

	const insightResponse = await fetch(
		`${SUPABASE_URL}/functions/v1/insight-generator`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
			},
			body: JSON.stringify({
				transcript: extractResult.transcript,
				metadata: extractResult.metadata
			})
		}
	);

	const insightResult = await insightResponse.json();

	assertEquals(insightResponse.status, 200, 'Insight generation should succeed');
	assertEquals(insightResult.success, true, 'Insight generation should be successful');
	assertExists(insightResult.title, 'Title should exist');
	assertExists(insightResult.summary, 'Summary should exist');
	assertExists(insightResult.insights, 'Insights should exist');

	console.log(`✅ Insight generation successful\n`);

	// 결과 출력
	console.log('📊 Final Results:');
	console.log('═'.repeat(60));
	console.log(`Title: ${insightResult.title}`);
	console.log(`Original Video: ${extractResult.metadata.title}`);
	console.log(`Channel: ${extractResult.metadata.channelName}`);
	console.log(`\nTranscript Length: ${extractResult.transcript.length} chars`);
	console.log(`Summary Length: ${insightResult.summary.length} chars`);
	console.log(`Insights Length: ${insightResult.insights.length} chars`);
	console.log('═'.repeat(60));
	console.log(`\n📝 Summary:\n${insightResult.summary}`);
	console.log(`\n📝 Insights (first 300 chars):\n${insightResult.insights.substring(0, 300)}...\n`);

	console.log('🎉 Full pipeline test passed!');

} catch (error) {
	console.error(`❌ FAIL: ${error.message}\n`);
	console.error(error);
	Deno.exit(1);
}
```

**체크리스트:**
- [ ] `test-subtitle-extractor.ts` 작성
- [ ] `test-insight-generator.ts` 작성
- [ ] `test-full-pipeline.ts` 작성
- [ ] 환경 변수 설정 확인
- [ ] 각 테스트 실행 및 검증

---

### Phase 5: summary Function 리팩토링 (1시간)

#### 5.1 기존 코드 백업

```bash
cp supabase/functions/summary/index.ts supabase/functions/summary/index.ts.backup
```

#### 5.2 새로운 summary Function 구현

**파일**: `supabase/functions/summary/index.ts`

```typescript
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsValidation, corsResponse, corsError } from '../_shared/cors.ts';
import { createSupabaseClient } from '../_shared/supabase-client.ts';

console.log('🎯 Summary Orchestrator Function Started');

/**
 * 다른 Edge Function 호출 헬퍼
 */
async function callEdgeFunction(
	functionName: string,
	body: any,
	authHeader: string
): Promise<any> {
	const supabaseUrl = Deno.env.get('SUPABASE_URL');
	const url = `${supabaseUrl}/functions/v1/${functionName}`;

	console.log(`[Orchestrator] Calling ${functionName}...`);

	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': authHeader
		},
		body: JSON.stringify(body)
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`${functionName} failed: ${error}`);
	}

	return await response.json();
}

Deno.serve(async (req) => {
	// CORS 검증
	const validation = corsValidation(req, ['POST']);
	if (validation) return validation;

	const supabase = createSupabaseClient();
	let recordId: string | undefined;

	try {
		// 요청 본문 파싱
		const { url } = await req.json();

		if (!url) {
			return corsError('URL is required', 'MISSING_URL', 400);
		}

		const authHeader = req.headers.get('Authorization') || '';

		console.log(`[Orchestrator] Processing: ${url}`);

		// Step 1: DB에 pending 레코드 생성
		console.log(`[Orchestrator] Creating pending record...`);

		const { data: newRecord, error: insertError } = await supabase
			.from('summary')
			.insert({
				url,
				title: '정리 중...',
				processing_status: 'pending'
			})
			.select('id')
			.single();

		if (insertError) {
			// 중복된 URL인 경우 (unique constraint)
			if (insertError.code === '23505') {
				console.log(`[Orchestrator] Duplicate URL detected, fetching existing record...`);

				const { data: existingRecord } = await supabase
					.from('summary')
					.select('id, processing_status, title, summary, insights')
					.eq('url', url)
					.single();

				if (existingRecord?.processing_status === 'completed') {
					return corsResponse({
						status: 'success',
						message: 'Using cached summary',
						record_id: existingRecord.id,
						was_duplicate: true
					});
				}

				recordId = existingRecord?.id;
			} else {
				throw insertError;
			}
		} else {
			recordId = newRecord.id;
		}

		console.log(`[Orchestrator] Record ID: ${recordId}`);

		// Step 2: 자막 추출
		const extractResult = await callEdgeFunction(
			'subtitle-extractor',
			{ url },
			authHeader
		);

		if (!extractResult.success || !extractResult.transcript) {
			throw new Error('Subtitle extraction failed');
		}

		console.log(`[Orchestrator] ✅ Subtitles extracted (${extractResult.transcript.length} chars)`);

		// Step 3: 인사이트 생성
		const insightResult = await callEdgeFunction(
			'insight-generator',
			{
				transcript: extractResult.transcript,
				metadata: extractResult.metadata
			},
			authHeader
		);

		if (!insightResult.success || !insightResult.title) {
			throw new Error('Insight generation failed');
		}

		console.log(`[Orchestrator] ✅ Insights generated: "${insightResult.title}"`);

		// Step 4: DB 업데이트 (completed)
		console.log(`[Orchestrator] Updating record to completed...`);

		const { error: updateError } = await supabase
			.from('summary')
			.update({
				title: insightResult.title,
				summary: insightResult.summary,
				insights: insightResult.insights,
				transcript: extractResult.transcript,
				channel_id: extractResult.metadata.channelName,
				channel_name: extractResult.metadata.channelName,
				duration: extractResult.metadata.duration,
				processing_status: 'completed',
				updated_at: new Date().toISOString()
			})
			.eq('id', recordId);

		if (updateError) {
			throw updateError;
		}

		console.log(`[Orchestrator] ✅ Record updated to completed`);

		// 성공 응답
		return corsResponse({
			status: 'success',
			message: 'Video processed successfully',
			record_id: recordId,
			saved_at: new Date().toISOString()
		});

	} catch (error) {
		console.error('[Orchestrator] ❌ Error:', error);

		// record_id가 있으면 failed 상태로 업데이트
		if (recordId) {
			console.log(`[Orchestrator] Updating record ${recordId} to failed...`);

			await supabase
				.from('summary')
				.update({
					processing_status: 'failed',
					summary: `Processing failed: ${error.message}`,
					transcript: `Error: ${error.message}\n\nStack: ${error.stack || 'No stack trace'}`,
					updated_at: new Date().toISOString()
				})
				.eq('id', recordId);
		}

		const errorMessage = error instanceof Error ? error.message : String(error);
		return corsError(errorMessage, 'ORCHESTRATION_ERROR', 500);
	}
});
```

**체크리스트:**
- [ ] 기존 코드 백업
- [ ] 새로운 오케스트레이터 로직 구현
- [ ] DB pending 레코드 생성
- [ ] subtitle-extractor 호출
- [ ] insight-generator 호출
- [ ] DB completed 업데이트
- [ ] 에러 시 DB failed 업데이트
- [ ] 코드 포맷팅 (`pnpm edge:format`)
- [ ] 타입 체크 (`pnpm edge:check`)

---

## 테스트 가이드

### 로컬 테스트

#### 1. 환경 변수 설정

`.env` 파일에 다음 변수 추가:

```bash
PUBLIC_SUPABASE_URL=https://iefgdhwmgljjacafqomd.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
GEMINI_API_KEY=your_gemini_key_here
```

#### 2. 각 Function 독립 테스트

```bash
# Subtitle Extractor 테스트
deno run --allow-net --allow-env supabase/tests/test-subtitle-extractor.ts

# Insight Generator 테스트
deno run --allow-net --allow-env supabase/tests/test-insight-generator.ts

# 전체 파이프라인 테스트
deno run --allow-net --allow-env supabase/tests/test-full-pipeline.ts
```

#### 3. Edge Function 로컬 서버 실행

```bash
# 특정 Function 실행
supabase functions serve subtitle-extractor --no-verify-jwt

# 다른 터미널에서 테스트
curl -X POST http://localhost:54321/functions/v1/subtitle-extractor \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

### 통합 테스트

프론트엔드에서 실제 요청:

```bash
# 개발 서버 실행
pnpm dev

# 브라우저에서 http://localhost:5170 접속
# YouTube URL 입력 후 "인사이트 추출 시작" 클릭
```

---

## 배포 절차

### 1. Edge Functions 배포

```bash
# 모든 Edge Functions 한번에 배포
pnpm edge:deploy

# 또는 개별 배포
supabase functions deploy subtitle-extractor --project-ref iefgdhwmgljjacafqomd
supabase functions deploy insight-generator --project-ref iefgdhwmgljjacafqomd
supabase functions deploy summary --project-ref iefgdhwmgljjacafqomd
```

### 2. 환경 변수 설정 확인

```bash
# 현재 설정된 secrets 확인
pnpm edge:secrets:list

# 필요한 secrets:
# - GEMINI_API_KEY
# - SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY
```

### 3. 배포 후 검증

```bash
# 각 Function 상태 확인
supabase functions list --project-ref iefgdhwmgljjacafqomd

# 프로덕션 테스트
curl -X POST https://iefgdhwmgljjacafqomd.supabase.co/functions/v1/subtitle-extractor \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

### 4. 로그 모니터링

```bash
# Edge Function 로그 확인
supabase functions logs subtitle-extractor --project-ref iefgdhwmgljjacafqomd
supabase functions logs insight-generator --project-ref iefgdhwmgljjacafqomd
supabase functions logs summary --project-ref iefgdhwmgljjacafqomd
```

---

## 트러블슈팅

### 1. SOCKS5 프록시 연결 실패

**증상:**
```
Error: Failed to connect to proxy xiyo.dev:19050
```

**해결 방법:**
1. xiyo.dev:19050이 실행 중인지 확인
2. 방화벽 설정 확인
3. 프록시 인증 정보 (UUID) 재생성 확인

### 2. Gemini API 할당량 초과

**증상:**
```
Error: API rate limit exceeded
```

**해결 방법:**
1. Gemini API 콘솔에서 할당량 확인
2. `temperature` 값 조정하여 토큰 사용량 감소
3. 캐싱 로직 추가 (중복 요청 방지)

### 3. Valibot 검증 실패

**증상:**
```
Error: AI output validation failed
```

**해결 방법:**
1. 프롬프트에 명확한 글자 수 제한 명시
2. `temperature` 낮추기 (0.3 → 0.1)
3. Valibot 스키마 제약 완화 (±100자 허용)

### 4. Edge Function 타임아웃

**증상:**
```
Error: Function execution timed out
```

**해결 방법:**
1. YouTube 영상 길이 확인 (너무 긴 영상은 자막도 김)
2. 자막 길이 제한 추가 (예: 최대 50,000자)
3. Gemini 모델을 `gemini-2.5-flash`에서 더 빠른 모델로 변경

### 5. DB 업데이트 실패

**증상:**
```
Error: insert or update on table "summary" violates foreign key constraint
```

**해결 방법:**
1. DB 스키마 확인
2. RLS 정책 확인
3. `SUPABASE_SERVICE_ROLE_KEY` 사용 확인

---

## 성능 최적화 팁

### 1. 번들 크기 최소화

- Valibot의 Tree-shaking 활용
- 불필요한 import 제거
- Dynamic import 활용

### 2. 응답 시간 단축

- 자막 추출과 인사이트 생성을 병렬 처리 (가능한 경우)
- Gemini `flash-lite` 모델 사용
- 캐싱 전략 구현

### 3. 비용 절감

- 중복 URL 체크 강화
- API 호출 전 자막 길이 검증
- Gemini free tier 할당량 모니터링

---

## 완료 체크리스트

### Phase 1: 공유 유틸리티
- [ ] `youtube-proxy.ts` 생성
- [ ] UUID 생성 함수 구현
- [ ] SOCKS5 프록시 fetch 구현
- [ ] Video ID 추출 함수 구현

### Phase 2: subtitle-extractor
- [ ] `deno.json` 설정
- [ ] `index.ts` 구현
- [ ] CORS 처리
- [ ] `config.toml` 등록
- [ ] 로컬 테스트 성공

### Phase 3: insight-generator
- [ ] `deno.json` 설정
- [ ] Valibot 스키마 정의
- [ ] `index.ts` 구현
- [ ] 프롬프트 템플릿 작성
- [ ] `config.toml` 등록
- [ ] 로컬 테스트 성공

### Phase 4: 독립 테스트
- [ ] `test-subtitle-extractor.ts` 작성 및 통과
- [ ] `test-insight-generator.ts` 작성 및 통과
- [ ] `test-full-pipeline.ts` 작성 및 통과

### Phase 5: summary 리팩토링
- [ ] 기존 코드 백업
- [ ] 새로운 오케스트레이터 구현
- [ ] DB 연동 테스트
- [ ] 에러 핸들링 검증

### 배포
- [ ] Edge Functions 배포
- [ ] 환경 변수 확인
- [ ] 프로덕션 테스트
- [ ] 로그 모니터링

### 문서화
- [ ] 코드 주석 추가
- [ ] README 업데이트
- [ ] API 문서 작성

---

## 예상 소요 시간

| Phase | 작업 내용 | 예상 시간 |
|-------|----------|-----------|
| Phase 1 | 공유 유틸리티 준비 | 30분 |
| Phase 2 | subtitle-extractor 구현 | 1시간 |
| Phase 3 | insight-generator 구현 | 1.5시간 |
| Phase 4 | 독립 테스트 스크립트 | 45분 |
| Phase 5 | summary 리팩토링 | 1시간 |
| **총 예상 시간** | | **4시간 45분** |

---

## 참고 문서

- [Vercel AI SDK 공식 문서](https://ai-sdk.dev/)
- [Valibot 공식 문서](https://valibot.dev/)
- [YouTubei.js GitHub](https://github.com/LuanRT/YouTube.js)
- [Supabase Edge Functions 가이드](https://supabase.com/docs/guides/functions)
- [Gemini API 문서](https://ai.google.dev/gemini-api/docs)

---

**작성일**: 2025-10-10
**작성자**: Claude Code
**버전**: 1.0.0
