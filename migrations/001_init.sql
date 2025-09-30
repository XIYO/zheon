PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    email_verified INTEGER NOT NULL DEFAULT 0,
    display_name TEXT,
    picture_url TEXT,
    locale TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    active_expires INTEGER NOT NULL,
    idle_expires INTEGER NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id
    ON sessions(user_id);

CREATE TABLE IF NOT EXISTS keys (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    hashed_password TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_keys_user_id
    ON keys(user_id);

CREATE TABLE IF NOT EXISTS google_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    google_user_id TEXT NOT NULL,
    email TEXT,
    email_verified INTEGER NOT NULL DEFAULT 0,
    given_name TEXT,
    family_name TEXT,
    picture_url TEXT,
    locale TEXT,
    access_token TEXT,
    refresh_token TEXT,
    access_token_expires_at INTEGER,
    scope TEXT,
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (google_user_id),
    UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    url TEXT NOT NULL,
    title TEXT,
    summary TEXT,
    content TEXT,
    lang TEXT DEFAULT 'ko',
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
    last_modified_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_summaries_url
    ON summaries(url);

CREATE INDEX IF NOT EXISTS idx_summaries_user_id
    ON summaries(user_id);

INSERT OR IGNORE INTO users (id, email, email_verified, display_name, locale)
VALUES ('user_demo', 'demo@example.com', 1, '데모 사용자', 'ko');

INSERT OR IGNORE INTO keys (id, user_id, hashed_password)
VALUES ('email:demo@example.com', 'user_demo', '$argon2id$v=19$m=19456,t=2,p=1$ntvEg3j4ILtUzmg4TFMyOg$0wDZPxribsYKZWhQ1/uND1lWE5fcV5O/6c225NVabQk');

INSERT OR IGNORE INTO summaries (user_id, url, title, summary, content, lang)
VALUES (
    'user_demo',
    'https://youtu.be/dQw4w9WgXcQ',
    '샘플 요약 비디오',
    '이 데이터는 Lucia 인증 마이그레이션을 위한 데모용입니다.',
    '데모 계정에서 생성된 요약 본문입니다. OAuth 마이그레이션 이후에도 리스트가 정상 작동하는지 확인하세요.',
    'ko'
);
