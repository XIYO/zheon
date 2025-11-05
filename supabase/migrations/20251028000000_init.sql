-- Zheon Database Schema - Public Schema Only
-- Uses public schema (default PostgreSQL schema)
-- PowerSync Compatible: No DB-level foreign key constraints

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
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT profiles_youtube_subscription_sync_status_check
    CHECK (youtube_subscription_sync_status IN ('idle', 'processing', 'completed', 'failed'))
);

-- 2.4 summaries
CREATE TABLE IF NOT EXISTS public.summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL UNIQUE,
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
  updated_at timestamptz DEFAULT now(),

  content_quality_score integer CHECK (content_quality_score >= 0 AND content_quality_score <= 100),
  content_educational_value integer CHECK (content_educational_value >= 0 AND content_educational_value <= 100),
  content_entertainment_value integer CHECK (content_entertainment_value >= 0 AND content_entertainment_value <= 100),
  content_information_accuracy integer CHECK (content_information_accuracy >= 0 AND content_information_accuracy <= 100),
  content_clarity integer CHECK (content_clarity >= 0 AND content_clarity <= 100),
  content_depth integer CHECK (content_depth >= 0 AND content_depth <= 100),
  content_category text,
  content_target_audience text,

  sentiment_overall_score integer CHECK (sentiment_overall_score >= 0 AND sentiment_overall_score <= 100),
  sentiment_positive_ratio integer CHECK (sentiment_positive_ratio >= 0 AND sentiment_positive_ratio <= 100),
  sentiment_neutral_ratio integer CHECK (sentiment_neutral_ratio >= 0 AND sentiment_neutral_ratio <= 100),
  sentiment_negative_ratio integer CHECK (sentiment_negative_ratio >= 0 AND sentiment_negative_ratio <= 100),
  sentiment_intensity integer CHECK (sentiment_intensity >= 0 AND sentiment_intensity <= 100),

  community_quality_score integer CHECK (community_quality_score >= 0 AND community_quality_score <= 100),
  community_politeness integer CHECK (community_politeness >= 0 AND community_politeness <= 100),
  community_rudeness integer CHECK (community_rudeness >= 0 AND community_rudeness <= 100),
  community_kindness integer CHECK (community_kindness >= 0 AND community_kindness <= 100),
  community_toxicity integer CHECK (community_toxicity >= 0 AND community_toxicity <= 100),
  community_constructive integer CHECK (community_constructive >= 0 AND community_constructive <= 100),
  community_self_centered integer CHECK (community_self_centered >= 0 AND community_self_centered <= 100),
  community_off_topic integer CHECK (community_off_topic >= 0 AND community_off_topic <= 100),

  age_group_teens integer CHECK (age_group_teens >= 0 AND age_group_teens <= 100),
  age_group_20s integer CHECK (age_group_20s >= 0 AND age_group_20s <= 100),
  age_group_30s integer CHECK (age_group_30s >= 0 AND age_group_30s <= 100),
  age_group_40plus integer CHECK (age_group_40plus >= 0 AND age_group_40plus <= 100),

  ai_content_summary text,
  ai_audience_reaction text,
  ai_key_insights jsonb DEFAULT '[]',
  ai_recommendations jsonb DEFAULT '[]',
  total_comments_analyzed integer DEFAULT 0,
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
  updated_at timestamptz DEFAULT now()
);

-- 2.7 transcripts
CREATE TABLE IF NOT EXISTS public.transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id text NOT NULL UNIQUE,
  data jsonb NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_summaries_url ON public.summaries(url);
CREATE INDEX IF NOT EXISTS idx_summaries_audio_status ON public.summaries(summary_audio_status) WHERE summary_audio_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_summaries_insights_audio_status ON public.summaries(insights_audio_status) WHERE insights_audio_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_summaries_content_quality ON public.summaries(content_quality_score DESC) WHERE content_quality_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_summaries_sentiment ON public.summaries(sentiment_overall_score DESC) WHERE sentiment_overall_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_summaries_community_quality ON public.summaries(community_quality_score DESC) WHERE community_quality_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_summaries_analysis_status ON public.summaries(analysis_status) WHERE analysis_status IS NOT NULL;

-- 3.4 subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_channel ON public.subscriptions(channel_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);

-- 3.5 comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_video_id ON public.comments(video_id);
CREATE INDEX IF NOT EXISTS idx_comments_comment_id ON public.comments(comment_id);

-- 3.6 transcripts indexes
CREATE INDEX IF NOT EXISTS idx_transcripts_video_id ON public.transcripts(video_id);

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

-- 4.5.1 summaries 테이블 권한
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

-- 4.7.1 comments 테이블 권한
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

-- 4.8.1 transcripts 테이블 권한
GRANT SELECT, INSERT ON public.transcripts TO anon;
GRANT ALL ON public.transcripts TO authenticated;

-- ============================================================================
-- 5. COMMENTS
-- ============================================================================

COMMENT ON TABLE public.channels IS 'YouTube 채널 메타데이터';
COMMENT ON TABLE public.videos IS '비디오 메타데이터';
COMMENT ON TABLE public.profiles IS '사용자 프로필 및 구독 동기화 상태';
COMMENT ON TABLE public.summaries IS 'AI 생성 비디오 요약 및 인사이트';
COMMENT ON TABLE public.subscriptions IS '사용자 구독 채널 목록';
COMMENT ON TABLE public.comments IS 'YouTube 비디오 댓글 (증분 수집용)';
COMMENT ON TABLE public.transcripts IS '비디오 자막 원본 데이터 (1회 소비용)';

COMMENT ON COLUMN public.summaries.content_quality_score IS 'Overall content quality score (0-100) based on transcript analysis';
COMMENT ON COLUMN public.summaries.sentiment_overall_score IS 'Overall sentiment score (0-100) based on top 100 comments';
COMMENT ON COLUMN public.summaries.community_quality_score IS 'Overall community quality score (0-100) based on comment tone/attitude';
COMMENT ON COLUMN public.summaries.ai_key_insights IS 'JSON array of key findings from AI analysis';
COMMENT ON COLUMN public.summaries.ai_recommendations IS 'JSON array of improvement suggestions';

-- ============================================================================
-- 6. REALTIME
-- ============================================================================

-- Enable Realtime for summaries table
ALTER PUBLICATION supabase_realtime ADD TABLE public.summaries;

-- Set replica identity to full for better change tracking
ALTER TABLE public.summaries REPLICA IDENTITY FULL;
