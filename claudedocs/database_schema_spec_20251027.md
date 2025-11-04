# Zheon Database Schema Specification (2025-10-27)

## 0. 개요

Zheon은 YouTube 콘텐츠 분석 및 관리 플랫폼입니다. 본 문서는 데이터베이스 스키마의 전체 구조와 설계 원칙을 정의합니다.

### 핵심 도메인
- YouTube 채널 및 비디오 메타데이터 관리
- 구독 채널 동기화 및 추적
- 콘텐츠 요약 및 인사이트 생성
- 비디오 댓글 수집 및 분석
- 비디오 자막 수집 및 검색

### 기술 스택
- Database: PostgreSQL (Supabase)
- Extensions: wrappers (Supabase 연동)
- Sync: PowerSync (클라이언트-서버 동기화)

---

## 1. 입력 주체 표기 규약

각 테이블/컬럼에 값을 누가 채우는지 다음 표기로 명시합니다:

- **EXTERNAL(app)**: 애플리케이션/서비스 계층이 값 지정
- **EXTERNAL(youtube)**: YouTube API에서 가져온 원본 데이터
- **TRIGGER(<name>)**: 데이터베이스 트리거가 자동 계산/기입
- **AUTO**: BEFORE INSERT 시 자동 생성 (UUID, 현재 시각 등)
- **CACHE**: 파생 캐시 컬럼 (EXTERNAL이 원본을 넣으면 TRIGGER가 CACHE 동기화)

---

## 2. 테이블별 컬럼 정의

### 2.1 `channels`

YouTube 채널의 메타데이터를 저장합니다. YouTube API로부터 동기화되며, 구독 채널 및 분석 대상 채널을 포함합니다.

| Column | Type | Nullable | Default | Source | Description |
|--------|------|----------|---------|--------|-------------|
| `channel_id` | text | NOT NULL | - | EXTERNAL(youtube) | YouTube 채널 ID (PK) |
| `title` | text | NOT NULL | - | EXTERNAL(youtube) | 채널 이름 |
| `custom_url` | text | NULL | - | EXTERNAL(youtube) | 채널 커스텀 URL |
| `thumbnail_url` | text | NULL | - | EXTERNAL(youtube) | 채널 썸네일 URL |
| `subscriber_count` | text | NULL | - | EXTERNAL(youtube) | 구독자 수 (문자열) |
| `video_count` | integer | NULL | 0 | EXTERNAL(youtube) | 업로드된 비디오 수 |
| `description` | text | NULL | - | EXTERNAL(youtube) | 채널 설명 |
| `channel_data` | jsonb | NULL | '{}' | EXTERNAL(youtube) | YouTube API 원본 응답 전체 |
| `updated` | timestamptz | NULL | now() | AUTO | 레코드 수정 시각 |
| `video_sync_status` | text | NULL | - | EXTERNAL(app) | 비디오 동기화 상태 (idle/processing/completed/failed) |
| `video_synced_at` | timestamptz | NULL | - | EXTERNAL(app) | 마지막 비디오 동기화 시각 |
| `published_at` | timestamptz | NULL | - | EXTERNAL(youtube) | 채널 생성 일시 |
| `thumbnail_width` | integer | NULL | - | EXTERNAL(youtube) | 썸네일 너비 |
| `thumbnail_height` | integer | NULL | - | EXTERNAL(youtube) | 썸네일 높이 |
| `view_count` | bigint | NULL | - | EXTERNAL(youtube) | 총 조회수 |
| `uploads_playlist_id` | text | NULL | - | EXTERNAL(youtube) | 업로드 플레이리스트 ID |
| `updated_at` | timestamptz | NULL | now() | AUTO | 레코드 수정 시각 |

**제약조건:**
- PRIMARY KEY: `channel_id`
- CHECK: `video_sync_status IN ('idle', 'processing', 'completed', 'failed')`

**인덱스:**
- `idx_channels_handle`: `(custom_url)`
- `idx_channels_title_search`: GIN 전문 검색 인덱스 `to_tsvector('english', title)`
- `idx_channels_updated_at`: `(updated_at DESC)`
- `idx_channels_uploads_playlist`: `(uploads_playlist_id)`

**RLS 정책:**
- `Anyone can view channels`: SELECT 공개
- `Authenticated users can upsert channels`: INSERT 인증 필요
- `Authenticated users can update channels`: UPDATE 인증 필요
- `Service role can manage channels`: 서비스 롤 전체 권한

---

### 2.2 `videos`

비디오 메타데이터를 저장합니다. 채널 페이지 비디오 리스트 및 상세 정보 제공에 사용됩니다.

