-- Zheon Database Schema - Consolidated
-- All migrations consolidated into single schema
-- Uses public schema (default PostgreSQL schema)
-- PowerSync Compatible: No DB-level foreign key constraints

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================

-- pg_cron extension for scheduled cleanup tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================================
-- 2. TABLES
-- ============================================================================

-- 2.1 channels
CREATE TABLE IF NOT EXISTS public.channels (
  channel_id text PRIMARY KEY,
  title text NOT NULL,
  custom_url text,
  thumbnail_url text,
  subscriber_count text,
  video_count integer DEFAULT 0,
  description text,
  channel_data jsonb DEFAULT '{}',
  updated timestamptz DEFAULT now(),
  video_sync_status text,
  video_synced_at timestamptz,
  published_at timestamptz,
  thumbnail_width integer,
  thumbnail_height integer,
  view_count bigint,
  uploads_playlist_id text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT channels_video_sync_status_check
    CHECK (video_sync_status IN ('idle', 'processing', 'completed', 'failed'))
);

-- 2.2 videos
CREATE TABLE IF NOT EXISTS public.videos (
  video_id text PRIMARY KEY,
  channel_id text NOT NULL,
  title text NOT NULL,
  thumbnail_url text,
  published_at text,
  duration text,
  view_count text,
  video_data jsonb DEFAULT '{}',
  updated timestamptz DEFAULT now(),
  sort_order integer,
  publish_date text,
  upload_date text,
  length_seconds integer,
  category text,
  is_family_safe boolean,
  is_unlisted boolean,
  available_countries text[],
  basic_info_synced_at timestamptz,
  description text,
  channel_title text,
  thumbnail_width integer,
  thumbnail_height integer,
  playlist_id text,
  position integer,
  video_insight jsonb,
  last_analyzed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT videos_channel_video_unique UNIQUE (channel_id, video_id)
);

-- 2.3 profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  display_name text,
  avatar_url text,
  bio text,
  youtube_subscription_sync_status text,
  youtube_subscription_synced_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT profiles_youtube_subscription_sync_status_check
    CHECK (youtube_subscription_sync_status IN ('idle', 'processing', 'completed', 'failed'))
);

-- 2.4 summaries
CREATE TABLE IF NOT EXISTS public.summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id text NOT NULL UNIQUE,
  title text,
  channel_id text,
  channel_name text,
  duration integer,
  transcript text,
  summary text,
  insights text,
  language text DEFAULT 'ko',
  processing_status text DEFAULT 'pending',
  summary_audio_url text,
  summary_audio_status text,
  insights_audio_url text,
  insights_audio_status text,
  thumbnail_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now(),
  -- 메타데이터(연령/감정 등)는 별도 정규화 테이블에 저장합니다.
  analysis_status text CHECK (analysis_status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  analyzed_at timestamptz,
  analysis_model text DEFAULT 'gemini-2.5-flash-lite',

  CONSTRAINT summaries_processing_status_check
    CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  CONSTRAINT summaries_summary_audio_status_check
    CHECK (summary_audio_status IN ('processing', 'completed', 'failed')),
  CONSTRAINT summaries_insights_audio_status_check
    CHECK (insights_audio_status IN ('processing', 'completed', 'failed'))
);

-- 2.5 subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  channel_id text NOT NULL,
  subscribed_at timestamptz,
  title text,
  description text,
  published_at timestamptz,
  thumbnail_url text,
  resource_kind text,
  subscription_data jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT subscriptions_user_channel_unique UNIQUE (user_id, channel_id)
);

-- 2.6 comments
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id text NOT NULL UNIQUE,
  video_id text NOT NULL,
  data jsonb NOT NULL,
  sentiment text CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  sentiment_confidence real CHECK (sentiment_confidence >= 0 AND sentiment_confidence <= 1),
  sentiment_analyzed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- 2.7 transcripts
