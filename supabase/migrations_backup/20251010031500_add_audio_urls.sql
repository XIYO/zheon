-- Add audio URL columns to summary table
ALTER TABLE summary
ADD COLUMN IF NOT EXISTS summary_audio_url TEXT,
ADD COLUMN IF NOT EXISTS content_audio_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN summary.summary_audio_url IS 'Storage path for AI summary audio (Gemini TTS)';
COMMENT ON COLUMN summary.content_audio_url IS 'Storage path for content/insights audio (Gemini TTS)';
