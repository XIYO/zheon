# YouTube 데이터 적재 구조 비교: 공식 API vs youtubei.js

**작성**: 2025-10-18
**기준**: YouTube API v3 공식 문서 vs youtubei.js v16.0.0

---

## 1. 댓글 데이터 구조 비교

### 1.1 공식 API (YouTube Data API v3)

#### 요청
```
GET https://www.googleapis.com/youtube/v3/comments?
  part=snippet
  textFormat=plainText
  videoId=VIDEO_ID
  maxResults=20
  pageToken=...
```

#### 응답 구조
```json
{
  "kind": "youtube#commentListResponse",
  "etag": "...",
  "nextPageToken": "...",
  "pageInfo": {
    "totalResults": 1000,
    "resultsPerPage": 20
  },
  "items": [
    {
      "kind": "youtube#comment",
      "etag": "...",
      "id": "COMMENT_ID",
      "snippet": {
        "videoId": "VIDEO_ID",
        "textDisplay": "댓글 내용",
        "textOriginal": "댓글 원본",
        "authorDisplayName": "사용자 이름",
        "authorProfileImageUrl": "https://...",
        "authorChannelUrl": "http://www.youtube.com/channel/CHANNEL_ID",
        "authorChannelId": { "value": "CHANNEL_ID" },
        "canReply": true,
        "totalReplyCount": 0,
        "isPublic": true,
        "publishedAt": "2025-10-18T12:34:56Z",
        "updatedAt": "2025-10-18T12:34:56Z",
        "likeCount": 5,
        "moderationStatus": "published",  // published | heldForReview | likelySpam | rejected
        "viewerRating": "none"  // none | like
      }
    }
  ]
}
```

#### 특징
- ✅ **구조화됨**: 명확한 JSON 스키마
- ✅ **정렬 명확**: `commentThreads.list`로 TOP_COMMENTS/NEWEST_FIRST 구분
- ✅ **메타데이터 풍부**: moderationStatus, isPublic, canReply 등
- ✅ **저자 정보 완전**: authorChannelId, profileImageUrl 등 모두 제공
- ❌ **할당량 제한**: 사용 비용이 높음 (snippet당 1 단위)
- ❌ **소유자만 댓글 조회**: commentThreads 일부 필드는 채널 소유자만 가능
- ❌ **댓글 수 제한**: 공식 API로 모든 댓글 조회 불가능

### 1.2 비공식 API (youtubei.js)

#### 요청
```ts
const comments = await innertube.getComments(
  'VIDEO_ID',
  'TOP_COMMENTS' // 'TOP_COMMENTS' | 'NEWEST_FIRST'
);

// 다음 배치 조회
const nextComments = await comments.getContinuation();

// 정렬 변경
const sortedComments = await comments.applySort('NEWEST_FIRST');
```

#### 응답 구조
```ts
class Comments {
  header?: CommentsHeader;
  contents: CommentThread[];  // 댓글 스레드 배열

  // 메서드
  applySort(sort: 'TOP_COMMENTS' | 'NEWEST_FIRST'): Promise<Comments>
  getContinuation(): Promise<Comments>
  createComment(text: string): Promise<ApiResponse>
}

class CommentThread {
  comment: CommentView | null;
  replies?: ObservedArray<CommentView>;
  comment_replies_data: CommentReplies | null;
  has_replies: boolean;
  is_moderated_elq_comment: boolean;

  // 메서드
  getReplies(): Promise<CommentThread>
  getContinuation(): Promise<CommentThread>
}

class CommentView {
  // 필드
  comment_id: string;
  content?: Text;  // 댓글 내용 (파싱됨)
  like_count?: string;  // "123K" 포맷
  reply_count?: string;
  published_time?: string;  // "3시간 전" 포맷
  author?: Author;  // 저자 정보
  author_is_channel_owner?: boolean;
  creator_thumbnail_url?: string;
  is_pinned: boolean;
  is_member: boolean;
  is_liked?: boolean;
  is_disliked?: boolean;
  is_hearted?: boolean;
  member_badge?: MemberBadge;
  like_button_a11y?: string;
  reply_count_a11y?: string;

  // 메서드
  like(): Promise<ApiResponse>
  dislike(): Promise<ApiResponse>
  reply(text: string): Promise<ApiResponse>
  translate(target_language: string): Promise<ApiResponse>
}

class Author {
  id: string;
  name: string;
  avatar?: string;
  channel_url?: string;
  badges?: Badge[];
}

class Text {
  toString(): string;
  toJSON(): Array<{ text: string; bold?: boolean; ... }>;
}
```