CREATE TABLE IF NOT EXISTS public.transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id text NOT NULL UNIQUE,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- 2.8 content_community_metrics (정규화된 커뮤니티 연령/감정 메타)
CREATE TABLE IF NOT EXISTS public.content_community_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id text NOT NULL UNIQUE REFERENCES public.summaries(video_id) ON DELETE CASCADE,
  comments_analyzed integer DEFAULT 0,

  -- 연령 분포 및 요약 (합 100 권장)
  age_teens integer CHECK (age_teens >= 0 AND age_teens <= 100),
  age_20s integer CHECK (age_20s >= 0 AND age_20s <= 100),
  age_30s integer CHECK (age_30s >= 0 AND age_30s <= 100),
  age_40plus integer CHECK (age_40plus >= 0 AND age_40plus <= 100),
  age_median integer CHECK (age_median >= 0 AND age_median <= 100),
  age_adult_ratio integer CHECK (age_adult_ratio >= 0 AND age_adult_ratio <= 100),

  -- Plutchik 8축 감정 분포 (합 100 권장)
  emotion_joy integer CHECK (emotion_joy >= 0 AND emotion_joy <= 100),
  emotion_trust integer CHECK (emotion_trust >= 0 AND emotion_trust <= 100),
  emotion_fear integer CHECK (emotion_fear >= 0 AND emotion_fear <= 100),
  emotion_surprise integer CHECK (emotion_surprise >= 0 AND emotion_surprise <= 100),
  emotion_sadness integer CHECK (emotion_sadness >= 0 AND emotion_sadness <= 100),
  emotion_disgust integer CHECK (emotion_disgust >= 0 AND emotion_disgust <= 100),
  emotion_anger integer CHECK (emotion_anger >= 0 AND emotion_anger <= 100),
  emotion_anticipation integer CHECK (emotion_anticipation >= 0 AND emotion_anticipation <= 100),

  -- 요약값
  emotion_dominant text,
  emotion_entropy real,
  valence_mean integer CHECK (valence_mean >= -100 AND valence_mean <= 100),
  arousal_mean integer CHECK (arousal_mean >= -100 AND arousal_mean <= 100),

  -- 대표 댓글 (각 연령대/감정별 실제 댓글 예시)
  representative_comments jsonb DEFAULT '{}',

  framework_version text DEFAULT 'v1.0',
  analysis_model text,
  analyzed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 3. INDEXES
-- ============================================================================

