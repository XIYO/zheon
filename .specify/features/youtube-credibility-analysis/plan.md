# Implementation Plan: YouTube 영상 댓글 분석 (커뮤니티 감정도)

**Version**: 1.0
**Created**: 2025-10-18
**Status**: Planning Phase

---

## 1. 아키텍처 개요

### 1.1 고수준 흐름 (트렌드 분석)

```
Day 1 - 초기 분석:
    ↓
[자동 트리거]
    ├─ 댓글 수집 (최근 100개)
    ├─ 신규 100개만 감정 분석 (1회 API 호출)
    ├─ 감정도 계산: "긍정 70%, 중립 20%, 부정 10%"
    └─ Insight 저장 (emotion_score: 70)

───────────────────────────────────

Day 2 - 추이 분석:
    ↓
[자동 트리거]
    ├─ 신규 댓글 수집 (예: 15개)
    ├─ 신규 15개만 감정 분석 (1회 API 호출)
    ├─ DB 전체 풀에서 감정도 재계산 (115개 기준)
    ├─ 감정도 계산: "긍정 68%, 중립 21%, 부정 11%"
    ├─ 변화 추적: "어제 70% → 오늘 68% (-2%)"
    └─ Insight 저장 + 추이 데이터 기록

───────────────────────────────────

병렬 자막 분석:
    ├─ 새로운 자막만 수집
    └─ 자막은 변하지 않으므로 신규만 분석

───────────────────────────────────

최종 Insight JSON:
    ├─ 현재 감정도: 68
    ├─ 일일 변화: -2%
    ├─ 7일 추이: [70, 69, 68, ...]
    ├─ 커뮤니티 추이 그래프
    └─ 자막 분석 결과
```

### 1.2 기술 스택

```
데이터 수집:
├─ 댓글: youtubei.js (비공식 API, NEWEST_FIRST)
└─ 메타데이터: 기존 youtube-proxy

데이터 저장:
├─ 테이블: youtube_comments, comment_metadata_history
└─ 쿼리: UPSERT (Comment ID 기반)

분석:
├─ LLM: 기존 AI 통합 (감정 분석)
├─ 배칭: 신규 댓글만 분석
└─ 병렬: Promise.all() / Promise.allSettled()

UI:
├─ Svelte 5 컴포넌트
├─ 차트: 기존 라이브러리
└─ 실시간 업데이트: Supabase Realtime (선택)

데이터베이스:
└─ Supabase PostgreSQL
```

---

## 2. 데이터 모델

### 2.1 핵심 엔티티

#### youtube_comments
```sql
CREATE TABLE youtube_comments (
  -- Primary Key
  comment_id TEXT PRIMARY KEY,
  video_id TEXT NOT NULL,

  -- 콘텐츠 (불변)
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  text_original TEXT NOT NULL,

  -- 메타데이터 (변함)
  like_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ NOT NULL,

  -- LLM 분석 결과
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  sentiment_confidence DECIMAL(3,2),
  sentiment_analyzed_at TIMESTAMPTZ,

  -- 데이터 출처
  data_source TEXT CHECK (data_source IN ('official_api', 'unofficial_api')),

  -- 타임스탬프
  collected_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(comment_id, video_id)
);
```

#### video_insight (기존 테이블 활용/확장)
```json
{
  video_id: "VIDEO_ID",

  comment_analysis: {
    sentiment_distribution: {
      positive: 65,        // %
      neutral: 20,
      negative: 15
    },
    community_emotion_score: 65,  // 0-100 (긍정 비율)
    total_comments_analyzed: 950,
    data_freshness: "2시간 전",   // 분석 시점
    last_analyzed_at: "2025-10-18T20:30:00Z"
  },

  caption_analysis: {
    // 기존 자막 분석 결과
    sentiment: "positive",
    topics: ["교육", "기술"],
    ...
  }
}
```

#### comment_metadata_history (변화 추적)
```sql
CREATE TABLE comment_metadata_history (
  history_id BIGSERIAL PRIMARY KEY,
  comment_id TEXT NOT NULL,
  video_id TEXT NOT NULL,
  collected_at TIMESTAMPTZ NOT NULL,
  like_count INTEGER NOT NULL,
  reply_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  FOREIGN KEY (comment_id) REFERENCES youtube_comments(comment_id),
  INDEX (comment_id, collected_at)
);
```

