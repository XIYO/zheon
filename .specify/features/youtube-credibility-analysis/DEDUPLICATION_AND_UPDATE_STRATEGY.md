# 댓글 중복 제거 및 메타데이터 업데이트 전략

**작성**: 2025-10-18
**목적**: 매일 수집되는 댓글 데이터의 중복 제거와 효율적 업데이트 전략

---

## 1. 문제 정의

### 1.1 중복 데이터 문제

매일 댓글을 수집할 때 발생하는 문제:

```
Day 1 수집:
├─ Video: "ABC123"
├─ Comments: C1, C2, C3
└─ LLM 감정 분석: 3회 호출 (비용 발생)

Day 2 수집:
├─ Video: "ABC123" (동일 영상)
├─ Comments: C1, C2, C3, C4 (C1,C2,C3 중복!)
└─ LLM 감정 분석: 4회 호출 (C1,C2,C3 재분석 = 낭비)

결과: 불필요한 LLM 호출 증가 → 비용 증가
```

### 1.2 메타데이터 변화 문제

댓글의 메타데이터는 시간에 따라 변함:

```
댓글 C1 (Day 1):
├─ like_count: 10
├─ reply_count: 2
└─ sentiment: 'positive' (LLM 분석 결과)

댓글 C1 (Day 2):
├─ like_count: 25 (증가!)
├─ reply_count: 5 (증가!)
└─ sentiment: 'positive' (재분석 불필요)

필요한 것: like_count, reply_count 업데이트
불필요한 것: sentiment 재분석
```

---

## 2. 해결 전략: Comment ID 기반 UPSERT

### 2.1 고유 식별자 (Unique Identifier)

#### 공식 API
```
comment_id: "Ugz..." (YouTube 고유 ID)
├─ 전 영상에서 고유
├─ 절대 변하지 않음
└─ 신뢰도: ★★★★★
```

#### 비공식 API
```
comment_id: "Ugz..." (동일한 YouTube ID)
├─ 공식 API와 동일
├─ 하지만 파싱 실패 가능성 있음
└─ 신뢰도: ★★★★☆
```

**전략**: 두 API 모두 동일한 YouTube comment_id 사용

### 2.2 데이터베이스 스키마 설계

```sql
CREATE TABLE youtube_comments (
  -- Primary Key
  comment_id TEXT PRIMARY KEY,  -- YouTube 고유 ID (Ugz...)
  video_id TEXT NOT NULL,

  -- 콘텐츠 (불변)
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  text_original TEXT NOT NULL,  -- 원본 댓글 (변하지 않음)
  text_normalized TEXT,          -- 정규화된 텍스트

  -- 메타데이터 (변함)
  like_count INTEGER NOT NULL DEFAULT 0,
  reply_count INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- LLM 분석 결과 (변하지 않음 = 캐시 가능)
  sentiment TEXT,  -- 'positive' | 'neutral' | 'negative'
  sentiment_confidence DECIMAL(3,2),
  sentiment_analyzed_at TIMESTAMPTZ,
  sentiment_model_version TEXT,  -- v1.0, v1.1, ...

  -- 데이터 출처 추적
  data_source TEXT NOT NULL,  -- 'official_api' | 'unofficial_api'
  data_source_confidence DECIMAL(3,2),  -- 0.95 or 0.75

  -- 변경 추적
  collected_at TIMESTAMPTZ DEFAULT NOW(),  -- 수집 시간
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),  -- 마지막 업데이트
  metadata_change_count INTEGER DEFAULT 0,  -- 업데이트 횟수
  sentiment_needs_refresh BOOLEAN DEFAULT FALSE,

  UNIQUE(comment_id, video_id)
);

CREATE INDEX idx_youtube_comments_video_id ON youtube_comments(video_id);
CREATE INDEX idx_youtube_comments_collected_at ON youtube_comments(collected_at);
```

---

## 3. UPSERT 작업 흐름

### 3.1 Day 1: 초기 수집

