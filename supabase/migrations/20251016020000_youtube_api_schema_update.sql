-- YouTube Data API 표준 필드명으로 테이블 스키마 업데이트

-- channels 테이블 변경
ALTER TABLE public.channels
DROP COLUMN IF EXISTS is_recommended,
DROP COLUMN IF EXISTS expires_at;

-- 필드명 변경: YouTube API 표준 준수
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='channels' AND column_name='channel_name') THEN
    ALTER TABLE public.channels RENAME COLUMN channel_name TO title;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='channels' AND column_name='channel_avatar') THEN
    ALTER TABLE public.channels RENAME COLUMN channel_avatar TO thumbnail_url;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='channels' AND column_name='channel_handle') THEN
    ALTER TABLE public.channels RENAME COLUMN channel_handle TO custom_url;
  END IF;
END $$;

-- 신규 컬럼 추가
ALTER TABLE public.channels
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS thumbnail_width INTEGER,
ADD COLUMN IF NOT EXISTS thumbnail_height INTEGER,
ADD COLUMN IF NOT EXISTS view_count BIGINT,
ADD COLUMN IF NOT EXISTS uploads_playlist_id TEXT;

-- 기존 subscriber_count, video_count, description은 유지

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_channels_uploads_playlist
ON public.channels(uploads_playlist_id);

CREATE INDEX IF NOT EXISTS idx_channels_title_search
ON public.channels USING gin(to_tsvector('english', title));

-- channel_videos 테이블 변경
ALTER TABLE public.channel_videos
DROP COLUMN IF EXISTS expires_at;

-- 신규 컬럼 추가
ALTER TABLE public.channel_videos
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS channel_title TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_width INTEGER,
ADD COLUMN IF NOT EXISTS thumbnail_height INTEGER,
ADD COLUMN IF NOT EXISTS playlist_id TEXT,
ADD COLUMN IF NOT EXISTS position INTEGER;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_channel_videos_channel_published
ON public.channel_videos(channel_id, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_channel_videos_published
ON public.channel_videos(published_at DESC);

CREATE INDEX IF NOT EXISTS idx_channel_videos_title_search
ON public.channel_videos USING gin(to_tsvector('english', title));

CREATE INDEX IF NOT EXISTS idx_channel_videos_video_id
ON public.channel_videos(video_id);

-- youtube_subscriptions 테이블 변경
ALTER TABLE public.youtube_subscriptions
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS resource_kind TEXT,
ADD COLUMN IF NOT EXISTS subscription_data JSONB;

CREATE INDEX IF NOT EXISTS idx_youtube_subscriptions_user_published
ON public.youtube_subscriptions(user_id, published_at DESC);

-- 코멘트 추가
COMMENT ON COLUMN public.channels.uploads_playlist_id IS 'YouTube uploads playlist ID (UU로 시작)';
COMMENT ON COLUMN public.channels.custom_url IS 'YouTube 커스텀 URL (@handle)';
COMMENT ON COLUMN public.channel_videos.published_at IS '비디오 업로드 날짜 (정렬 기준)';
COMMENT ON COLUMN public.channel_videos.position IS '플레이리스트 내 위치';
