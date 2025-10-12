-- 추천 채널 테이블
CREATE TABLE IF NOT EXISTS recommended_channels (
    id TEXT PRIMARY KEY,
    handle TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    thumbnail TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_recommended_channels_handle ON recommended_channels(handle);
CREATE INDEX IF NOT EXISTS idx_recommended_channels_created_at ON recommended_channels(created_at);

-- RLS 활성화
ALTER TABLE recommended_channels ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 모두가 조회 가능
CREATE POLICY "Anyone can view recommended channels"
    ON recommended_channels
    FOR SELECT
    USING (true);

-- RLS 정책: 인증된 사용자만 추가 가능
CREATE POLICY "Authenticated users can insert channels"
    ON recommended_channels
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- 기존 하드코딩된 추천 채널 시드 데이터
INSERT INTO recommended_channels (id, handle, name, description) VALUES
    ('UC8butISFwT-Wl7EV0hUK0BQ', '@freecodecamp', 'freeCodeCamp.org', '무료 코딩 튜토리얼과 프로그래밍 강의'),
    ('UCsBjURrPoezykLs9EqgamOA', '@fireship', 'Fireship', '빠르고 실용적인 웹 개발 튜토리얼'),
    ('UCW5YeuERMmlnqo4oq8vwUpg', '@NetNinja', 'The Net Ninja', '웹 개발 튜토리얼 (JavaScript, React, Vue 등)'),
    ('UCXgGY0wkgOzynnHvSEVmE3A', '@syntaxfm', 'Syntax', '웹 개발 팟캐스트 및 튜토리얼'),
    ('UC29ju8bIPH5as8OGnQzwJyA', '@TraversyMedia', 'Traversy Media', '웹 개발 및 프로그래밍 튜토리얼'),
    ('UCvjgXvBlbQiydffTwlWP1cA', '@ThePrimeTimeagen', 'ThePrimeagen', 'Vim, Neovim, 프로그래밍 생산성'),
    ('UCg6gPGh8HU2U01vaFCAsvmQ', '@chrispine', 'Chris Pine', '프로그래밍 기초 및 컴퓨터 과학'),
    ('UCFbNIlppjAuEX4znoulh0Cw', '@WebDevSimplified', 'Web Dev Simplified', '웹 개발을 쉽게 배우는 튜토리얼')
ON CONFLICT (id) DO NOTHING;
