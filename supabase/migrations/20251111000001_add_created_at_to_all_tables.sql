ALTER TABLE channels ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
UPDATE channels SET created_at = COALESCE(updated_at, NOW()) WHERE created_at IS NULL;
ALTER TABLE channels ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE videos ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
UPDATE videos SET created_at = COALESCE(updated_at, NOW()) WHERE created_at IS NULL;
ALTER TABLE videos ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
UPDATE profiles SET created_at = COALESCE(updated_at, NOW()) WHERE created_at IS NULL;
ALTER TABLE profiles ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE subscriptions ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
UPDATE subscriptions SET created_at = COALESCE(updated_at, NOW()) WHERE created_at IS NULL;
ALTER TABLE subscriptions ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE comments ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
UPDATE comments SET created_at = COALESCE(updated_at, NOW()) WHERE created_at IS NULL;
ALTER TABLE comments ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE transcripts ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
UPDATE transcripts SET created_at = COALESCE(updated_at, NOW()) WHERE created_at IS NULL;
ALTER TABLE transcripts ALTER COLUMN created_at SET NOT NULL;