| Column | Type | Nullable | Default | Source | Description |
|--------|------|----------|---------|--------|-------------|
| `video_id` | text | NOT NULL | - | EXTERNAL(youtube) | YouTube 비디오 ID (PK) |
| `channel_id` | text | NOT NULL | - | EXTERNAL(youtube) | 소속 채널 ID (FK → channels) |
| `title` | text | NOT NULL | - | EXTERNAL(youtube) | 비디오 제목 |
| `thumbnail_url` | text | NULL | - | EXTERNAL(youtube) | 썸네일 URL |
| `published_at` | text | NULL | - | EXTERNAL(youtube) | 공개 일시 (ISO 8601 문자열) |
| `duration` | text | NULL | - | EXTERNAL(youtube) | 재생 시간 (ISO 8601 Duration) |
| `view_count` | text | NULL | - | EXTERNAL(youtube) | 조회수 (문자열) |
| `video_data` | jsonb | NULL | '{}' | EXTERNAL(youtube) | YouTube API 원본 응답 |
| `updated` | timestamptz | NULL | now() | AUTO | 레코드 수정 시각 |
| `sort_order` | integer | NULL | - | EXTERNAL(youtube) | 정렬 순서 (플레이리스트 내) |
| `publish_date` | text | NULL | - | EXTERNAL(youtube) | 공개 날짜 (ISO Date) |
| `upload_date` | text | NULL | - | EXTERNAL(youtube) | 업로드 날짜 |
| `length_seconds` | integer | NULL | - | EXTERNAL(youtube) | 재생 시간 (초) |
| `category` | text | NULL | - | EXTERNAL(youtube) | 비디오 카테고리 |
| `is_family_safe` | boolean | NULL | - | EXTERNAL(youtube) | 가족 친화 여부 |
| `is_unlisted` | boolean | NULL | - | EXTERNAL(youtube) | 미등록 여부 |
| `available_countries` | text[] | NULL | - | EXTERNAL(youtube) | 시청 가능 국가 목록 |
| `basic_info_synced_at` | timestamptz | NULL | - | EXTERNAL(app) | 기본 정보 동기화 시각 |
| `description` | text | NULL | - | EXTERNAL(youtube) | 비디오 설명 |
| `channel_title` | text | NULL | - | EXTERNAL(youtube) | 채널 이름 (역정규화) |
| `thumbnail_width` | integer | NULL | - | EXTERNAL(youtube) | 썸네일 너비 |
| `thumbnail_height` | integer | NULL | - | EXTERNAL(youtube) | 썸네일 높이 |
| `playlist_id` | text | NULL | - | EXTERNAL(youtube) | 플레이리스트 ID |
| `position` | integer | NULL | - | EXTERNAL(youtube) | 플레이리스트 내 위치 |
| `video_insight` | jsonb | NULL | - | EXTERNAL(app) | AI 분석 인사이트 |
| `last_analyzed_at` | timestamptz | NULL | - | EXTERNAL(app) | 마지막 분석 시각 |
| `updated_at` | timestamptz | NULL | now() | AUTO | 레코드 수정 시각 |

**제약조건:**
- PRIMARY KEY: `video_id`
- FOREIGN KEY: `channel_id` REFERENCES `channels(channel_id)` ON DELETE CASCADE
- UNIQUE: `(channel_id, video_id)`

**인덱스:**
- `idx_videos_channel_published`: `(channel_id, published_at DESC)`
- `idx_videos_needs_sync`: `(channel_id, basic_info_synced_at)` WHERE `basic_info_synced_at IS NULL`
- `idx_videos_published`: `(published_at DESC)`
- `idx_videos_sort_order`: `(channel_id, sort_order DESC)`
- `idx_videos_title_search`: GIN 전문 검색 `to_tsvector('english', title)`
- `idx_videos_video_id`: `(video_id)`
- `idx_videos_channel`: `(channel_id)`

**RLS 정책:**
- `Anyone can view videos`: SELECT 공개
- `Service role can manage videos`: 서비스 롤 전체 권한

---

### 2.3 `profiles`

사용자 프로필 정보와 YouTube 구독 동기화 상태를 관리합니다.

| Column | Type | Nullable | Default | Source | Description |
|--------|------|----------|---------|--------|-------------|
| `id` | uuid | NOT NULL | - | EXTERNAL(auth) | 사용자 ID (PK, auth.users FK) |
| `display_name` | text | NULL | - | EXTERNAL(app) | 표시 이름 |
| `avatar_url` | text | NULL | - | EXTERNAL(app) | 아바타 URL |
| `bio` | text | NULL | - | EXTERNAL(app) | 자기소개 |
| `youtube_subscription_sync_status` | text | NULL | - | EXTERNAL(app) | 구독 동기화 상태 |
| `youtube_subscription_synced_at` | timestamptz | NULL | - | EXTERNAL(app) | 마지막 구독 동기화 시각 |
| `updated_at` | timestamptz | NULL | now() | AUTO | 레코드 수정 시각 |

**제약조건:**
- PRIMARY KEY: `id`
- FOREIGN KEY: `id` REFERENCES `auth.users(id)` ON DELETE CASCADE
- CHECK: `youtube_subscription_sync_status IN ('idle', 'processing', 'completed', 'failed')`

**RLS 정책:**
- `Profiles are viewable by everyone`: SELECT 공개
- `Users can insert their own profile`: INSERT 본인만
- `Users can update their own profile`: UPDATE 본인만

