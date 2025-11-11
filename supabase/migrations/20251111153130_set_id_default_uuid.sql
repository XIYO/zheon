-- Set default UUID generation for summaries.id column
ALTER TABLE summaries ALTER COLUMN id SET DEFAULT gen_random_uuid();
