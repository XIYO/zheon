-- pg_cron extension 활성화
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 10분 이상 processing 상태인 레코드를 failed로 변경하는 함수
CREATE OR REPLACE FUNCTION public.cleanup_stuck_processing()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER := 0;
  processing_count INTEGER := 0;
  analysis_count INTEGER := 0;
BEGIN
  -- processing_status가 10분 이상 stuck인 레코드 처리
  WITH updated AS (
    UPDATE public.summaries
    SET
      processing_status = 'failed',
      updated_at = now()
    WHERE processing_status = 'processing'
      AND updated_at < now() - interval '10 minutes'
    RETURNING id
  )
  SELECT count(*) INTO processing_count FROM updated;

  -- analysis_status가 10분 이상 stuck인 레코드 처리
  WITH updated_analysis AS (
    UPDATE public.summaries
    SET
      analysis_status = 'failed',
      updated_at = now()
    WHERE analysis_status = 'processing'
      AND updated_at < now() - interval '10 minutes'
    RETURNING id
  )
  SELECT count(*) INTO analysis_count FROM updated_analysis;

  updated_count := processing_count + analysis_count;

  RAISE NOTICE 'Cleaned up % stuck processing records (processing: %, analysis: %)',
    updated_count, processing_count, analysis_count;

  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.cleanup_stuck_processing() IS
'10분 이상 processing 상태인 summaries 레코드를 failed로 변경. pg_cron에서 매시간 실행됨.';

-- 기존에 등록된 동일한 job이 있다면 삭제
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-stuck-processing') THEN
    PERFORM cron.unschedule('cleanup-stuck-processing');
  END IF;
END $$;

-- pg_cron job 등록: 매시간 정각에 실행
SELECT cron.schedule(
  'cleanup-stuck-processing',
  '0 * * * *',
  $$SELECT public.cleanup_stuck_processing();$$
);
