-- summary 테이블을 공개 데이터로 변경 (RLS 비활성화)
ALTER TABLE summary DISABLE ROW LEVEL SECURITY;

-- 기존 RLS 정책 모두 삭제
DROP POLICY IF EXISTS "Users can view own summaries" ON summary;
DROP POLICY IF EXISTS "Users can insert own summaries" ON summary;
DROP POLICY IF EXISTS "Users can update own summaries" ON summary;
DROP POLICY IF EXISTS "Users can delete own summaries" ON summary;

-- 또는 모든 정책 삭제 (이름 상관없이)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'summary')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON summary', r.policyname);
    END LOOP;
END $$;

COMMENT ON TABLE summary IS 'Public video summaries - accessible to all users';