---

### 2.4 `summaries`

YouTube 비디오의 AI 생성 요약 및 인사이트를 저장합니다.

| Column | Type | Nullable | Default | Source | Description |
|--------|------|----------|---------|--------|-------------|
| `id` | uuid | NOT NULL | gen_random_uuid() | AUTO | 요약 ID (PK) |
| `url` | text | NOT NULL | - | EXTERNAL(app) | YouTube 비디오 URL (UNIQUE) |
| `title` | text | NULL | - | EXTERNAL(youtube) | 비디오 제목 |
| `channel_id` | text | NULL | - | EXTERNAL(youtube) | 채널 ID |
| `channel_name` | text | NULL | - | EXTERNAL(youtube) | 채널 이름 |
| `duration` | integer | NULL | - | EXTERNAL(youtube) | 재생 시간 (초) |
| `transcript` | text | NULL | - | EXTERNAL(app) | 자막 텍스트 |
| `summary` | text | NULL | - | EXTERNAL(app) | AI 생성 요약 |
| `insights` | text | NULL | - | EXTERNAL(app) | AI 생성 인사이트 |
| `language` | text | NULL | 'ko' | EXTERNAL(app) | 언어 코드 |
| `processing_status` | text | NULL | 'pending' | EXTERNAL(app) | 처리 상태 |
| `summary_audio_url` | text | NULL | - | EXTERNAL(app) | 요약 오디오 URL |
| `summary_audio_status` | text | NULL | - | EXTERNAL(app) | 요약 오디오 상태 |
| `insights_audio_url` | text | NULL | - | EXTERNAL(app) | 인사이트 오디오 URL |
| `insights_audio_status` | text | NULL | - | EXTERNAL(app) | 인사이트 오디오 상태 |
| `thumbnail_url` | text | NULL | - | EXTERNAL(youtube) | 썸네일 URL |
| `updated_at` | timestamptz | NULL | now() | AUTO | 레코드 수정 시각 |

**제약조건:**
- PRIMARY KEY: `id`
- UNIQUE: `url`
- CHECK: `processing_status IN ('pending', 'processing', 'completed', 'failed')`
- CHECK: `summary_audio_status IN ('processing', 'completed', 'failed')`
- CHECK: `insights_audio_status IN ('processing', 'completed', 'failed')`

**인덱스:**
- `idx_summaries_channel_id`: `(channel_id)` WHERE `channel_id IS NOT NULL`
- `idx_summaries_processing_status`: `(processing_status)`
- `idx_summaries_url`: `(url)`
- `idx_summaries_audio_status`: `(summary_audio_status)` WHERE `summary_audio_status IS NOT NULL`
- `idx_summaries_insights_audio_status`: `(insights_audio_status)` WHERE `insights_audio_status IS NOT NULL`

**RLS 정책:**
- `Allow public read`: SELECT 공개 (authenticated, anon)
- `Allow public insert`: INSERT 공개 (authenticated, anon)
- `Allow service role update`: UPDATE 서비스 롤만
- `Allow service role delete`: DELETE 서비스 롤만

---

### 2.5 `subscriptions`

사용자의 구독 채널 목록을 저장합니다.

| Column | Type | Nullable | Default | Source | Description |
|--------|------|----------|---------|--------|-------------|
| `id` | uuid | NOT NULL | gen_random_uuid() | AUTO | 구독 ID (PK) |
| `user_id` | uuid | NOT NULL | - | EXTERNAL(app) | 사용자 ID |
| `channel_id` | text | NOT NULL | - | EXTERNAL(youtube) | 채널 ID (FK → channels) |
| `subscribed_at` | timestamptz | NULL | - | EXTERNAL(youtube) | 구독 일시 |
| `title` | text | NULL | - | EXTERNAL(youtube) | 채널 이름 (역정규화) |
| `description` | text | NULL | - | EXTERNAL(youtube) | 채널 설명 |
| `published_at` | timestamptz | NULL | - | EXTERNAL(youtube) | 채널 생성 일시 |
| `thumbnail_url` | text | NULL | - | EXTERNAL(youtube) | 썸네일 URL |
| `resource_kind` | text | NULL | - | EXTERNAL(youtube) | 리소스 종류 |
| `subscription_data` | jsonb | NULL | - | EXTERNAL(youtube) | YouTube API 원본 응답 |
| `updated_at` | timestamptz | NULL | now() | AUTO | 레코드 수정 시각 |

**제약조건:**
- PRIMARY KEY: `id`
- FOREIGN KEY: `channel_id` REFERENCES `channels(channel_id)` ON DELETE CASCADE
- UNIQUE: `(user_id, channel_id)`

**인덱스:**
- `idx_subscriptions_channel`: `(channel_id)`
- `idx_subscriptions_user`: `(user_id)`

**RLS 정책:**
- `Users can view own subscriptions`: SELECT 본인만
- `Users can manage own subscriptions`: ALL 본인만
- `Service role can manage all subscriptions`: 서비스 롤 전체 권한

