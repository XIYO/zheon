-- Add processing_status column to summary table for async processing tracking
-- This allows the same status tracking pattern as video_summaries table

ALTER TABLE public.summary
ADD COLUMN IF NOT EXISTS processing_status text DEFAULT 'pending'::text;

-- Add constraint to ensure valid status values
ALTER TABLE public.summary
ADD CONSTRAINT summary_processing_status_check
CHECK (processing_status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text]));

-- Update existing records to 'completed' status (they're already processed)
UPDATE public.summary
SET processing_status = 'completed'
WHERE processing_status IS NULL;

-- Add index for faster status queries
CREATE INDEX IF NOT EXISTS idx_summary_processing_status ON public.summary (processing_status);

COMMENT ON COLUMN public.summary.processing_status IS 'Current processing status: pending, processing, completed, failed';
