-- Add 'pending' status to summary_audio_status check constraint

ALTER TABLE summary
DROP CONSTRAINT IF EXISTS summary_summary_audio_status_check;

ALTER TABLE summary
ADD CONSTRAINT summary_summary_audio_status_check
CHECK (summary_audio_status IN ('pending', 'processing', 'completed', 'failed'));

ALTER TABLE summary
DROP CONSTRAINT IF EXISTS summary_insights_audio_status_check;

ALTER TABLE summary
ADD CONSTRAINT summary_insights_audio_status_check
CHECK (insights_audio_status IN ('pending', 'processing', 'completed', 'failed'));

COMMENT ON COLUMN summary.summary_audio_status IS 'TTS generation status for summary: pending/processing/completed/failed';
COMMENT ON COLUMN summary.insights_audio_status IS 'TTS generation status for insights: pending/processing/completed/failed';
