-- Fix sentiment and community score ranges to allow negative values
-- sentiment_overall_score and community_quality_score should accept -100 to 100 range

ALTER TABLE public.summaries
  DROP CONSTRAINT IF EXISTS summaries_sentiment_overall_score_check;

ALTER TABLE public.summaries
  ADD CONSTRAINT summaries_sentiment_overall_score_check
  CHECK (sentiment_overall_score >= -100 AND sentiment_overall_score <= 100);

ALTER TABLE public.summaries
  DROP CONSTRAINT IF EXISTS summaries_community_quality_score_check;

ALTER TABLE public.summaries
  ADD CONSTRAINT summaries_community_quality_score_check
  CHECK (community_quality_score >= -100 AND community_quality_score <= 100);

COMMENT ON COLUMN public.summaries.sentiment_overall_score IS 'Overall sentiment score (-100 to 100: negative to positive) based on top 100 comments';
COMMENT ON COLUMN public.summaries.community_quality_score IS 'Overall community quality score (-100 to 100: toxic to constructive) based on comment tone/attitude';
