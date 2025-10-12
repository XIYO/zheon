-- YouTube 구독 목록 캐시 테이블
CREATE TABLE IF NOT EXISTS youtube_subscriptions_cache (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    subscriptions_data JSONB NOT NULL,
    cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_youtube_subscriptions_cache_user_id ON youtube_subscriptions_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_youtube_subscriptions_cache_expires_at ON youtube_subscriptions_cache(expires_at);

-- RLS 활성화
ALTER TABLE youtube_subscriptions_cache ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 본인의 캐시만 조회/수정 가능
CREATE POLICY "Users can view their own subscription cache"
    ON youtube_subscriptions_cache
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription cache"
    ON youtube_subscriptions_cache
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription cache"
    ON youtube_subscriptions_cache
    FOR UPDATE
    USING (auth.uid() = user_id);

-- 만료된 캐시 자동 삭제 함수 (선택사항)
CREATE OR REPLACE FUNCTION cleanup_expired_subscription_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM youtube_subscriptions_cache
    WHERE expires_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;
