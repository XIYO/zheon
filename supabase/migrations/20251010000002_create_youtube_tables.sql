-- YouTube Channels Table
CREATE TABLE public.channels (
    channel_id TEXT PRIMARY KEY,
    channel_name TEXT NOT NULL,
    channel_avatar TEXT,
    subscriber_count BIGINT,
    video_count INTEGER,
    description TEXT,
    channel_data JSONB,
    is_recommended BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE INDEX idx_channels_updated_at ON public.channels(updated_at DESC);
CREATE INDEX idx_channels_expires_at ON public.channels(expires_at);
CREATE INDEX idx_channels_recommended ON public.channels(is_recommended) WHERE is_recommended = true;

-- YouTube Channel Videos Table
CREATE TABLE public.channel_videos (
    channel_id TEXT NOT NULL,
    video_id TEXT NOT NULL,
    video_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '6 hours'),
    PRIMARY KEY (channel_id, video_id),
    FOREIGN KEY (channel_id) REFERENCES public.channels(channel_id) ON DELETE CASCADE
);

CREATE INDEX idx_channel_videos_channel ON public.channel_videos(channel_id);
CREATE INDEX idx_channel_videos_expires ON public.channel_videos(expires_at);

-- User Subscriptions Table
CREATE TABLE public.user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    channel_id TEXT NOT NULL,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, channel_id),
    FOREIGN KEY (channel_id) REFERENCES public.channels(channel_id) ON DELETE CASCADE
);

CREATE INDEX idx_user_subscriptions_user ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_channel ON public.user_subscriptions(channel_id);

-- Create trigger to update updated_at for channels
CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON public.channels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to update updated_at for channel_videos
CREATE TRIGGER update_channel_videos_updated_at BEFORE UPDATE ON public.channel_videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Channels - everyone can read
CREATE POLICY "Public read access" ON public.channels FOR SELECT USING (true);
CREATE POLICY "Service role full access" ON public.channels FOR ALL TO service_role USING (true);

-- Channel Videos - everyone can read
CREATE POLICY "Public read access" ON public.channel_videos FOR SELECT USING (true);
CREATE POLICY "Service role full access" ON public.channel_videos FOR ALL TO service_role USING (true);

-- User Subscriptions - users can manage their own
CREATE POLICY "Users read own subscriptions" ON public.user_subscriptions
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users manage own subscriptions" ON public.user_subscriptions
    FOR ALL TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Service role full access" ON public.user_subscriptions
    FOR ALL TO service_role USING (true);

-- Grant permissions
GRANT SELECT ON public.channels TO anon, authenticated;
GRANT SELECT ON public.channel_videos TO anon, authenticated;
GRANT ALL ON public.channels TO service_role;
GRANT ALL ON public.channel_videos TO service_role;

GRANT SELECT ON public.user_subscriptions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.user_subscriptions TO authenticated;
GRANT ALL ON public.user_subscriptions TO service_role;

-- Function to clean expired data
CREATE OR REPLACE FUNCTION public.cleanup_expired_data()
RETURNS void AS $$
BEGIN
    -- Delete expired channel data
    DELETE FROM public.channels WHERE expires_at < NOW() AND is_recommended = false;
    -- Delete expired channel videos
    DELETE FROM public.channel_videos WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;