#### comment_collection_state (증분 수집 추적)
```sql
CREATE TABLE comment_collection_state (
  video_id TEXT PRIMARY KEY,

  last_collected_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
  last_collection_time TIMESTAMPTZ,
  total_comments_collected INTEGER DEFAULT 0,

  last_analysis_time TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. Edge Function 구조

### 3.1 메인 파이프라인

```
supabase/functions/
├─ analyze-video-comments/         # 메인 진입점
│  └─ index.ts
│
├─ collect-comments/               # Phase 1: 댓글 수집
│  ├─ index.ts
│  ├─ collection.ts                # NEWEST_FIRST 수집
│  ├─ deduplication.ts             # UPSERT 처리
│  └─ batch.ts                     # 배칭 최적화
│
├─ analyze-sentiment/              # Phase 2: 감정 분석
│  ├─ index.ts
│  ├─ batch-analyze.ts             # LLM 배칭
│  └─ emotion-score.ts             # 감정도 계산
│
├─ analyze-captions/               # Phase 3: 자막 분석
│  ├─ index.ts
│  └─ (기존 로직 재사용)
│
└─ _shared/
   ├─ youtube-api.ts               # youtubei.js 래퍼
   ├─ insights.ts                  # Insight JSON 생성
   ├─ types.ts                     # 공유 타입
   └─ db.ts                        # DB 유틸
```

### 3.2 메인 함수 (analyze-video-comments)

```ts
// supabase/functions/analyze-video-comments/index.ts

