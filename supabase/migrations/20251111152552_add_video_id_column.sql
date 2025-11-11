-- Add video_id column to summaries table
ALTER TABLE summaries ADD COLUMN video_id TEXT;

-- Extract video_id from existing urls and populate the column
UPDATE summaries
SET video_id = SUBSTRING(url FROM 'v=([^&]+)');

-- Make video_id NOT NULL after populating existing data
ALTER TABLE summaries ALTER COLUMN video_id SET NOT NULL;

-- Add index on video_id for fast lookups
CREATE INDEX idx_summaries_video_id ON summaries(video_id);

-- Add unique constraint on video_id
ALTER TABLE summaries ADD CONSTRAINT summaries_video_id_unique UNIQUE(video_id);
