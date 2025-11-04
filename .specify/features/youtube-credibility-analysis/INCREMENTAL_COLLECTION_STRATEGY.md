# 증분 댓글 수집 전략: 매일 신규 댓글만 추출

**작성**: 2025-10-18
**목적**: 매일 100개씩 누적되는 댓글을 효율적으로 증분 수집

---

## 1. 문제 정의

### 1.1 시나리오

```
Day 1 (2025-10-18):
├─ 추출: C1, C2, ..., C100
├─ DB 저장: 100개
└─ 상태: 저장 완료

Day 2 (2025-10-19):
├─ YouTube: C1~C200 (100개 신규 추가)
├─ 우리 목표: C101~C200만 추출 (C1~C100 제외)
├─ 문제: 공식/비공식 API 모두 정렬이 바뀜
└─ 결과: 어디서 끝났는지 알 수 없음
```

### 1.2 정렬 변화 문제

**공식 API (TOP_COMMENTS 고정)**:
```
Day 1 수집 순서:
1. C1 (100좋아요)
2. C2 (50좋아요)
3. C3 (30좋아요)
...
100. C100 (1좋아요)

Day 2 수집 순서 (정렬이 변함!):
1. C150 (200좋아요) ← 새 댓글, 좋아요 많음
2. C1 (110좋아요) ← 기존 댓글, 좋아요 증가
3. C2 (50좋아요)
...

문제: "Day 1의 어디까지 가져왔는가?"를 추적할 수 없음
```

**비공식 API (정렬 선택 가능)**:
```
NEWEST_FIRST로 가져오면:
1. C200 (금방 추가됨)
2. C199 (1분 전)
3. C198 (2분 전)
...
101. C100 (어제)
...

장점: 최신부터 순차적으로 가져올 수 있음
단점: 정렬 알고리즘 비공개 (언제든 변할 수 있음)
```

---

## 2. 공식 API의 증분 수집 (불가능에 가까움)

### 2.1 공식 API 제약사항

```
✅ 지원:
├─ id 필터: 특정 comment_id로 조회 가능
├─ parentId 필터: 특정 댓글의 답글 조회 가능
└─ pageToken: 페이지네이션

❌ 미지원:
├─ 날짜 필터 (publishedAt >= '2025-10-19')
├─ 정렬 옵션 (항상 TOP_COMMENTS)
├─ 오프셋 (skip N comments)
└─ Last N minutes 필터
```

### 2.2 공식 API 증분 수집 방법 (권장되지 않음)

#### 방법 1: 매번 전체 수집 + 로컬 필터

```ts
// 매일 실행
async function collectCommentsDaily(videoId: string) {
  const lastFetchTime = await getLastFetchTime(videoId);

  // 1. 모든 댓글 수집 (할당량 주의!)
  let comments = [];
  let pageToken = null;

  do {
    const response = await youtube.comments.list({
      part: 'snippet',
      videoId: videoId,
      maxResults: 100,
      pageToken: pageToken,
    });

    comments = comments.concat(response.items);
    pageToken = response.nextPageToken;

    // 할당량 소비가 심함!
    // 100개 댓글 = 1 unit, 1000개 = 10 units
    // 일일 할당량: 10,000 units (약 1000개 댓글만)
  } while (pageToken);

  // 2. 로컬 필터: publishedAt 이후 댓글만
  const newComments = comments.filter(c => {
    const publishedAt = new Date(c.snippet.publishedAt);
    return publishedAt > lastFetchTime;
  });

  // 3. 저장
  await saveComments(newComments);
  await updateLastFetchTime(videoId, new Date());
}
```

**문제점**:
- ❌ 매번 모든 댓글 수집 (시간 & 할당량 낭비)
- ❌ 정렬이 변하므로 로컬 필터 필수
- ❌ 1000개 이상 수집 시 여러 페이지 필요
- ❌ 할당량 부족 (1일 1000개 정도만 가능)

#### 방법 2: 마지막 comment_id 추적

```ts
async function collectCommentsIncremental(videoId: string) {
  const lastCommentId = await getLastCommentId(videoId);

  // ❌ 문제: 공식 API는 ID 기반 정렬이 없음!
  // 마지막 ID 이후의 댓글을 찾을 방법이 없음
}
```

**결론**: 공식 API로는 **증분 수집 불가능**

---

## 3. 비공식 API의 증분 수집 (권장)

### 3.1 비공식 API 장점

```ts
const comments = await innertube.getComments(
  videoId,
  'NEWEST_FIRST'  // ✅ 최신 댓글부터 시작!
);
```

**장점**:
- ✅ NEWEST_FIRST로 최신부터 순차적
- ✅ 새 댓글부터 가져올 수 있음
- ✅ 정렬 순서 일관성 높음

### 3.2 비공식 API 증분 수집 알고리즘

#### 알고리즘 A: 마지막 수집한 comment_id 추적