#### 특징
- ✅ **할당량 무제한**: 공식 API 할당량 절약
- ✅ **무인증 가능**: 개인 API 키 없음 (공개 데이터)
- ✅ **UI와 동일한 데이터**: 사용자 경험상 같은 정렬
- ✅ **액션 메서드 포함**: like(), reply(), translate() 직접 호출 가능
- ❌ **데이터 품질 불안정**: 정렬 기준 비공개, 시간에 따라 변함
- ❌ **메타데이터 부족**: 댓글 상태(heldForReview, rejected) 미제공
- ❌ **포맷 불일관**: like_count가 "123K" 문자열로 반환 (파싱 필요)
- ❌ **시간 포맷 상대적**: published_time이 "3시간 전" (절대 시간 불가)
- ❌ **정렬 알고리즘 숨김**: TOP_COMMENTS 기준이 불명확
- ❌ **TOS 위반 위험**: YouTube 약관상 비공식 API 사용 금지

---

## 2. 자막 데이터 구조 비교

### 2.1 공식 API (YouTube Data API v3 Captions)

#### 요청
```
GET https://www.googleapis.com/youtube/v3/captions?
  part=snippet
  videoId=VIDEO_ID
```

#### 응답 구조
```json
{
  "kind": "youtube#captionListResponse",
  "etag": "...",
  "items": [
    {
      "kind": "youtube#caption",
      "etag": "...",
      "id": "CAPTION_ID",
      "snippet": {
        "videoId": "VIDEO_ID",
        "lastUpdated": "2025-10-18T12:34:56Z",
        "trackKind": "standard",  // standard | asr | forced
        "language": "ko",  // BCP-47 코드
        "name": "한국어",
        "audioTrackType": "primary",  // primary | commentary | descriptive
        "isCC": false,  // 폐쇄 자막 여부
        "isLarge": false,  // 큰 글자 여부
        "isEasyReader": false,  // 쉬운 읽기
        "isDraft": false,  // 임시 저장 여부
        "isAutoSynced": true,  // 자동 동기화 여부
        "status": "serving",  // serving | syncing | failed
        "failureReason": null  // processingFailed | unknownFormat | unsupportedFormat
      }
    }
  ]
}
```

#### 다운로드
```
GET https://www.googleapis.com/youtube/v3/captions/{id}?
  tfmt=vtt  // 포맷: vtt, srt, json3, ttml
```

#### 특징
- ✅ **메타데이터 완전**: 자막 유형, 접근성 정보 모두 제공
- ✅ **상태 추적**: status로 처리 상태 알 수 있음
- ✅ **공식 지원**: YouTube에서 공식 지원
- ❌ **채널 소유자만**: 자신의 영상 자막만 다운로드 가능
- ❌ **공개 영상 자막 불가**: 타인 영상의 자막 다운로드 불가
- ❌ **할당량 비용**: 부분적으로 할당량 소비

### 2.2 비공식 API (youtubei.js)

#### 요청
```ts
const videoInfo = await innertube.getInfo('VIDEO_ID');
const captions = videoInfo.captions;  // Caption[]

// Caption 정보
{
  language: string;  // 'ko', 'en', ...
  label: string;  // '한국어', 'English', ...
  code: string;  // 언어 코드
  url?: string;  // 자막 URL
  isAutoGenerated?: boolean;
  isCC?: boolean;
  isDraft?: boolean;
}
```

#### 자막 콘텐츠 다운로드
```ts
const caption = videoInfo.captions[0];
const url = caption.url;  // 자막 XML/VTT 다운로드 가능
```

#### 특징
- ✅ **할당량 절약**: API 비용 없음
- ✅ **무인증 접근**: 공개 자막 모두 조회 가능
- ✅ **자동 생성 자막**: 자동 생성된 자막도 포함
- ❌ **메타데이터 부족**: status, failureReason 등 없음
- ❌ **데이터 불완전**: isCC, isDraft 미지원하는 경우 있음
- ❌ **형식 불일치**: 응답 구조 변경 가능성
- ❌ **신뢰도 낮음**: 비공식이므로 언제든 변경 가능

---

## 3. 핵심 차이점 요약

### 3.1 응답 시간 (Response Time)

| 항목 | 공식 API | 비공식 API |
|------|---------|----------|
| 댓글 조회 | ~500ms | ~1000-1500ms |
| 자막 조회 | ~300ms | ~800-1000ms |
| 정렬 변경 | 새 요청 필요 | applySort() 호출 |
| 원인 | 낮은 데이터 양 | YouTube UI 파싱 필요 |

### 3.2 데이터 신뢰도 (Data Reliability)

| 측면 | 공식 API | 비공식 API |
|------|---------|----------|
| 정렬 기준 명확 | ✅ 문서화됨 | ❌ 비공개 |
| 데이터 일관성 | ✅ 안정적 | ⚠️ 변함 |
| 필드 안정성 | ✅ 보장됨 | ⚠️ 예고 없이 변경 가능 |
| 에러 처리 | ✅ 명확 | ⚠️ 파싱 실패 가능 |
| 재현 가능성 | ✅ 높음 | ❌ 낮음 |

