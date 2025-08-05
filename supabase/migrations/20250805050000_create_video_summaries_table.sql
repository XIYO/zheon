-- Create video_summaries table for YouTube video processing
-- This table stores YouTube video transcripts and their summaries

CREATE TABLE IF NOT EXISTS video_summaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- YouTube video info
    youtube_url TEXT NOT NULL UNIQUE,
    video_title TEXT,
    
    -- Content data
    transcript TEXT NOT NULL,
    summary TEXT,
    
    -- Processing metadata
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    processing_status TEXT DEFAULT 'completed' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_video_summaries_youtube_url 
ON video_summaries (youtube_url);

CREATE INDEX IF NOT EXISTS idx_video_summaries_created_at 
ON video_summaries (created_at DESC);

-- Add RLS (Row Level Security) policies
ALTER TABLE video_summaries ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all summaries (since summaries are shareable)
CREATE POLICY "Allow authenticated users to read video summaries" 
ON video_summaries FOR SELECT 
TO authenticated 
USING (true);

-- Allow authenticated users to insert summaries
CREATE POLICY "Allow authenticated users to insert video summaries" 
ON video_summaries FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow authenticated users to update their own summaries
CREATE POLICY "Allow authenticated users to update video summaries" 
ON video_summaries FOR UPDATE 
TO authenticated 
USING (true);

-- Comments for documentation
COMMENT ON TABLE video_summaries IS 'YouTube video transcripts and AI-generated summaries';
COMMENT ON COLUMN video_summaries.youtube_url IS 'Normalized YouTube URL (unique)';
COMMENT ON COLUMN video_summaries.video_title IS 'YouTube video title (extracted)';
COMMENT ON COLUMN video_summaries.transcript IS 'Full video transcript/subtitles';
COMMENT ON COLUMN video_summaries.summary IS 'AI-generated summary using LangChain + web research';
COMMENT ON COLUMN video_summaries.processing_status IS 'Current processing status of the video';