```ts
interface CollectionState {
  videoId: string;
  lastCollectedCommentIds: string[];  // 최근 10개
  lastCollectionTime: Date;
  totalCollected: number;
}

async function collectIncrementalNEWEST_FIRST(
  videoId: string,
  state: CollectionState
) {
  let comments: CommentView[] = [];
  const previousLastIds = state.lastCollectedCommentIds;

  // 1. NEWEST_FIRST로 가져오기
  let commentBatch = await innertube.getComments(
    videoId,
    'NEWEST_FIRST'
  );

  // 2. 기존 ID를 만날 때까지 수집
  for (const comment of commentBatch.contents) {
    if (previousLastIds.includes(comment.comment_id)) {
      console.log(`Found boundary: ${comment.comment_id}`);
      break;  // 기존 범위 도달 = 멈춤
    }

    comments.push(comment);
  }

  // 3. 다음 페이지 (continuation)
  while (commentBatch.has_continuation) {
    commentBatch = await commentBatch.getContinuation();

    for (const comment of commentBatch.contents) {
      if (previousLastIds.includes(comment.comment_id)) {
        break;
      }
      comments.push(comment);
    }
  }

  // 4. 저장 및 상태 업데이트
  await saveComments(comments);

  const newIds = comments
    .slice(0, 10)
    .map(c => c.comment_id);

  state.lastCollectedCommentIds = newIds;
  state.lastCollectionTime = new Date();
  state.totalCollected += comments.length;

  return {
    newComments: comments.length,
    state: state,
  };
}
```

**동작 원리**:
```
Day 1:
├─ 수집: C1, C2, ..., C100
├─ lastIds: [C1, C2, ..., C10]
└─ 저장

Day 2:
├─ NEWEST_FIRST로 시작: C200, C199, C198, ..., C1, C2, ...
├─ C100까지 수집하다가 C10을 만남
├─ 멈춤! (C10은 lastIds에 있음 = 기존 범위)
├─ 수집한 것: C200, C199, ..., C101 (100개)
└─ 정확하게 신규만 추출!
```

**장점**:
- ✅ O(n) 성능 (n = 신규 댓글 수)
- ✅ 할당량 절약
- ✅ 정확한 증분 수집

### 3.3 비공식 API 증분 수집 알고리즘 B: 타임스탬프 기반

```ts
async function collectIncrementalByTimestamp(
  videoId: string,
  lastCollectionTime: Date
) {
  let comments: CommentView[] = [];

  // 1. NEWEST_FIRST로 가져오기
  let commentBatch = await innertube.getComments(
    videoId,
    'NEWEST_FIRST'
  );

  // 2. 시간 기준으로 필터 (published_time 상대 시간 파싱 필요)
  for (const comment of commentBatch.contents) {
    const commentTime = parseRelativeTime(
      comment.published_time  // "3시간 전"
    );

    if (commentTime <= lastCollectionTime) {
      console.log(
        `Reached cutoff time: ${comment.published_time}`
      );
      break;
    }

    comments.push(comment);
  }

  // 3. continuation 처리
  while (commentBatch.has_continuation) {
    commentBatch = await commentBatch.getContinuation();

    for (const comment of commentBatch.contents) {
      const commentTime = parseRelativeTime(
        comment.published_time
      );

      if (commentTime <= lastCollectionTime) {
        break;
      }
      comments.push(comment);
    }
  }

  return comments;
}

// 상대 시간 파싱 함수
function parseRelativeTime(relativeTime: string): Date {
  // "3시간 전" → Date 객체로 변환
  // "1분 전" → Date 객체로 변환
  // "방금" → 현재 시간

  const now = new Date();

  if (relativeTime.includes('분')) {
    const mins = parseInt(relativeTime);
    return new Date(now.getTime() - mins * 60 * 1000);
  }

  if (relativeTime.includes('시간')) {
    const hours = parseInt(relativeTime);
    return new Date(now.getTime() - hours * 60 * 60 * 1000);
  }

  if (relativeTime.includes('일')) {
    const days = parseInt(relativeTime);
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }

  return now;  // 기본값: 현재
}
```

**문제점**:
- ❌ 상대 시간 파싱 불안정
- ❌ YouTube 서버 시간과 차이 가능성
- ❌ 경계선 근처에서 중복/누락 가능성

---

## 4. 최종 권장 전략: 하이브리드

### 4.1 1차: 비공식 API (NEWEST_FIRST)
```
매일 실행:
├─ NEWEST_FIRST로 신규 댓글 추출
├─ lastId 도달 시 멈춤
├─ 신규 댓글만 저장
└─ 상태 업데이트
```

### 4.2 2차: 공식 API (주 1회 검증)
```
주 1회 (일요일) 실행:
├─ 공식 API로 일부 샘플 조회
├─ 비공식과 비교 (검증)
├─ 누락 없는지 확인
└─ 공식이 더 많으면 보충
```

### 4.3 3차: 메타데이터 업데이트 (매일)
```
매일 메타데이터 갱신:
├─ 기존 댓글의 like_count 업데이트
├─ UPSERT로 처리
└─ LLM 호출 안함
```

---

## 5. 구현 예시

### 5.1 일일 수집 파이프라인

