-- Create subtitles table for caching YouTube subtitles
-- This matches the structure in your database.types.ts

CREATE TABLE IF NOT EXISTS subtitles (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    youtube_url TEXT NOT NULL,
    lang TEXT NOT NULL DEFAULT 'ko',
    subtitle TEXT NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subtitles_youtube_url_lang 
ON subtitles (youtube_url, lang);

CREATE INDEX IF NOT EXISTS idx_subtitles_created_at 
ON subtitles (created_at);

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE subtitles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all subtitles (since subtitles are shareable)
CREATE POLICY "Allow authenticated users to read subtitles" 
ON subtitles FOR SELECT 
TO authenticated 
USING (true);

-- Allow authenticated users to insert subtitles
CREATE POLICY "Allow authenticated users to insert subtitles" 
ON subtitles FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Optional: Allow users to update subtitles (if needed)
CREATE POLICY "Allow authenticated users to update subtitles" 
ON subtitles FOR UPDATE 
TO authenticated 
USING (true);

-- Comments for documentation
COMMENT ON TABLE subtitles IS 'Cache table for YouTube video subtitles';
COMMENT ON COLUMN subtitles.youtube_url IS 'Normalized YouTube URL';
COMMENT ON COLUMN subtitles.lang IS 'Language code (ko, en, etc.)';
COMMENT ON COLUMN subtitles.subtitle IS 'Extracted subtitle content as text';