### 3.3 메타데이터 풍부도

| 필드 | 공식 API | 비공식 API |
|------|---------|----------|
| 댓글 상태 | ✅ moderationStatus | ❌ 없음 |
| 저자 채널 ID | ✅ authorChannelId | ❌ 불완전 |
| 공개 여부 | ✅ isPublic | ❌ 없음 |
| 좋아요 수 | ✅ 숫자 | ⚠️ "123K" 문자열 |
| 시간 정보 | ✅ ISO 8601 | ⚠️ "3시간 전" |
| 저자 프로필 이미지 | ✅ authorProfileImageUrl | ✅ creator_thumbnail_url |

### 3.4 기능성

| 기능 | 공식 API | 비공식 API |
|------|---------|----------|
| 댓글 조회 | ✅ | ✅ |
| 댓글 정렬 | ✅ 명확 | ⚠️ 불명확 |
| 댓글 작성 | ❌ | ✅ |
| 댓글 좋아요 | ❌ | ✅ |
| 댓글 번역 | ❌ | ✅ |
| 자막 다운로드 | ✅ 소유자만 | ✅ 모든 공개 자막 |

---

## 4. 신뢰도 분석에 미치는 영향

### 4.1 공식 API 사용 시 문제점

```
요청: TOP_COMMENTS 정렬
├─ YouTube 알고리즘: engagement + relevance + time
├─ 문제: 상위 댓글이 항상 신뢰도 높은 것은 아님
└─ 결과: 신뢰도 점수가 편향될 수 있음
```

**영향**:
- 좋아요 많은 댓글 = 높은 신뢰도? ❌ (스팸 가능성)
- TOP_COMMENTS 표본만 분석 → 전체 감정 왜곡
- 정렬 기준이 변함 → 재현 불가능

### 4.2 비공식 API 사용 시 문제점

```
요청: TOP_COMMENTS 정렬
├─ YouTube UI 파싱
├─ 문제 1: 파싱 로직이 변하면 데이터도 변함
├─ 문제 2: like_count가 "123K"로 반환 (정확한 계산 불가)
├─ 문제 3: 정렬 알고리즘 비공개 (신뢰도 근거 불명확)
└─ 결과: 신뢰도 점수 재현 불가능
```

**영향**:
- 같은 요청도 시간에 따라 다른 결과
- 숫자 문자열 파싱으로 인한 정확도 손실
- 버전 업그레이드 시 데이터 구조 변경 위험

---

## 5. 권장 데이터 적재 전략

### 5.1 하이브리드 접근 (권장)

```
댓글 분석 흐름:
├─ 1차: 공식 API로 정렬된 댓글 샘플 수집 (신뢰도 높은 기준)
├─ 2차: 비공식 API로 추가 댓글 보충 (커버리지 확대)
├─ 3차: 데이터 정규화 (문자열 포맷 → 숫자 변환)
└─ 4차: 신뢰도 점수 계산 (공식 데이터 우선 사용)
```

**장점**:
- 신뢰도 높은 기준점 확보 (공식 API)
- 광범위한 데이터 수집 (비공식 API)
- 할당량 효율성

### 5.2 데이터 정규화 필요

```ts
// 비공식 API 데이터 정규화
interface NormalizedComment {
  id: string;
  text: string;
  likeCount: number;  // "123K" → 123000
  replyCount: number;
  publishedAtISO: string;  // "3시간 전" → ISO 8601
  authorChannelId: string | null;
  dataSource: 'official' | 'unofficial';
  confidence: 0.95 | 0.75;  // 데이터 신뢰도
}
```

---

## 6. Spec 업데이트 필요 사항

이 분석을 반영하여 spec.md에 다음 내용 추가 필요:

1. **댓글 데이터 소스 명시**
   - 공식 API 우선
   - 공식 API 로 미수집 분만 비공식 API 보충

2. **데이터 신뢰도 등급**
   - Level 1: 공식 API 데이터 (신뢰도 95%)
   - Level 2: 비공식 API 데이터 (신뢰도 75%)

3. **정규화 프로세스 명시**
   - like_count 문자열 파싱
   - published_time 절대 시간 변환
   - 정규화 실패 시 처리 방법

4. **신뢰도 점수 계산 근거**
   - 공식 API 정렬 기준 우선
   - 비공식 API 사용 시 신뢰도 할인

5. **재현성 문제 명시**
   - 신뢰도 점수는 수집 시점에 따라 변할 수 있음
   - 캐싱 기간 설정 필요
   - "참고용" 명시