```ts
// 댓글 C1 첫 수집
const commentData = {
  comment_id: 'Ugz_abc123',
  video_id: 'VIDEO_ID',
  author_id: 'CHANNEL_ID',
  author_name: '사용자',
  text_original: '좋은 영상이네요',
  like_count: 10,
  reply_count: 2,
  published_at: '2025-10-18T10:00:00Z',
  data_source: 'official_api',
  data_source_confidence: 0.95,
  collected_at: NOW(),
};

// INSERT (첫 수집이므로 UPSERT에서 INSERT)
await supabase
  .from('youtube_comments')
  .upsert([commentData], {
    onConflict: 'comment_id',
  });

// 결과: 1개 행 INSERT
// LLM 호출: 1회 (감정 분석)
```

### 3.2 Day 2: 업데이트 수집

```ts
// 같은 댓글 C1 재수집 (like_count 증가)
const updatedCommentData = {
  comment_id: 'Ugz_abc123',  // 동일
  video_id: 'VIDEO_ID',       // 동일
  author_id: 'CHANNEL_ID',    // 동일
  author_name: '사용자',       // 동일
  text_original: '좋은 영상이네요',  // 동일 (변하지 않음)
  like_count: 25,  // 변함 (10 → 25)
  reply_count: 5,  // 변함 (2 → 5)
  published_at: '2025-10-18T10:00:00Z',  // 동일
  data_source: 'official_api',  // 동일
  data_source_confidence: 0.95,
  collected_at: NOW(),  // 새 수집 시간
  last_updated_at: NOW(),
  metadata_change_count: 1,  // 업데이트 횟수 증가
  sentiment: 'positive',  // 기존 분석 결과 유지
  sentiment_analyzed_at: '2025-10-18T10:05:00Z',  // 기존
};

// UPSERT (동일 comment_id가 존재하므로 UPDATE)
await supabase
  .from('youtube_comments')
  .upsert([updatedCommentData], {
    onConflict: 'comment_id',
  });

// 결과:
// - 1개 행 UPDATE (like_count, reply_count만 변경)
// - text_original은 UPDATE 안됨 (동일)
// - sentiment는 UPDATE 안됨 (재분석 불필요)
// LLM 호출: 0회 (감정 분석 생략)
```

**효과**:
- Day 1: LLM 호출 3회 (C1, C2, C3 분석)
- Day 2: LLM 호출 1회 (C4 분석만, C1-C3 생략)
- **절약: 75% 비용 감소**

---

## 4. 공식 API vs 비공식 API 처리

### 4.1 공식 API 업데이트 로직

```ts
// YouTube API로 수집한 데이터
const officialCommentData = {
  comment_id: 'Ugz_abc123',
  like_count: 25,
  // ... 기타 필드
  data_source: 'official_api',
  data_source_confidence: 0.95,
};

// 우선순위: 공식 API 데이터 우선
await supabase.rpc('upsert_comment_with_source_priority', {
  p_comment_id: 'Ugz_abc123',
  p_data_source: 'official_api',
  p_data: officialCommentData,
});
```

### 4.2 비공식 API 업데이트 로직

```ts
// youtubei.js로 수집한 데이터 (정규화됨)
const unofficialCommentData = {
  comment_id: 'Ugz_abc123',
  like_count: 25,  // "25K" → 25000 파싱
  // ... 기타 필드
  data_source: 'unofficial_api',
  data_source_confidence: 0.75,  // 신뢰도 낮음
};

// 처리 로직
if (existingComment.data_source === 'official_api') {
  // 기존이 공식 API이면 비공식 API 데이터 무시
  console.log('Skip: Official API data already exists');
} else if (existingComment.data_source === 'unofficial_api') {
  // 기존과 동일 출처면 업데이트
  await supabase
    .from('youtube_comments')
    .update(unofficialCommentData)
    .eq('comment_id', 'Ugz_abc123');
}
```

### 4.3 혼합 출처 처리 규칙

```
상황별 업데이트 규칙:

Case 1: 공식 → 공식
├─ 모든 필드 업데이트 ✅
├─ LLM 재분석: 텍스트 변경 시만
└─ 신뢰도: 0.95 유지

Case 2: 공식 → 비공식
├─ 메타데이터만 업데이트 (like_count 등)
├─ 텍스트 필드는 무시 (공식이 더 신뢰)
├─ LLM 재분석: 안함
└─ 신뢰도: 0.95 유지 (공식 데이터 우선)

Case 3: 비공식 → 공식
├─ 모든 필드 업데이트 ✅
├─ LLM 재분석: 텍스트 변경 시
└─ 신뢰도: 0.95로 상향 (비공식 → 공식)

Case 4: 비공식 → 비공식
├─ 메타데이터만 업데이트
├─ LLM 재분석: 안함
└─ 신뢰도: 0.75 유지
```

