ALTER TABLE summaries ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();

UPDATE summaries SET created_at = COALESCE(updated_at, NOW()) WHERE created_at IS NULL;

ALTER TABLE summaries ALTER COLUMN created_at SET NOT NULL;