Deno.serve(async (req) => {
  const { videoId } = await req.json();

  try {
    // 1. 댓글 분석 + 자막 분석 병렬 시작
    const [commentResult, captionResult] = await Promise.allSettled([
      analyzeComments(videoId),   // 병렬 1
      analyzeCaptions(videoId),   // 병렬 2 (기존 함수)
    ]);

    // 2. 결과 합성
    const insightData = mergeInsights(
      commentResult.status === 'fulfilled' ? commentResult.value : null,
      captionResult.status === 'fulfilled' ? captionResult.value : null
    );

    // 3. video_insight에 저장
    const { error } = await supabase
      .from('videos')
      .update({
        video_insight: insightData,
        last_analyzed_at: new Date(),
      })
      .eq('video_id', videoId);

    if (error) throw error;

    return Response.json({
      success: true,
      videoId,
      insightData,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error(`Analysis failed for ${videoId}:`, error);
    // 부분 성공 허용: 한쪽이 실패해도 진행
    throw error;
  }
});
```

---

## 4. 병렬 처리 전략

### 4.1 댓글 분석 파이프라인 (배치 방식)

```ts
// supabase/functions/collect-comments/index.ts

async function analyzeComments(videoId: string) {
  // Phase 1: 댓글 수집 (1000개 한계)
  const newComments = await collectCommentsIncremental(videoId);
  console.log(`Collected ${newComments.length} new comments`);

  // Phase 2: 배치 분석 (한 번에 다중 댓글)
  // 예: 1000개 댓글 → 100개씩 10배치 → 10회 Gemini API 호출
  const analyzedComments = await batchAnalyzeSentiment(newComments);
  console.log(`Analyzed via batching: ${analyzedComments.length} comments`);

  // Phase 3: 감정도 계산 (모든 댓글 기반)
  const allComments = await supabase
    .from('youtube_comments')
    .select('sentiment')
    .eq('video_id', videoId);

  const emotionScore = calculateEmotionScore(allComments);

  // Phase 4: 변화 이력 저장
  await recordMetadataHistory(videoId, newComments);

  return {
    newCommentsCount: newComments.length,
    analyzedCommentsCount: analyzedComments.length,
    totalApiCalls: Math.ceil(analyzedComments.length / 100),  // 배치 호출 수
    emotionScore,
    timestamp: new Date(),
  };
}
```

### 4.2 병렬 실행 (Promise.allSettled)

```ts
// supabase/functions/analyze-video-comments/index.ts

const [commentResult, captionResult] = await Promise.allSettled([
  // 병렬 1: 댓글 분석
  (async () => {
    try {
      return await analyzeComments(videoId);
    } catch (error) {
      console.error('Comment analysis failed:', error);
      // Fallback: 기존 값 유지
      const existing = await getExistingInsight(videoId);
      return existing?.comment_analysis || null;
    }
  })(),

  // 병렬 2: 자막 분석 (기존)
  (async () => {
    try {
      return await analyzeCaptions(videoId);
    } catch (error) {
      console.error('Caption analysis failed:', error);
      const existing = await getExistingInsight(videoId);
      return existing?.caption_analysis || null;
    }
  })(),
]);

// 결과 처리
const commentData = commentResult.status === 'fulfilled'
  ? commentResult.value
  : null;

const captionData = captionResult.status === 'fulfilled'
  ? captionResult.value
  : null;
```

**효과**:
- 동시 실행 → 2개 파이프라인이 병렬로 진행
- 타임아웃 독립: 댓글 지연 ≠ 자막 지연
- 부분 성공: 하나 실패해도 다른 하나는 진행

---

## 5. 증분 수집 + 지능형 배칭

### 5.1 수집 흐름

```ts
async function collectCommentsIncremental(videoId: string) {
  // 1. 상태 로드
  const state = await loadCollectionState(videoId);

  // 2. NEWEST_FIRST로 수집
  let comments = [];
  let commentBatch = await innertube.getComments(
    videoId,
    'NEWEST_FIRST'
  );

  // 3. 경계 감지 (lastIds 만날 때까지)
  for (const comment of commentBatch.contents) {
    if (state.lastCollectedIds.includes(comment.comment_id)) {
      console.log(`Boundary found at ${comment.comment_id}`);
      break;
    }
    comments.push(comment);
  }

  // 4. UPSERT (중복 제거)
  const { data } = await supabase
    .from('youtube_comments')
    .upsert(comments, { onConflict: 'comment_id' });

  // 5. 상태 업데이트
  await updateCollectionState(videoId, {
    lastCollectedIds: comments.slice(0, 10).map(c => c.comment_id),
    lastCollectionTime: new Date(),
  });

  return comments;
}
```

### 5.2 신규 댓글만 분석 (비용 최적화)

```ts
async function analyzeNewComments(videoId: string) {
  // 1. 미분석 댓글만 필터링
  const newComments = await supabase
    .from('youtube_comments')
    .select('*')
    .eq('video_id', videoId)
    .is('sentiment', null)
    .order('collected_at', { ascending: false });

  console.log(`New comments to analyze: ${newComments.length}`);

  if (newComments.length === 0) {
    console.log('No new comments to analyze');
    return calculateEmotionScoreFromExisting(videoId);
  }

  // 2. 신규 댓글만 배치로 묶기
  const BATCH_SIZE = 100;
  const batches = [];
  for (let i = 0; i < newComments.length; i += BATCH_SIZE) {
    batches.push(newComments.slice(i, i + BATCH_SIZE));
  }

  console.log(`Batches to analyze: ${batches.length}`);

  // 3. 각 배치를 Gemini API로 분석 (신규만)
  const analyzedResults = [];
  for (const batch of batches) {
    const batchResults = await geminiAnalyzeBatch(batch);
    analyzedResults.push(...batchResults);
  }

  // 4. 신규 결과만 DB에 저장
  await supabase
    .from('youtube_comments')
    .upsert(analyzedResults.map(r => ({
      comment_id: r.comment_id,
      sentiment: r.sentiment,
      sentiment_confidence: r.confidence,
      sentiment_analyzed_at: new Date(),
    })), { onConflict: 'comment_id' });

  // 5. 전체 풀에서 감정도 재계산 (기존 + 신규)
  const allCommentsInDb = await supabase
    .from('youtube_comments')
    .select('sentiment')
    .eq('video_id', videoId);

  const previousAnalysis = await getLatestAnalysis(videoId);
  const emotionData = calculateEmotionScore(allCommentsInDb, previousAnalysis);

  return emotionData;
}

// 한 번의 API 호출에 배치의 모든 댓글 분석
async function geminiAnalyzeBatch(
  comments: CommentData[]
): Promise<AnalysisResult[]> {
  const prompt = `다음 ${comments.length}개 YouTube 댓글의 감정을 분석해주세요.
각 댓글마다 긍정(positive), 중립(neutral), 부정(negative)으로 분류해서 JSON 배열로 반환.

[댓글 목록]
${comments.map((c, i) => `${i+1}. [ID: ${c.comment_id}] "${c.text_original}"`).join('\n')}

응답 형식:
[
  { "comment_id": "Ugz...", "sentiment": "positive", "confidence": 0.95 },
  { "comment_id": "Ugz...", "sentiment": "neutral", "confidence": 0.85 },
  ...
]`;

  const result = await generateObject({
    model: gemini,
    schema: z.array(z.object({
      comment_id: z.string(),
      sentiment: z.enum(['positive', 'neutral', 'negative']),
      confidence: z.number().min(0).max(1),
    })),
    prompt,
  });

  return result.object;
}

// 감정도 계산 (전체 풀 기준)
function calculateEmotionScore(allComments, previousAnalysis) {
  const distribution = {
    positive: (allComments.filter(c => c.sentiment === 'positive').length / allComments.length) * 100,
    neutral: (allComments.filter(c => c.sentiment === 'neutral').length / allComments.length) * 100,
    negative: (allComments.filter(c => c.sentiment === 'negative').length / allComments.length) * 100,
  };

  const currentScore = distribution.positive;
  const previousScore = previousAnalysis?.emotion_score || null;
  const dailyChange = previousScore ? currentScore - previousScore : null;

  return {
    emotion_score: currentScore,
    distribution,
    total_comments: allComments.length,
    daily_change: dailyChange,
    previous_score: previousScore,
  };
}
```

**비용 분석 (신규만 분석):**
```
Day 1: 초기 100개 댓글
  ├─ 배치: 1회
  ├─ API 호출: 1회
  └─ 감정도: 70%

Day 2: 신규 15개만 분석 (기존 100개는 재분석 안함)
  ├─ 배치: 1회
  ├─ API 호출: 1회
  ├─ 전체 풀: 115개에서 감정도 재계산
  ├─ 감정도: 68%
  ├─ 변화: -2%
  └─ 트렌드 기록

Day 30 누적:
  ├─ 매일 ~1회 호출 (일평균 신규 10-15개)
  ├─ 총 API 호출: ~30회
  ├─ 누적 비용: ~$0.03
  └─ 득: 비용 효율적 + 정확한 커뮤니티 추이 추적 가능
```

---

## 6. Insight JSON 구조

### 6.1 최종 저장 형식

```json
{
  "video_id": "VIDEO_ID",

  "comment_analysis": {
    "metadata": {
      "total_comments_analyzed": 1000,
      "analyzed_at": "2025-10-18T20:30:00Z",
      "data_freshness_hours": 2
    },

    "current_emotion": {
      "community_emotion_score": 65,  // 긍정 댓글 비율
      "distribution": {
        "positive": 650,
        "neutral": 200,
        "negative": 150
      },
      "percentage": {
        "positive": 65,
        "neutral": 20,
        "negative": 15
      }
    },

    "trend": {
      "daily_change": -5,  // 어제 70% → 오늘 65%
      "previous_score": 70,
      "trend_7_days": [70, 68, 67, 66, 65, 64, 65],
      "trend_direction": "declining",  // 하락 추세
      "insights": "커뮤니티 감정이 점진적으로 하락 중"
    }
  },

  "caption_analysis": {
    "metadata": { ... },
    "sentiment": "positive",
    "topics": ["교육", "기술"],
    ...
  },

  "combined_credibility": {
    "overall_trust_level": "medium",
    "comment_trend": "declining",  // 감정 하락
    "caption_sentiment": "positive",  // 자막 긍정
    "recommendation": "커뮤니티 반응이 하락 중이지만 자막 내용은 긍정적"
  }
}
```

---

## 7. UI 컴포넌트 구조

### 7.1 Svelte 컴포넌트

```
src/lib/components/video-analysis/
├─ EmotionBadge.svelte
│  └─ 감정도 배지 (0-100, 색상 표시)
│
├─ EmotionChart.svelte
│  └─ 긍정/중립/부정 분포 차트
│
├─ DataFreshness.svelte
│  └─ "2시간 전 분석" 표시
│
├─ AnalysisDetail.svelte
│  └─ 전체 분석 결과 상세 보기
│
└─ VideoInsightCard.svelte
   └─ 통합 카드 (배지 + 차트 + 신선도)
```

### 7.2 데이터 로드

```ts
// src/routes/videos/[videoId]/+page.svelte

<script>
  import { onMount } from 'svelte';

  let insightData = null;
  let isLoading = true;

  onMount(async () => {
    // 1. video_insight 로드
    const response = await fetch(`/api/videos/${videoId}/insight`);
    insightData = await response.json();

    // 2. Realtime 구독 (선택)
    supabase
      .channel(`video:${videoId}`)
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'videos',
          filter: `video_id=eq.${videoId}`
        },
        (payload) => {
          insightData = payload.new.video_insight;
        }
      )
      .subscribe();
  });
