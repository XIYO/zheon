-- Add thumbnail_url column to summary table
ALTER TABLE summary
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Add index for thumbnail_url
CREATE INDEX IF NOT EXISTS idx_summary_thumbnail_url ON summary(thumbnail_url) WHERE thumbnail_url IS NOT NULL;

-- Add comment
COMMENT ON COLUMN summary.thumbnail_url IS 'YouTube video thumbnail URL (maxresdefault quality)';