---

## 5. 메타데이터 변화 감지

### 5.1 변화 추적 테이블

```sql
CREATE TABLE youtube_comments_history (
  history_id BIGSERIAL PRIMARY KEY,
  comment_id TEXT NOT NULL REFERENCES youtube_comments(comment_id),
  collected_at TIMESTAMPTZ NOT NULL,
  like_count INTEGER NOT NULL,
  reply_count INTEGER NOT NULL,
  data_source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  FOREIGN KEY (comment_id) REFERENCES youtube_comments(comment_id)
);

CREATE INDEX idx_comments_history_comment_id
  ON youtube_comments_history(comment_id, collected_at);
```

### 5.2 변화 감지 로직

```ts
interface CommentUpdate {
  comment_id: string;
  old_like_count: number;
  new_like_count: number;
  like_count_changed: boolean;
  old_reply_count: number;
  new_reply_count: number;
  reply_count_changed: boolean;
  change_magnitude: 'small' | 'medium' | 'large';  // 변화 크기
}

function detectMetadataChanges(
  existing: YTComment,
  incoming: YTComment
): CommentUpdate {
  const likes_delta = incoming.like_count - existing.like_count;
  const replies_delta = incoming.reply_count - existing.reply_count;

  return {
    comment_id: existing.comment_id,
    old_like_count: existing.like_count,
    new_like_count: incoming.like_count,
    like_count_changed: likes_delta !== 0,
    old_reply_count: existing.reply_count,
    new_reply_count: incoming.reply_count,
    reply_count_changed: replies_delta !== 0,
    change_magnitude:
      likes_delta > 100 || replies_delta > 50 ? 'large'
      : likes_delta > 10 || replies_delta > 5 ? 'medium'
      : 'small',
  };
}
```

### 5.3 신뢰도 점수 재계산 필요 여부

```ts
interface CredibilityRecalcThreshold {
  // 신뢰도 재계산이 필요한 임계값
  like_count_delta: number;      // 좋아요 변화량
  reply_count_delta: number;     // 답글 변화량
  days_since_last_analysis: number;  // 분석 후 경과 일수
  sentiment_confidence_threshold: number;  // 신뢰도 하한선
}

const RECALC_THRESHOLD = {
  like_count_delta: 50,  // 좋아요가 50개 이상 증가
  reply_count_delta: 10, // 답글이 10개 이상 증가
  days_since_last_analysis: 30,  // 30일 이상 경과
  sentiment_confidence_threshold: 0.75,  // 신뢰도 75% 이하
};

function shouldRecalculateCredibility(
  existing: YTComment,
  incoming: YTComment
): boolean {
  const likes_delta = incoming.like_count - existing.like_count;
  const replies_delta = incoming.reply_count - existing.reply_count;
  const days_elapsed =
    (Date.now() - existing.sentiment_analyzed_at.getTime()) /
    (1000 * 60 * 60 * 24);

  return (
    likes_delta > RECALC_THRESHOLD.like_count_delta ||
    replies_delta > RECALC_THRESHOLD.reply_count_delta ||
    days_elapsed > RECALC_THRESHOLD.days_since_last_analysis ||
    (existing.sentiment_confidence &&
     existing.sentiment_confidence < RECALC_THRESHOLD.sentiment_confidence_threshold)
  );
}
```

---

## 6. 일일 수집 파이프라인 (Daily Collection Pipeline)

### 6.1 수집 → 저장 → 분석 흐름

```
Daily Batch Job:
│
├─ 1. 수집 (Collection)
│  ├─ 공식 API: getComments(videoId) × 5000개 한계
│  └─ 비공식 API: getComments(videoId) × 무제한
│
├─ 2. 중복 제거 (Deduplication)
│  ├─ comment_id로 기존 데이터 조회
│  ├─ 메타데이터 변화 감지
│  └─ 신뢰도 재계산 필요 판단
│
├─ 3. UPSERT
│  ├─ 신규: INSERT
│  ├─ 기존: UPDATE (메타데이터만)
│  └─ 결과: N개 행 처리
│
├─ 4. LLM 배치 (Batch Processing)
│  ├─ 신규 댓글만 필터: 감정 분석 필요
│  ├─ 선별 댓글: 신뢰도 재계산 필요
│  └─ LLM 호출: M회 (N >> M)
│
├─ 5. 메타데이터 이력 저장
│  └─ 변화 추적: youtube_comments_history 기록
│
└─ 6. 신뢰도 점수 갱신
   ├─ 영상별 신뢰도 재계산
   └─ 캐시 무효화
```

