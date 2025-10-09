-- 15분 이상 pending 상태인 레코드들을 failed로 변경
UPDATE summary
SET
  processing_status = 'failed',
  summary = 'Processing timed out or failed',
  last_modified_at = NOW()
WHERE
  processing_status IN ('pending', 'processing')
  AND created_at < NOW() - INTERVAL '15 minutes';

-- 결과 확인
SELECT id, url, processing_status, created_at, last_modified_at
FROM summary
WHERE processing_status = 'failed'
ORDER BY last_modified_at DESC
LIMIT 10;
