-- Add audio status columns to summary table
ALTER TABLE summary
ADD COLUMN IF NOT EXISTS summary_audio_status TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS content_audio_status TEXT DEFAULT NULL;

-- Add check constraints
ALTER TABLE summary
ADD CONSTRAINT summary_audio_status_check 
CHECK (summary_audio_status IN ('processing', 'completed', 'failed'));

ALTER TABLE summary
ADD CONSTRAINT content_audio_status_check 
CHECK (content_audio_status IN ('processing', 'completed', 'failed'));

-- Add comments
COMMENT ON COLUMN summary.summary_audio_status IS 'Status of summary audio generation: processing, completed, failed';
COMMENT ON COLUMN summary.content_audio_status IS 'Status of content audio generation: processing, completed, failed';

-- Add index for faster status queries
CREATE INDEX IF NOT EXISTS idx_summary_audio_status ON summary(id, summary_audio_status) WHERE summary_audio_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_content_audio_status ON summary(id, content_audio_status) WHERE content_audio_status IS NOT NULL;
