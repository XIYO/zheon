-- Add TTS audio columns to summary table
ALTER TABLE summary
  ADD COLUMN IF NOT EXISTS summary_audio_url TEXT,
  ADD COLUMN IF NOT EXISTS summary_audio_status TEXT CHECK (summary_audio_status IN ('processing', 'completed', 'failed')),
  ADD COLUMN IF NOT EXISTS insights_audio_url TEXT,
  ADD COLUMN IF NOT EXISTS insights_audio_status TEXT CHECK (insights_audio_status IN ('processing', 'completed', 'failed'));

-- Add indexes for audio status columns (for efficient querying)
CREATE INDEX IF NOT EXISTS idx_summary_audio_status ON summary(summary_audio_status) WHERE summary_audio_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_insights_audio_status ON summary(insights_audio_status) WHERE insights_audio_status IS NOT NULL;

-- Create tts-audio storage bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('tts-audio', 'tts-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for tts-audio bucket
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Public read access for tts-audio" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload tts-audio" ON storage.objects;
  DROP POLICY IF EXISTS "Service role can manage tts-audio" ON storage.objects;

  -- Create policies
  CREATE POLICY "Public read access for tts-audio"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'tts-audio');

  CREATE POLICY "Authenticated users can upload tts-audio"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'tts-audio');

  CREATE POLICY "Service role can manage tts-audio"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'tts-audio');
END $$;

-- Add comment
COMMENT ON COLUMN summary.summary_audio_url IS 'Gemini TTS audio URL for summary field';
COMMENT ON COLUMN summary.summary_audio_status IS 'TTS generation status for summary: processing/completed/failed';
COMMENT ON COLUMN summary.insights_audio_url IS 'Gemini TTS audio URL for insights field';
COMMENT ON COLUMN summary.insights_audio_status IS 'TTS generation status for insights: processing/completed/failed';