---

### 2.6 `comments`

YouTube 비디오의 댓글을 증분 수집하여 저장합니다. youtubei.js의 CommentView 객체를 통째로 jsonb에 저장하며, comment_id 기반 중복 체크로 증분 수집을 지원합니다.

| Column | Type | Nullable | Default | Source | Description |
|--------|------|----------|---------|--------|-------------|
| `id` | uuid | NOT NULL | gen_random_uuid() | AUTO | 댓글 레코드 ID (PK) |
| `comment_id` | text | NOT NULL | - | EXTERNAL(youtube) | YouTube 댓글 ID (UNIQUE, 증분 수집 키) |
| `video_id` | text | NOT NULL | - | EXTERNAL(youtube) | 소속 비디오 ID (도메인 FK → videos) |
| `data` | jsonb | NOT NULL | - | EXTERNAL(youtube) | 전체 CommentView 객체 (youtubei.js 원본) |
| `updated_at` | timestamptz | NULL | now() | AUTO | 레코드 수정 시각 |

**제약조건:**
- PRIMARY KEY: `id`
- UNIQUE: `comment_id`

**인덱스:**
- `idx_comments_video_id`: `(video_id)`
- `idx_comments_comment_id`: `(comment_id)`

**RLS 정책:**
- `Anyone can view comments`: SELECT 공개
- `Service role can manage comments`: 서비스 롤 전체 권한

**특징:**
- 비디오당 최대 100개 증분 수집
- 최신순 수집 (NEWEST_FIRST)
- 최근 3개 comment_id 기반 중복 체크
- youtubei.js CommentView 타입 그대로 보존
- AI 분석용 원본 데이터 제공

**증분 수집 알고리즘:**
1. DB에서 최근 댓글 ID 3개 조회
2. YouTube에서 최신순 댓글 배치 수집
3. 각 배치마다 중복 체크 (최근 3개 ID와 비교)
4. 중복 발견 시 즉시 중단
5. 중복 없으면 저장 후 다음 배치 (최대 100개)

**데이터 구조 예시:**
```json
{
  "comment_id": "UgwXYZ123",
  "content": {
    "text": "댓글 내용"
  },
  "author": {
    "name": "작성자명",
    "id": "channel_id"
  },
  "published_time": "2 days ago",
  "like_count": "123",
  "reply_count": "5",
  "is_pinned": false
}
```

---

### 2.7 `transcripts`

비디오 자막 원본 데이터를 저장합니다. youtubei.js의 TranscriptSegment 객체를 통째로 jsonb에 저장하여 1회 소비 패턴에 최적화되어 있습니다.

| Column | Type | Nullable | Default | Source | Description |
|--------|------|----------|---------|--------|-------------|
| `id` | uuid | NOT NULL | gen_random_uuid() | AUTO | 자막 레코드 ID (PK) |
| `video_id` | text | NOT NULL | - | EXTERNAL(youtube) | 소속 비디오 ID (도메인 FK → videos, UNIQUE) |
| `data` | jsonb | NOT NULL | - | EXTERNAL(youtube) | 전체 transcript 객체 (youtubei.js 원본) |
| `updated_at` | timestamptz | NULL | now() | AUTO | 레코드 수정 시각 |

**제약조건:**
- PRIMARY KEY: `id`
- UNIQUE: `video_id`

**인덱스:**
- `idx_transcripts_video_id`: `(video_id)`

**RLS 정책:**
- `Anyone can view transcripts`: SELECT 공개
- `Service role can manage transcripts`: 서비스 롤 전체 권한

**특징:**
- 비디오당 1 row
- youtubei.js TranscriptSegment 타입 그대로 보존
- 1회 조회 후 애플리케이션에서 파싱하여 사용
- 정규화 없이 원본 데이터 통으로 저장
- LLM 프롬프트 생성 등 1회성 소비에 최적화

**데이터 구조 예시:**
```json
{
  "content": [
    {
      "start_ms": "0",
      "end_ms": "2000",
      "snippet": {
        "text": "자막 텍스트"
      },
      "start_time_text": {
        "text": "0:00"
      },
      "target_id": "xyz123"
    }
  ]
}
```


## 3. 외래키 제약조건 금지 정책

**중요: PowerSync 동기화를 위해 DB 레벨 외래키 제약조건을 생성하지 마세요.**

### 이유

PowerSync는 클라이언트-서버 간 데이터 동기화 시 레코드 도착 순서를 보장하지 않습니다. DB 레벨 외래키 제약조건 설정 시:

1. **동기화 순서 문제**: 자식 레코드가 부모 레코드보다 먼저 도착 가능
2. **외래키 위반 에러**: PowerSync 동기화 중 FK 제약 위반으로 실패
3. **데이터 불일치**: 매번 충돌 에러로 동기화 중단

### 대안: 도메인 레벨 관계 관리

외래키 관계는 **도메인 레벨에서만** 관리:

#### 관계 명시 (문서화)

