# pg_cron 설정 가이드

## 목적

10분 이상 `processing` 상태로 멈춰있는 `summaries` 레코드를 자동으로 `failed`로 변경합니다.

## 설정 단계

### 1. pg_cron extension 활성화

Supabase Dashboard에서:

1. Project Settings > Database > Extensions
2. `pg_cron` 검색 후 활성화

### 2. cron job 등록

`supabase/setup-cron-job.sql` 파일의 내용을 Supabase SQL Editor에서 실행:

```sql
SELECT cron.schedule(
  'cleanup-stuck-processing',
  '0 * * * *',
  $$SELECT public.cleanup_stuck_processing();$$
);
```

### 3. 동작 확인

```sql
-- 등록된 job 확인
SELECT * FROM cron.job WHERE jobname = 'cleanup-stuck-processing';

-- 실행 이력 확인
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'cleanup-stuck-processing')
ORDER BY start_time DESC
LIMIT 10;
```

## 함수 설명

### `public.cleanup_stuck_processing()`

- 10분 이상 `processing_status = 'processing'`인 레코드 → `failed`로 변경
- 10분 이상 `analysis_status = 'processing'`인 레코드 → `failed`로 변경
- 처리된 레코드 수를 반환
- 실행 시 NOTICE로 상세 정보 출력

### 수동 실행

```sql
SELECT public.cleanup_stuck_processing();
```

## cron 스케줄

- 실행 주기: 매시간 정각 (0 \* \* \* \*)
- cron 표현식 설명:
  - 0: 분 (0분)
  - \*: 시 (매시)
  - \*: 일 (매일)
  - \*: 월 (매월)
  - \*: 요일 (매요일)

## 관리 명령어

### job 삭제

```sql
SELECT cron.unschedule('cleanup-stuck-processing');
```

### job 일시 중지/재개

pg_cron은 직접적인 pause/resume 기능이 없으므로 삭제 후 재등록 필요

### 스케줄 변경

```sql
-- 기존 job 삭제
SELECT cron.unschedule('cleanup-stuck-processing');

-- 새로운 스케줄로 재등록 (예: 30분마다)
SELECT cron.schedule(
  'cleanup-stuck-processing',
  '*/30 * * * *',
  $$SELECT public.cleanup_stuck_processing();$$
);
```

## 모니터링

### 최근 실행 결과

```sql
SELECT
  start_time,
  end_time,
  status,
  return_message,
  (end_time - start_time) as duration
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'cleanup-stuck-processing')
ORDER BY start_time DESC
LIMIT 20;
```

### 실패한 실행 확인

```sql
SELECT
  start_time,
  status,
  return_message
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'cleanup-stuck-processing')
  AND status = 'failed'
ORDER BY start_time DESC;
```
