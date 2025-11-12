-- Fix valence_mean and arousal_mean range to support -100 to 100 (VAD model standard)

-- Drop existing constraints
ALTER TABLE public.content_community_metrics
  DROP CONSTRAINT IF EXISTS content_community_metrics_valence_mean_check,
  DROP CONSTRAINT IF EXISTS content_community_metrics_arousal_mean_check;

-- Add correct constraints with -100 to 100 range
ALTER TABLE public.content_community_metrics
  ADD CONSTRAINT content_community_metrics_valence_mean_check
    CHECK (valence_mean >= -100 AND valence_mean <= 100),
  ADD CONSTRAINT content_community_metrics_arousal_mean_check
    CHECK (arousal_mean >= -100 AND arousal_mean <= 100);

-- Add comments
COMMENT ON COLUMN public.content_community_metrics.valence_mean IS 'VAD model valence: -100 (very negative) to +100 (very positive)';
COMMENT ON COLUMN public.content_community_metrics.arousal_mean IS 'VAD model arousal: -100 (very calm) to +100 (very excited)';