- `videos.channel_id` → `channels.channel_id` (도메인 FK)
- `subscriptions.channel_id` → `channels.channel_id`
- `subscriptions.user_id` → `profiles.id`
- `comments.video_id` → `videos.video_id` (도메인 FK)
- `transcripts.video_id` → `videos.video_id` (도메인 FK)
- `profiles.id` → `auth.users.id` (Supabase Auth)

#### 애플리케이션 레벨 검증

```typescript
async function createVideo(video: NewVideo) {
  const channel = await db.getOptional(
    'SELECT channel_id FROM channels WHERE channel_id = ?',
    [video.channel_id]
  );

  if (!channel) {
    throw new Error(`Channel ${video.channel_id} not found`);
  }

  await db.execute('INSERT INTO videos ...', [...]);
}
```

#### 소프트 삭제 구현

현재 스키마에는 `excluded` 컬럼이 없지만, 향후 소프트 삭제 구현 시:

```typescript
// 채널 소프트 삭제 (미래 구현)
async function softDeleteChannel(channelId: string) {
  // 1. 하위 비디오 처리 (옵션 A: 함께 삭제, 옵션 B: 보존)
  await db.execute(
    'UPDATE videos SET excluded = 1 WHERE channel_id = ?',
    [channelId]
  );

  // 2. 채널 숨김 처리
  await db.execute(
    'UPDATE channels SET excluded = 1 WHERE channel_id = ?',
    [channelId]
  );
}

// 복구
async function restoreChannel(channelId: string) {
  await db.execute(
    'UPDATE channels SET excluded = 0 WHERE channel_id = ?',
    [channelId]
  );
}
```

#### 쿼리 시 관계 검증

```typescript
// 채널의 비디오 조회
const videos = await db.query(`
  SELECT v.*
  FROM videos v
  INNER JOIN channels c ON v.channel_id = c.channel_id
  WHERE c.channel_id = ?
`, [channelId]);

// 사용자의 구독 채널 조회
const subscriptions = await db.query(`
  SELECT s.*, c.*
  FROM subscriptions s
  INNER JOIN channels c ON s.channel_id = c.channel_id
  WHERE s.user_id = ?
`, [userId]);
```

**요약: DB 레벨 FK는 절대 생성하지 말고, 애플리케이션 레이어에서 관계를 관리하세요.**

---

## 4. RLS (Row Level Security) 정책

### 4.1 channels

**테이블 설정:**
```sql
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
```

**정책:**
```sql
-- 모든 사용자 조회 가능
CREATE POLICY "Anyone can view channels"
ON channels FOR SELECT
TO authenticated, anon
USING (true);

-- 인증된 사용자만 채널 추가/수정 가능
CREATE POLICY "Authenticated users can upsert channels"
ON channels FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update channels"
ON channels FOR UPDATE
TO authenticated
USING (true);

-- 서비스 롤 전체 권한
CREATE POLICY "Service role can manage channels"
ON channels FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

### 4.2 videos

**테이블 설정:**
```sql
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
```

**정책:**
```sql
-- 모든 사용자 조회 가능
CREATE POLICY "Anyone can view videos"
ON videos FOR SELECT
TO authenticated, anon
USING (true);

-- 서비스 롤만 비디오 관리
CREATE POLICY "Service role can manage videos"
ON videos FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

### 4.3 profiles

**테이블 설정:**
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

**정책:**
```sql
-- 모든 사용자 프로필 조회 가능
CREATE POLICY "Profiles are viewable by everyone"
ON profiles FOR SELECT
TO authenticated, anon
USING (true);

-- 본인 프로필만 생성
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 본인 프로필만 수정
CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);
```

### 4.4 summaries

**테이블 설정:**
```sql
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
```

**정책 (완전 공개 서비스):**
```sql
-- 모든 사용자 조회 가능 (익명 포함)
CREATE POLICY "Allow public read"
ON summaries FOR SELECT
TO authenticated, anon
USING (true);

-- 모든 사용자 요약 생성 가능 (익명 포함)
CREATE POLICY "Allow public insert"
ON summaries FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- 서비스 롤만 수정/삭제 가능
CREATE POLICY "Allow service role update"
ON summaries FOR UPDATE
TO service_role
USING (true);

CREATE POLICY "Allow service role delete"
ON summaries FOR DELETE
TO service_role
USING (true);
```

**특징:**
- 완전 무료 공개 서비스
- 익명 사용자도 요약 생성 가능
- 모든 사용자가 다른 사람의 요약도 조회 가능
- 수정/삭제는 서비스 롤(백엔드)만 가능

### 4.5 subscriptions

**테이블 설정:**
```sql
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
```

**정책:**
```sql
-- 본인 구독 목록만 조회
CREATE POLICY "Users can view own subscriptions"
ON subscriptions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 본인 구독만 관리
CREATE POLICY "Users can manage own subscriptions"
ON subscriptions FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 서비스 롤 전체 권한
CREATE POLICY "Service role can manage all subscriptions"
ON subscriptions FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

### 4.6 comments

**테이블 설정:**
```sql
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
```

**정책:**
```sql
-- 모든 사용자 댓글 조회 가능
CREATE POLICY "Anyone can view comments"
ON comments FOR SELECT
TO authenticated, anon
USING (true);

