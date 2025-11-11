-- Remove url column as it's redundant (can be computed from video_id)
ALTER TABLE summaries DROP COLUMN url;
