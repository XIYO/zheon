-- Create a function to cleanup stuck pending/processing records
-- Can be called manually or scheduled

CREATE OR REPLACE FUNCTION cleanup_stuck_summary_records(timeout_minutes INTEGER DEFAULT 10)
RETURNS TABLE (
  id BIGINT,
  url TEXT,
  old_status TEXT,
  new_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  UPDATE summary
  SET
    processing_status = 'failed',
    summary = 'Processing timed out after ' || timeout_minutes || ' minutes - please retry',
    content = 'Error: Processing exceeded maximum time limit. This may be due to API timeout, network issues, or service unavailability.',
    last_modified_at = NOW()
  WHERE
    processing_status IN ('pending', 'processing')
    AND created_at < NOW() - (timeout_minutes || ' minutes')::INTERVAL
  RETURNING
    summary.id,
    summary.url,
    processing_status AS old_status,
    'failed' AS new_status;
END;
$$ LANGUAGE plpgsql;

-- Initial cleanup: mark records older than 10 minutes as failed
SELECT * FROM cleanup_stuck_summary_records(10);