-- 서비스 롤만 댓글 관리
CREATE POLICY "Service role can manage comments"
ON comments FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

### 4.7 transcripts

**테이블 설정:**
```sql
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
```

**정책:**
```sql
-- 모든 사용자 자막 조회 가능
CREATE POLICY "Anyone can view transcripts"
ON transcripts FOR SELECT
TO authenticated, anon
USING (true);

-- 서비스 롤만 자막 관리
CREATE POLICY "Service role can manage transcripts"
ON transcripts FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

---

## 5. 인덱스 전략

### 5.1 기본 조회 최적화

**채널/비디오 리스트:**
- `idx_channels_updated_at`: 최근 수정 채널
- `idx_videos_published`: 최신 비디오
- `idx_videos_channel_published`: 채널별 최신 비디오

**요약 조회:**
- `idx_summaries_url`: URL 기반 중복 확인

**댓글 조회:**
- `idx_comments_video_id`: 비디오별 댓글 목록
- `idx_comments_like_count`: 좋아요 순 정렬

### 5.2 검색 최적화

**전문 검색 (GIN Index):**
```sql
CREATE INDEX idx_channels_title_search
ON channels USING gin (to_tsvector('english', title));

CREATE INDEX idx_videos_title_search
ON videos USING gin (to_tsvector('english', title));

CREATE INDEX idx_comments_text_search
ON comments USING gin (to_tsvector('english', text));
```

### 5.3 관계 조회 최적화

**외래키 인덱스:**
- `idx_subscriptions_channel`: 채널별 구독자 조회
- `idx_subscriptions_user`: 사용자별 구독 목록

### 5.4 부분 인덱스 (Partial Index)

```sql
-- 동기화 필요 비디오만 인덱싱
CREATE INDEX idx_videos_needs_sync
ON videos (channel_id, basic_info_synced_at)
WHERE basic_info_synced_at IS NULL;

-- NULL 아닌 값만 인덱싱
CREATE INDEX idx_summaries_audio_status
ON summaries (summary_audio_status)
WHERE summary_audio_status IS NOT NULL;
```

### 5.5 복합 인덱스

**채널별 최신 비디오:**
```sql
CREATE INDEX idx_videos_channel_published
ON videos (channel_id, published_at DESC);
```

**비디오 정렬 순서:**
```sql
CREATE INDEX idx_videos_sort_order
ON videos (channel_id, sort_order DESC);
```

### 5.6 자막 조회 최적화

**비디오 ID 조회:**
```sql
CREATE INDEX idx_transcripts_video_id
ON transcripts (video_id);
```

**특징:**
- video_id로 빠른 자막 조회
- jsonb data 컬럼은 애플리케이션에서 파싱
- 1회 조회 후 메모리에서 처리

---

## 6. 데이터 동기화 플로우

### 6.1 YouTube API → Database

```typescript
// 채널 정보 동기화
async function syncChannel(channelId: string) {
  const youtubeData = await fetchYouTubeChannelData(channelId);

  await db.execute(`
    INSERT INTO channels (
      channel_id, title, custom_url, thumbnail_url,
      subscriber_count, video_count, description,
      channel_data, published_at, view_count, uploads_playlist_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (channel_id) DO UPDATE SET
      title = EXCLUDED.title,
      subscriber_count = EXCLUDED.subscriber_count,
      updated_at = CURRENT_TIMESTAMP
  `, [
    youtubeData.id,
    youtubeData.snippet.title,
    youtubeData.snippet.customUrl,
    youtubeData.snippet.thumbnails.default.url,
    youtubeData.statistics.subscriberCount,
    youtubeData.statistics.videoCount,
    youtubeData.snippet.description,
    JSON.stringify(youtubeData),
    youtubeData.snippet.publishedAt,
    youtubeData.statistics.viewCount,
    youtubeData.contentDetails.relatedPlaylists.uploads
  ]);
}