</script>

<!-- UI 렌더링 -->
{#if insightData?.comment_analysis}
  <EmotionBadge
    score={insightData.comment_analysis.emotion.community_emotion_score}
  />

  <EmotionChart
    data={insightData.comment_analysis.emotion.distribution}
  />

  <DataFreshness
    timestamp={insightData.comment_analysis.metadata.analyzed_at}
  />
{/if}
```

---

## 8. 구현 단계 (Timeline)

### Phase 1: 데이터 적재 (3-4일)
- [ ] 테이블 마이그레이션 (youtube_comments, state, history)
- [ ] 댓글 수집 함수 (비공식 API, NEWEST_FIRST, 100개 한계)
- [ ] UPSERT 중복 제거 (Comment ID 기반)
- [ ] 메타데이터 갱신 로직 (like_count, reply_count)

### Phase 2: 감정 분석 배칭 (3-4일)
- [ ] Gemini 배치 분석 함수 (신규 댓글 100개씩 묶음)
- [ ] 미분석 댓글만 필터링 (sentiment IS NULL)
- [ ] 한 번의 API 호출에 배치 댓글 포함
- [ ] 신규 결과만 DB에 저장 후 전체 풀에서 감정도 재계산
- [ ] 커뮤니티 감정도 계산 (긍정 댓글 비율)
- [ ] 일일 변화 추적 및 7일 트렌드 기록

### Phase 3: 병렬 처리 (2-3일)
- [ ] Insight JSON 생성
- [ ] 자막 분석과 댓글 분석 동시 실행
- [ ] Promise.allSettled() 에러 처리
- [ ] video_insight 컬럼 자동 주입

### Phase 4: UI & 배포 (2-3일)
- [ ] 감정도 배지 컴포넌트 (0-100)
- [ ] 감정 분포 차트 (긍정/중립/부정)
- [ ] 데이터 신선도 표시 ("2시간 전 분석")
- [ ] 자동 트리거 통합 (영상 분석 시 자동)
- [ ] 테스트 & 배포

---

## 9. 성능 목표

```
데이터 수집:      신규 댓글 수집 < 5초
                 + DB에서 누적 댓글 로드 (최근 100개)

감정 분석:       신규 댓글만 배치 분석 (기존은 재분석 안함)
                 ├─ Day 1: 100개 = 1개 배치 = 1회 API 호출
                 ├─ Day 2: ~15개 신규 = 1회 API 호출
                 ├─ 배치당 응답: 2~3초
                 ├─ 전체 풀에서 감정도 재계산: < 1초
                 └─ 병렬 자막: 동시 진행

병렬 처리:       댓글(3-5초) + 자막 분석 동시
                 ├─ 총 시간: ~5초 (최대값)
                 └─ 단일 대비 1.5배 빠름

UI 렌더링:       < 500ms

메모리:          < 50MB (처리 중)

매일 API 호출:   ~1회 (Gemini, 신규만 분석)
                 ├─ 비용: ~$0.0001 ~ $0.0005/분석
                 ├─ 월비용: ~$0.003 (30일 × 1회)
                 └─ 비용 효율적 + 정확한 트렌드 추적 ✅
```

---

## 10. 리스크 및 완화 전략

| 리스크 | 확률 | 영향 | 완화 전략 |
|-------|------|------|---------|
| YouTube API 레이트 제한 | 높음 | 높음 | 비공식 API 우선, 할당량 추적 |
| LLM 분석 비용 증가 | 중간 | 높음 | 지능형 배칭, 캐시 활용 |
| 데이터 불일치 | 낮음 | 중간 | 증분 수집 상태 추적 |
| UI 렌더링 지연 | 낮음 | 낮음 | 비동기 로딩, Realtime 구독 |
| 병렬 처리 타임아웃 | 중간 | 중간 | Promise.allSettled, 부분 성공 허용 |

---

## 11. 의존성 및 기술 선택

### 기술 스택
- **댓글 수집**: youtubei.js v16+ (NEWEST_FIRST)
- **데이터베이스**: Supabase PostgreSQL
- **LLM 분석**: 기존 AI 통합 (한국어 지원 필수)
- **병렬 처리**: Deno Promise API
- **UI**: Svelte 5 + 기존 차트 라이브러리

### 성공 기준
- ✅ 1000개 댓글 신뢰도 높게 수집
- ✅ 감정도 계산 정확도 > 0.75
- ✅ Insight 자동 주입 100% 성공
- ✅ 병렬 처리 시간 단일 대비 1.8배
- ✅ UI 렌더링 500ms 이내

---

## 12. 다음 단계

이 plan을 바탕으로:
1. `/speckit.tasks` 실행 → 구체적 Task 생성
2. 데이터 마이그레이션 생성
3. Edge Function 스켈레톤 작성
4. UI 프로토타입 구현

---
