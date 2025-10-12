-- Drop all old conflicting tables if they exist
DROP TABLE IF EXISTS public.summary CASCADE;
DROP TABLE IF EXISTS public.video_summaries CASCADE;
DROP TABLE IF EXISTS public.subtitles CASCADE;
DROP TABLE IF EXISTS public.recommended_channels CASCADE;
DROP TABLE IF EXISTS public.youtube_channel_cache CASCADE;
DROP TABLE IF EXISTS public.youtube_channel_videos_cache CASCADE;
DROP TABLE IF EXISTS public.youtube_subscriptions_cache CASCADE;

-- Create main summary table with clean structure
CREATE TABLE public.summary (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    url TEXT NOT NULL UNIQUE,
    title TEXT,
    channel_id TEXT,
    channel_name TEXT,
    duration INTEGER, -- in seconds
    transcript TEXT,
    summary TEXT,
    insights TEXT,
    language TEXT DEFAULT 'ko',
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_summary_url ON public.summary(url);
CREATE INDEX idx_summary_processing_status ON public.summary(processing_status);
CREATE INDEX idx_summary_created_at ON public.summary(created_at DESC);
CREATE INDEX idx_summary_updated_at ON public.summary(updated_at DESC);
CREATE INDEX idx_summary_channel_id ON public.summary(channel_id) WHERE channel_id IS NOT NULL;

-- Create RLS policies
ALTER TABLE public.summary ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to read all summaries (public cache)
CREATE POLICY "Allow anonymous read" ON public.summary
    FOR SELECT TO anon
    USING (true);

-- Allow authenticated users full access to their summaries
CREATE POLICY "Allow authenticated full access" ON public.summary
    FOR ALL TO authenticated
    USING (true);

-- Allow service role full access
CREATE POLICY "Allow service role full access" ON public.summary
    FOR ALL TO service_role
    USING (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER update_summary_updated_at BEFORE UPDATE ON public.summary
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to check for existing summary
DROP FUNCTION IF EXISTS public.check_existing_summary(TEXT);
CREATE OR REPLACE FUNCTION public.check_existing_summary(p_url TEXT)
RETURNS UUID AS $$
DECLARE
    existing_summary_id UUID;
BEGIN
    -- Check if summary exists
    SELECT id INTO existing_summary_id
    FROM public.summary
    WHERE url = p_url;

    IF existing_summary_id IS NOT NULL THEN
        -- Update timestamps to move to top
        UPDATE public.summary
        SET updated_at = NOW()
        WHERE id = existing_summary_id;

        RETURN existing_summary_id;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON public.summary TO service_role;
GRANT SELECT ON public.summary TO anon;
GRANT ALL ON public.summary TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_existing_summary TO anon, authenticated, service_role;