-- 3.1 channels indexes
CREATE INDEX IF NOT EXISTS idx_channels_handle ON public.channels(custom_url);
CREATE INDEX IF NOT EXISTS idx_channels_title_search ON public.channels USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_channels_updated_at ON public.channels(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_channels_uploads_playlist ON public.channels(uploads_playlist_id);

-- 3.2 videos indexes
CREATE INDEX IF NOT EXISTS idx_videos_channel_published ON public.videos(channel_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_needs_sync ON public.videos(channel_id, basic_info_synced_at) WHERE basic_info_synced_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_videos_published ON public.videos(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_sort_order ON public.videos(channel_id, sort_order DESC);
CREATE INDEX IF NOT EXISTS idx_videos_title_search ON public.videos USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_videos_video_id ON public.videos(video_id);
CREATE INDEX IF NOT EXISTS idx_videos_channel ON public.videos(channel_id);

-- 3.3 summaries indexes
CREATE INDEX IF NOT EXISTS idx_summaries_channel_id ON public.summaries(channel_id) WHERE channel_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_summaries_processing_status ON public.summaries(processing_status);
CREATE INDEX IF NOT EXISTS idx_summaries_video_id ON public.summaries(video_id);
CREATE INDEX IF NOT EXISTS idx_summaries_created_at ON public.summaries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_summaries_audio_status ON public.summaries(summary_audio_status) WHERE summary_audio_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_summaries_insights_audio_status ON public.summaries(insights_audio_status) WHERE insights_audio_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_summaries_analysis_status ON public.summaries(analysis_status) WHERE analysis_status IS NOT NULL;

-- 3.4 subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_channel ON public.subscriptions(channel_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);

-- 3.5 comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_video_id ON public.comments(video_id);
CREATE INDEX IF NOT EXISTS idx_comments_comment_id ON public.comments(comment_id);

-- 3.6 transcripts indexes
CREATE INDEX IF NOT EXISTS idx_transcripts_video_id ON public.transcripts(video_id);

-- 3.7 content_community_metrics indexes
CREATE INDEX IF NOT EXISTS idx_ccm_video_id ON public.content_community_metrics(video_id);
CREATE INDEX IF NOT EXISTS idx_ccm_age_median ON public.content_community_metrics(age_median);
CREATE INDEX IF NOT EXISTS idx_ccm_age_adult_ratio ON public.content_community_metrics(age_adult_ratio);
CREATE INDEX IF NOT EXISTS idx_ccm_emotion_dominant ON public.content_community_metrics(emotion_dominant);
CREATE INDEX IF NOT EXISTS idx_ccm_valence_arousal ON public.content_community_metrics(valence_mean, arousal_mean);

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- 4.1 Enable RLS on all tables
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_community_metrics ENABLE ROW LEVEL SECURITY;

-- 4.2 channels RLS policies
CREATE POLICY "Anyone can view channels"
  ON public.channels FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated users can upsert channels"
  ON public.channels FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update channels"
  ON public.channels FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage channels"
  ON public.channels FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4.3 videos RLS policies
CREATE POLICY "Anyone can view videos"
  ON public.videos FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Service role can manage videos"
  ON public.videos FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4.4 profiles RLS policies
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- 4.5 summaries RLS policies
CREATE POLICY "Allow public read"
  ON public.summaries FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow public insert"
  ON public.summaries FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Allow service role update"
  ON public.summaries FOR UPDATE
  TO service_role
  USING (true);

CREATE POLICY "Allow service role delete"
  ON public.summaries FOR DELETE
  TO service_role
  USING (true);

GRANT SELECT, INSERT ON public.summaries TO anon;
GRANT ALL ON public.summaries TO authenticated;

-- 4.6 subscriptions RLS policies
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own subscriptions"
  ON public.subscriptions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscriptions"
  ON public.subscriptions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4.7 comments RLS policies
CREATE POLICY "Anyone can view comments"
  ON public.comments FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Anyone can insert comments"
  ON public.comments FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Service role can manage comments"
  ON public.comments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT ON public.comments TO anon;
GRANT ALL ON public.comments TO authenticated;

-- 4.8 transcripts RLS policies
CREATE POLICY "Anyone can view transcripts"
  ON public.transcripts FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Anyone can insert transcripts"
  ON public.transcripts FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Service role can manage transcripts"
  ON public.transcripts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT ON public.transcripts TO anon;
GRANT ALL ON public.transcripts TO authenticated;

-- 4.9 content_community_metrics RLS policies
CREATE POLICY "Anyone can view content_community_metrics"
  ON public.content_community_metrics FOR SELECT
  TO authenticated, anon
  USING (true);

GRANT SELECT ON public.content_community_metrics TO anon;
GRANT ALL ON public.content_community_metrics TO authenticated;


-- ============================================================================
-- 5. SCHEDULED TASKS (pg_cron)
-- ============================================================================

-- Cleanup function for stuck processing records
CREATE OR REPLACE FUNCTION public.cleanup_stuck_processing()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER := 0;
  processing_count INTEGER := 0;
  analysis_count INTEGER := 0;
BEGIN
  -- processing_status가 10분 이상 stuck인 레코드 처리
  WITH updated AS (
    UPDATE public.summaries
    SET
      processing_status = 'failed',
      updated_at = now()
    WHERE processing_status = 'processing'
      AND updated_at < now() - interval '10 minutes'
    RETURNING id
  )
  SELECT count(*) INTO processing_count FROM updated;

  -- analysis_status가 10분 이상 stuck인 레코드 처리
  WITH updated_analysis AS (
    UPDATE public.summaries
    SET
      analysis_status = 'failed',
      updated_at = now()
    WHERE analysis_status = 'processing'
      AND updated_at < now() - interval '10 minutes'
    RETURNING id
  )
  SELECT count(*) INTO analysis_count FROM updated_analysis;

  updated_count := processing_count + analysis_count;

  RAISE NOTICE 'Cleaned up % stuck processing records (processing: %, analysis: %)',
    updated_count, processing_count, analysis_count;

  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.cleanup_stuck_processing() IS
'10분 이상 processing 상태인 summaries 레코드를 failed로 변경. pg_cron에서 매시간 실행됨.';

-- Remove existing job if present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-stuck-processing') THEN
    PERFORM cron.unschedule('cleanup-stuck-processing');
  END IF;
END $$;

-- Schedule cleanup job: runs every hour
SELECT cron.schedule(
  'cleanup-stuck-processing',
  '0 * * * *',
  $$SELECT public.cleanup_stuck_processing();$$
);

-- ============================================================================
-- 6. COMMENTS
-- ============================================================================

COMMENT ON TABLE public.channels IS 'YouTube 채널 메타데이터';
COMMENT ON TABLE public.videos IS '비디오 메타데이터';
COMMENT ON TABLE public.profiles IS '사용자 프로필 및 구독 동기화 상태';
COMMENT ON TABLE public.summaries IS 'AI 생성 비디오 요약 (메타는 별도 테이블)';
COMMENT ON TABLE public.subscriptions IS '사용자 구독 채널 목록';
COMMENT ON TABLE public.comments IS 'YouTube 비디오 댓글 (증분 수집용)';
COMMENT ON TABLE public.transcripts IS '비디오 자막 원본 데이터 (1회 소비용)';
COMMENT ON TABLE public.content_community_metrics IS '정규화된 커뮤니티 연령/감정 메타 (검색 최적화)';

COMMENT ON COLUMN public.summaries.video_id IS 'YouTube video ID (11 characters) - primary identifier';
COMMENT ON COLUMN public.content_community_metrics.video_id IS 'FK to summaries.video_id';

-- ============================================================================
-- 7. REALTIME
-- ============================================================================

-- Enable Realtime for summaries table
ALTER PUBLICATION supabase_realtime ADD TABLE public.summaries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.content_community_metrics;

-- Set replica identity to full for better change tracking
ALTER TABLE public.summaries REPLICA IDENTITY FULL;
ALTER TABLE public.content_community_metrics REPLICA IDENTITY FULL;
