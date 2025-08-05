-- 공유 캐시 시스템을 위한 summary 테이블 구조 변경  
-- owners: 해당 영상을 요청한 모든 사용자들의 UUID 배열
-- 모든 요청자가 owner가 되어 공유 소유권을 가짐

-- 1. summary 테이블에 owners 컬럼 추가 (UUID 배열)
ALTER TABLE summary 
ADD COLUMN owners UUID[] DEFAULT '{}';

-- 2. 기존 user_id를 owners 배열로 변환 (기존 데이터 마이그레이션)
UPDATE summary 
SET owners = ARRAY[user_id] 
WHERE user_id IS NOT NULL AND owners = '{}';

-- 3. owners 컬럼을 NOT NULL로 설정
ALTER TABLE summary 
ALTER COLUMN owners SET NOT NULL;

-- 4. 기존 RLS 정책들 모두 삭제 (user_id 컬럼 의존성 제거)
DROP POLICY IF EXISTS "Users can view own summaries" ON summary;
DROP POLICY IF EXISTS "Users can insert own summaries" ON summary;  
DROP POLICY IF EXISTS "Users can update own summaries" ON summary;
DROP POLICY IF EXISTS "Authenticated users can insert their own summary records" ON summary;
DROP POLICY IF EXISTS "Authenticated users can update their own summary records" ON summary;
DROP POLICY IF EXISTS "Authenticated users can view their own summary records" ON summary;
DROP POLICY IF EXISTS "Users can read their own summaries" ON summary;
DROP POLICY IF EXISTS "Users can insert their own summaries" ON summary;
DROP POLICY IF EXISTS "Users can update their own summaries" ON summary;

-- 5. user_id 컬럼 제거 (이제 owners 배열만 사용)
ALTER TABLE summary 
DROP COLUMN user_id;

-- 6. 인덱스 최적화
DROP INDEX IF EXISTS idx_summary_user_id;
CREATE INDEX idx_summary_owners ON summary USING GIN(owners); -- 배열 검색을 위한 GIN 인덱스
CREATE UNIQUE INDEX idx_summary_url_unique ON summary(youtube_url);

-- 7. 새로운 RLS 정책 생성

-- 사용자가 owner인 요약만 볼 수 있음 (본인이 요청한 것만)
CREATE POLICY "Users can view summaries they own" ON summary
    FOR SELECT USING (auth.uid() = ANY(owners));

-- 인증된 사용자가 새 요약을 생성할 수 있음
CREATE POLICY "Authenticated users can insert summaries" ON summary
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- owner 중 하나인 사용자가 업데이트 가능 (주로 owners 배열 수정용)
CREATE POLICY "Owners can update summaries" ON summary
    FOR UPDATE USING (auth.uid() = ANY(owners));

-- owner 중 하나인 사용자가 삭제 가능 (본인을 owners에서 제거하거나 전체 삭제)
CREATE POLICY "Owners can delete summaries" ON summary
    FOR DELETE USING (auth.uid() = ANY(owners));

-- 8. 사용자 제거 함수 생성 (본인을 owners 배열에서 제거)
CREATE OR REPLACE FUNCTION remove_user_from_summary(summary_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    remaining_owners UUID[];
BEGIN
    -- 사용자가 실제로 owner인지 확인
    IF NOT EXISTS (
        SELECT 1 FROM summary 
        WHERE id = summary_id AND user_id = ANY(owners)
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- 사용자를 owners 배열에서 제거
    UPDATE summary 
    SET owners = array_remove(owners, user_id),
        updated_at = now()
    WHERE id = summary_id
    RETURNING owners INTO remaining_owners;
    
    -- owners 배열이 비어있으면 레코드 완전 삭제
    IF array_length(remaining_owners, 1) IS NULL OR array_length(remaining_owners, 1) = 0 THEN
        DELETE FROM summary WHERE id = summary_id;
    END IF;
    
    RETURN TRUE;
END;
$$;

-- 9. 사용자 추가 함수 생성 (중복 요청 시 owners 배열에 추가)
CREATE OR REPLACE FUNCTION add_user_to_summary(p_youtube_url TEXT, p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER  
AS $$
DECLARE
    existing_summary_id UUID;
BEGIN
    -- 기존 요약이 있는지 확인
    SELECT id INTO existing_summary_id 
    FROM summary 
    WHERE youtube_url = p_youtube_url;
    
    IF existing_summary_id IS NOT NULL THEN
        -- 사용자가 이미 owner가 아닌 경우에만 추가
        IF NOT EXISTS (
            SELECT 1 FROM summary 
            WHERE id = existing_summary_id AND p_user_id = ANY(owners)
        ) THEN
            UPDATE summary 
            SET owners = array_append(owners, p_user_id),
                created_at = now() -- 최상단으로 이동
            WHERE id = existing_summary_id;
        ELSE
            -- 이미 owner인 경우 created_at만 업데이트 (최상단 이동)
            UPDATE summary 
            SET created_at = now()
            WHERE id = existing_summary_id;
        END IF;
        
        RETURN existing_summary_id;
    END IF;
    
    RETURN NULL; -- 새로운 요약 생성 필요
END;
$$;