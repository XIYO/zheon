-- 최근 실패한 레코드들의 에러 내용 확인
SELECT
  id,
  url,
  title,
  summary,
  LEFT(content, 500) as error_details,
  processing_status,
  created_at,
  last_modified_at
FROM summary
WHERE processing_status = 'failed'
ORDER BY last_modified_at DESC
LIMIT 10;
