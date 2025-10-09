-- Fix stuck pending/processing records (15+ minutes old)
-- This migration updates records that are stuck in pending or processing state

UPDATE summary
SET
  processing_status = 'failed',
  summary = 'Processing timed out - please retry',
  content = 'Error: Processing exceeded maximum time limit (15 minutes). This may be due to API timeout or network issues.',
  last_modified_at = NOW()
WHERE
  processing_status IN ('pending', 'processing')
  AND created_at < NOW() - INTERVAL '15 minutes';