// 비디오 목록 동기화
async function syncChannelVideos(channelId: string) {
  await db.execute(
    'UPDATE channels SET video_sync_status = ? WHERE channel_id = ?',
    ['processing', channelId]
  );

  try {
    const videos = await fetchYouTubePlaylistItems(channelId);

    for (const video of videos) {
      await db.execute(`
        INSERT INTO videos (
          video_id, channel_id, title, thumbnail_url,
          published_at, duration, view_count, video_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (video_id) DO UPDATE SET
          title = EXCLUDED.title,
          view_count = EXCLUDED.view_count,
          updated_at = CURRENT_TIMESTAMP
      `, [
        video.contentDetails.videoId,
        channelId,
        video.snippet.title,
        video.snippet.thumbnails.default.url,
        video.snippet.publishedAt,
        video.contentDetails.duration,
        video.statistics?.viewCount || '0',
        JSON.stringify(video)
      ]);
    }

    await db.execute(`
      UPDATE channels
      SET video_sync_status = ?, video_synced_at = CURRENT_TIMESTAMP
      WHERE channel_id = ?
    `, ['completed', channelId]);

  } catch (error) {
    await db.execute(
      'UPDATE channels SET video_sync_status = ? WHERE channel_id = ?',
      ['failed', channelId]
    );
    throw error;
  }
}
```

### 6.2 사용자 구독 동기화

```typescript
async function syncUserSubscriptions(userId: string, accessToken: string) {
  await db.execute(`
    UPDATE profiles
    SET youtube_subscription_sync_status = ?
    WHERE id = ?
  `, ['processing', userId]);

  try {
    const subscriptions = await fetchYouTubeSubscriptions(accessToken);

    // 1. 채널 정보 먼저 동기화 (FK 관계 보장)
    for (const sub of subscriptions) {
      await syncChannel(sub.snippet.resourceId.channelId);
    }

    // 2. 구독 레코드 생성/갱신
    for (const sub of subscriptions) {
      await db.execute(`
        INSERT INTO subscriptions (
          user_id, channel_id, subscribed_at,
          title, description, published_at,
          thumbnail_url, resource_kind, subscription_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (user_id, channel_id) DO UPDATE SET
          title = EXCLUDED.title,
          updated_at = CURRENT_TIMESTAMP
      `, [
        userId,
        sub.snippet.resourceId.channelId,
        sub.snippet.publishedAt,
        sub.snippet.title,
        sub.snippet.description,
        sub.snippet.publishedAt,
        sub.snippet.thumbnails.default.url,
        sub.snippet.resourceId.kind,
        JSON.stringify(sub)
      ]);
    }

    await db.execute(`
      UPDATE profiles
      SET youtube_subscription_sync_status = ?,
          youtube_subscription_synced_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, ['completed', userId]);

  } catch (error) {
    await db.execute(
      'UPDATE profiles SET youtube_subscription_sync_status = ? WHERE id = ?',
      ['failed', userId]
    );
    throw error;
  }
}
```

### 6.3 비디오 댓글 수집

```typescript
async function syncVideoComments(videoId: string) {
  const { adminSupabase } = locals;

  try {
    // youtube.js로 댓글 가져오기
    const comments = await fetchYouTubeComments(videoId);

    for (const comment of comments) {
      await adminSupabase
        .from('comments')
        .insert({
          id: comment.id,
          video_id: videoId,
          author: comment.author, // jsonb로 저장
          text: comment.text,
          like_count: comment.likeCount,
          is_pinned: comment.isPinned,
          reply_count: comment.replyCount
        })
        .onConflict('id')
        .merge();
    }
  } catch (error) {
    console.error(`댓글 수집 실패: ${videoId}`, error);
    throw error;
  }
}
```

### 6.4 비디오 자막 수집

```typescript
async function syncVideoTranscript(videoId: string) {
  const { adminSupabase } = locals;

  try {
    // youtubei.js로 자막 가져오기
    const yt = await getYouTubeClient();
    const video = await yt.getBasicInfo(videoId);
    const transcriptData = await video.getTranscript();

    if (!transcriptData || !transcriptData.content) {
      console.log(`자막 없음: ${videoId}`);
      return;
    }

    // 전체 객체를 통으로 저장
    const { error: insertError } = await adminSupabase
      .from('transcripts')
      .insert({
        video_id: videoId,
        data: transcriptData
      });

    if (insertError) throw insertError;

    console.log(`자막 저장 완료: ${videoId}, ${transcriptData.content.length} 세그먼트`);

  } catch (error) {
    console.error(`자막 수집 실패: ${videoId}`, error);
    throw error;
  }
}
```

---

## 7. 쿼리 패턴 예시

### 7.1 채널 상세 + 최신 비디오

```typescript
interface ChannelWithVideos {
  channel: Channel;
  videos: Video[];
  totalVideos: number;
}

async function getChannelWithVideos(
  channelId: string,
  limit: number = 20,
  offset: number = 0
): Promise<ChannelWithVideos> {
  const channel = await db.get<Channel>(`
    SELECT * FROM channels WHERE channel_id = ?
  `, [channelId]);

  const videos = await db.query<Video>(`
    SELECT *
    FROM videos
    WHERE channel_id = ?
    ORDER BY published_at DESC
    LIMIT ? OFFSET ?
  `, [channelId, limit, offset]);

  const { count } = await db.get<{ count: number }>(`
    SELECT COUNT(*) as count
    FROM videos
    WHERE channel_id = ?
  `, [channelId]);

  return {
    channel,
    videos,
    totalVideos: count
  };
}
```

### 7.2 사용자 구독 피드

```typescript
interface SubscriptionFeedItem {
  video: Video;
  channel: Channel;
  subscriptionId: string;
}

async function getUserSubscriptionFeed(
  userId: string,
  limit: number = 50
): Promise<SubscriptionFeedItem[]> {
  return db.query<SubscriptionFeedItem>(`
    SELECT
      v.*,
      c.*,
      s.id as subscription_id
    FROM subscriptions s
    INNER JOIN channels c ON s.channel_id = c.channel_id
    INNER JOIN videos v ON c.channel_id = v.channel_id
    WHERE s.user_id = ?
    ORDER BY v.published_at DESC
    LIMIT ?
  `, [userId, limit]);
}
```

### 7.3 비디오 상세 + 댓글

```typescript
interface VideoWithComments {
  video: Video;
  comments: Comment[];
  totalComments: number;
}

async function getVideoWithComments(
  videoId: string,
  limit: number = 50,
  sortBy: 'latest' | 'popular' = 'popular'
): Promise<VideoWithComments> {
  const video = await db.get<Video>(`
    SELECT * FROM videos WHERE video_id = ?
  `, [videoId]);

  const orderBy = sortBy === 'popular' ? 'like_count DESC' : 'updated_at DESC';

  const comments = await db.query<Comment>(`
    SELECT *
    FROM comments
    WHERE video_id = ?
    ORDER BY ${orderBy}
    LIMIT ?
  `, [videoId, limit]);

  const { count } = await db.get<{ count: number }>(`
    SELECT COUNT(*) as count
    FROM comments
    WHERE video_id = ?
  `, [videoId]);

  return {
    video,
    comments,
    totalComments: count
  };
}
```

### 7.4 비디오 자막 조회

**전체 텍스트 검색:**
```typescript
**자막 조회 및 LLM 프롬프트 생성:**
```typescript
async function getTranscriptForAI(videoId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('transcripts')
    .select('data')
    .eq('video_id', videoId)
    .single();

  if (error || !data) return null;

  // jsonb에서 텍스트 추출
  const segments = data.data.content || [];
  const fullText = segments
    .map((seg: any) => seg.snippet.text)
    .join(' ');

  return fullText;
}
```

**특정 시간 구간 세그먼트 필터링:**
```typescript
async function getTranscriptSegmentsByTime(
  videoId: string,
  startMs: number,
  endMs: number
) {
  const { data } = await supabase
    .from('transcripts')
    .select('data')
    .eq('video_id', videoId)
    .single();

  if (!data) return [];

  // 애플리케이션에서 필터링
  return data.data.content.filter((seg: any) => {
    const segStart = parseInt(seg.start_ms);
    const segEnd = parseInt(seg.end_ms);
    return segStart >= startMs && segEnd <= endMs;
  });
}
```

---

## 8. 구현 체크리스트

### 8.1 스키마 구현
- [ ] 기본 테이블 생성 (channels, videos, profiles, summaries, subscriptions, comments, transcripts)
- [ ] 인덱스 정의 (기본, 전문검색, 부분, 복합)
- [ ] 제약조건 설정 (PK, UNIQUE, CHECK)
- [ ] RLS 정책 생성 (7개 테이블 모두)
- [ ] RLS 정책 테스트 (익명/인증/서비스롤 각 시나리오)

### 8.2 도메인 로직
- [ ] 채널 동기화 로직 구현
- [ ] 비디오 동기화 로직 구현
- [ ] 사용자 구독 동기화 구현
- [ ] 비디오 댓글 수집 로직 구현
- [ ] 비디오 자막 수집 로직 구현 (youtubei.js 원본 통으로 저장)
- [ ] AI 요약 및 인사이트 생성 파이프라인

### 8.3 애플리케이션 검증
- [ ] 관계 무결성 검증 함수 작성
- [ ] YouTube API 에러 핸들링
- [ ] 동기화 재시도 로직
- [ ] API 쿼터 관리

### 8.4 성능 최적화
- [ ] 쿼리 성능 분석 (EXPLAIN)
- [ ] 인덱스 사용률 모니터링
- [ ] N+1 쿼리 제거
- [ ] 캐싱 전략 수립

### 8.5 테스트
- [ ] 단위 테스트 (도메인 로직)
- [ ] 통합 테스트 (동기화 플로우)
- [ ] 부하 테스트 (대량 데이터)
- [ ] 엣지 케이스 (API 실패, 네트워크 에러 등)

---

## 9. 향후 확장 계획

### 9.1 소프트 삭제 지원
- `channels.excluded` 컬럼 추가
- `videos.excluded` 컬럼 추가
- `summaries.excluded` 컬럼 추가
- 소프트 삭제/복구 함수 구현

### 9.2 캐시 최적화
- 자주 조회되는 채널 정보 캐싱
- 구독 피드 사전 생성 (Materialized View)
- Redis 통합 고려

### 9.3 실시간 업데이트
- 새 비디오 알림 시스템
- WebSocket 기반 실시간 피드
- 채널 업데이트 푸시

### 9.4 고급 분석
- AI 기반 콘텐츠 추천
- 시청 패턴 분석
- 채널 성장 예측
- 트렌딩 비디오 분석 (향후 재구현)
- 감정 분석 파이프라인 (향후 재구현)

---

이 문서는 Zheon 프로젝트의 데이터베이스 스키마를 정의하고, 구현 가이드라인을 제공합니다.