```ts
async function dailyIncrementalCollection() {
  const videos = await getActiveVideos();  // 분석 중인 영상들

  for (const video of videos) {
    try {
      // 1. 상태 로드
      const state = await loadCollectionState(video.id);

      // 2. 증분 수집 (비공식 API)
      const result = await collectIncrementalNEWEST_FIRST(
        video.id,
        state
      );

      console.log(
        `${video.id}: ${result.newComments} new comments collected`
      );

      // 3. 메타데이터 업데이트 (기존 댓글)
      await updateCommentMetadata(video.id);

      // 4. 신뢰도 점수 재계산
      await recalculateVideoCredibility(video.id);

      // 5. 상태 저장
      await saveCollectionState(result.state);
    } catch (error) {
      console.error(`Error collecting ${video.id}:`, error);
      await logCollectionError(video.id, error);
    }
  }
}

// Cron 작업으로 매일 자정에 실행
schedule.scheduleJob('0 0 * * *', async () => {
  await dailyIncrementalCollection();
});
```

### 5.2 데이터베이스 상태 테이블

```sql
CREATE TABLE comment_collection_state (
  video_id TEXT PRIMARY KEY,

  -- 증분 수집 추적
  last_collected_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
  last_collection_time TIMESTAMPTZ,
  total_comments_collected INTEGER DEFAULT 0,

  -- 메타데이터 갱신
  last_metadata_update TIMESTAMPTZ,

  -- 통계
  daily_new_comments_count INTEGER DEFAULT 0,
  collection_error_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 마지막 10개 ID 저장 예시
UPDATE comment_collection_state
SET last_collected_ids = ARRAY[
  'Ugz_abc123',
  'Ugz_abc122',
  'Ugz_abc121',
  ...
  'Ugz_abc114'
]
WHERE video_id = 'VIDEO_ID';
```

---

## 6. 성능 비교

### 6.1 비용 (30일 기준, 영상당 100개/일 증가)

```
공식 API (전체 수집):
├─ Day 1: 1000개 수집 = 10 units
├─ Day 2: 1100개 수집 = 11 units
├─ Day 30: 3900개 수집 = 39 units
└─ 합계: 약 450 units (일일 할당량의 4.5%)

비공식 API (증분 수집):
├─ Day 1: 100개 수집 = 할당량 X
├─ Day 2: 100개 수집 = 할당량 X
├─ Day 30: 100개 수집 = 할당량 X
└─ 합계: 0 units (할당량 X)

절약: 100%! 🎉
```

### 6.2 시간 (응답 시간)

```
공식 API (전체):
├─ 100개: ~500ms
├─ 1000개: ~3sec (pageToken 여러 번)
└─ 3900개: ~15sec

비공식 API (증분):
├─ 100개: ~1000ms (하지만 1번만)
├─ 메타데이터 업데이트: ~500ms
└─ 총: ~1.5sec

효율성: 비공식 훨씬 빠름 ✅
```

---

## 7. Edge Cases

### 7.1 댓글이 0개 증가한 경우

```ts
if (result.newComments === 0) {
  console.log('No new comments');
  // 상태 업데이트 안함
  // 메타데이터만 갱신
}
```

### 7.2 마지막 ID가 더 이상 없는 경우 (삭제됨)

```ts
// Day 1: lastIds = [C1, C2, ..., C10]
// Day 2: C1~C10이 모두 삭제됨

// 결과: NEWEST_FIRST로 가져온 모든 댓글이 신규
// → 정확히 처리됨 (C1~C10 미리 DB에 있으므로 UPSERT로 처리)
```

### 7.3 동시 수집 (Race condition)

```ts
// 해결책: 분산 잠금 (Redis)
const lock = await redis.lock(`video:${videoId}:collection`, {
  timeout: 60,  // 60초
});

try {
  await dailyIncrementalCollection(videoId);
} finally {
  await lock.release();
}
```

---

## 8. Spec에 반영할 사항

### 새로운 Requirement

```
FR18: 증분 댓글 수집
      - NEWEST_FIRST로 최신 댓글부터 추출
      - 마지막 수집 ID 기반 경계 감지
      - 신규 댓글만 저장

FR19: 메타데이터 일일 갱신
      - 기존 댓글의 like_count 업데이트
      - 별도 UPSERT 작업

FR20: 수집 상태 추적
      - 마지막 수집 시간 기록
      - 마지막 ID 저장
      - 오류 로깅
```

### 새로운 Assumption

```
- 비공식 API NEWEST_FIRST 정렬 신뢰도: ★★★★☆
- 공식 API 전체 수집: 할당량 한계로 불가능
- 마지막 ID는 최소 24시간 유효 (삭제 확률 낮음)
```

---

## 9. 결론: 어떻게 해야 하나?

| 상황 | 방법 | 근거 |
|------|------|------|
| 매일 100개 신규 댓글 수집 | **비공식 API NEWEST_FIRST** | 할당량 절약, 속도 빠름 |
| 주 1회 검증 필요 | 공식 API 샘플 | 신뢰도 높음 |
| 메타데이터 갱신 | 비공식 API + UPSERT | 비용 절감 |
| 증분 추적 | 마지막 10개 ID 저장 | 간단하고 정확함 |

**✅ 최종 답변: 비공식 API로 NEWEST_FIRST 정렬, 마지막 ID 추적**
