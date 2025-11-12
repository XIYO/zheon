-- Add failure_reason column to summaries table
ALTER TABLE public.summaries
ADD COLUMN IF NOT EXISTS failure_reason text;

COMMENT ON COLUMN public.summaries.failure_reason IS '분석 실패 이유 (analysis_status=failed일 때만 사용)';