### 6.2 비용 효율성 계산

```
예시: YouTube 영상 댓글 1000개, 30일 수집

Scenario A: 중복 제거 없음 (비효율)
├─ Day 1: 1000개 수집 → LLM 1000회 호출
├─ Day 2~30: 각 1000개 수집 → 각 LLM 1000회 호출
├─ 총 LLM 호출: 30,000회
└─ 비용: 약 $3,000 (호출당 $0.10 기준)

Scenario B: 중복 제거 + UPSERT (효율)
├─ Day 1: 1000개 → LLM 1000회
├─ Day 2~30: 평균 50개 신규 → 각 LLM 50회
├─ 총 LLM 호출: 1000 + (50 × 29) = 2,450회
└─ 비용: 약 $245

절약: $2,755 (91.8% 비용 절감!)
```

---

## 7. Spec에 반영할 데이터 적재 요구사항

### 7.1 새로운 Functional Requirement

| ID | Requirement | Description |
|----|-------------|-------------|
| FR11 | 중복 제거 | Comment ID 기반 UPSERT로 중복 댓글 제거 |
| FR12 | 메타데이터 업데이트 | like_count, reply_count 변화 추적 및 업데이트 |
| FR13 | 지능형 LLM 배칭 | 신규 댓글만 감정 분석, 기존 결과 재사용 |
| FR14 | 소스 우선순위 | 공식 API 데이터 우선, 비공식으로 보충 |
| FR15 | 변화 이력 추적 | 메타데이터 변화 기록 저장 |

### 7.2 새로운 Non-Functional Requirement

| ID | Requirement | Target |
|----|-------------|--------|
| NFR7 | 중복 제거율 | 90% 이상 |
| NFR8 | LLM 호출 절감 | 기본 대비 80% 이상 감소 |
| NFR9 | 데이터베이스 저장량 | 중복 제거로 50% 절감 |
| NFR10 | 업데이트 처리 시간 | 1000개 댓글 5초 이내 |

---

## 8. 구현 예시 (Supabase Edge Function)

```ts
// supabase/functions/collect-video-comments/index.ts

async function dailyCommentCollection(videoId: string) {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  // 1. 데이터 수집
  const comments = await collectComments(videoId);  // 신규 + 기존

  // 2. 중복 제거 & UPSERT
  const results = {
    new: 0,
    updated: 0,
    llmCalls: 0,
  };

  for (const comment of comments) {
    const existing = await supabase
      .from('youtube_comments')
      .select('*')
      .eq('comment_id', comment.comment_id)
      .single();

    if (!existing.data) {
      // 신규 댓글: INSERT + LLM 호출
      await supabase
        .from('youtube_comments')
        .insert([comment]);

      await llmAnalyzeSentiment(comment);
      results.new++;
      results.llmCalls++;
    } else {
      // 기존 댓글: UPSERT (메타데이터만)
      const shouldRecalc = shouldRecalculateCredibility(
        existing.data,
        comment
      );

      await supabase
        .from('youtube_comments')
        .update({
          like_count: comment.like_count,
          reply_count: comment.reply_count,
          last_updated_at: new Date(),
        })
        .eq('comment_id', comment.comment_id);

      if (shouldRecalc) {
        await llmAnalyzeSentiment(comment);
        results.llmCalls++;
      }

      results.updated++;
    }
  }

  return results;
}
```

---

## 9. 결론

### 효과
- **비용**: 80-90% 절감
- **저장소**: 50% 절감
- **신뢰도**: 공식 API 우선으로 신뢰도 유지

### 핵심
- Comment ID = 고유 식별자 (공식, 비공식 통일)
- UPSERT = 중복 제거 + 효율적 업데이트
- 지능형 LLM 배칭 = 필요한 것만 분석
