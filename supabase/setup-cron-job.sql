-- pg_cron extension이 설치되어 있는지 확인
-- Supabase Dashboard > Database > Extensions에서 pg_cron 활성화 필요

-- pg_cron job 등록: 매시간 정각에 실행
SELECT cron.schedule(
  'cleanup-stuck-processing',
  '0 * * * *',
  $$SELECT public.cleanup_stuck_processing();$$
);

-- 등록된 cron job 확인
SELECT * FROM cron.job WHERE jobname = 'cleanup-stuck-processing';

-- cron job 실행 이력 확인
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'cleanup-stuck-processing')
ORDER BY start_time DESC
LIMIT 10;
