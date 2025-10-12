-- Change processing_status default value from 'completed' to 'pending'
-- This allows proper status tracking for async video processing

ALTER TABLE public.video_summaries
ALTER COLUMN processing_status SET DEFAULT 'pending'::text;

-- Update existing records with NULL status to 'completed' (legacy data)
UPDATE public.video_summaries
SET processing_status = 'completed'
WHERE processing_status IS NULL;
