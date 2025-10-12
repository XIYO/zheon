-- YouTube channel cache table
CREATE TABLE IF NOT EXISTS youtube_channel_cache (
    channel_id TEXT PRIMARY KEY,
    channel_data JSONB NOT NULL,
    cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '1 hour'
);

-- YouTube channel videos cache table
CREATE TABLE IF NOT EXISTS youtube_channel_videos_cache (
    id BIGSERIAL PRIMARY KEY,
    channel_id TEXT NOT NULL REFERENCES youtube_channel_cache(channel_id) ON DELETE CASCADE,
    video_data JSONB NOT NULL,
    cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for channel videos lookup
CREATE INDEX IF NOT EXISTS idx_channel_videos_channel_id ON youtube_channel_videos_cache(channel_id);

-- Index for expired cache lookup
CREATE INDEX IF NOT EXISTS idx_channel_cache_expires_at ON youtube_channel_cache(expires_at);

-- Function to delete expired cache
CREATE OR REPLACE FUNCTION delete_expired_youtube_cache()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM youtube_channel_cache WHERE expires_at < NOW();
END;
$$;

-- RLS policies
ALTER TABLE youtube_channel_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE youtube_channel_videos_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read channel cache"
    ON youtube_channel_cache FOR SELECT
    USING (true);

CREATE POLICY "Anyone can read videos cache"
    ON youtube_channel_videos_cache FOR SELECT
    USING (true);

-- Service role policies for cache write
CREATE POLICY "Service role can insert channel cache"
    ON youtube_channel_cache FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Service role can update channel cache"
    ON youtube_channel_cache FOR UPDATE
    USING (true);

CREATE POLICY "Service role can delete channel cache"
    ON youtube_channel_cache FOR DELETE
    USING (true);

CREATE POLICY "Service role can insert videos cache"
    ON youtube_channel_videos_cache FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Service role can delete videos cache"
    ON youtube_channel_videos_cache FOR DELETE
    USING (true);
