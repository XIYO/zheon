-- 기존 함수 삭제
DROP FUNCTION IF EXISTS try_acquire_tts_lock(UUID, TEXT, BIGINT);

-- 더 간단한 UPDATE 기반 락 함수
CREATE OR REPLACE FUNCTION update_processing_status(
    p_summary_id UUID,
    p_section TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_status_column TEXT;
    v_rows_updated INTEGER;
BEGIN
    -- 섹션에 따른 컬럼명 결정
    v_status_column := p_section || '_audio_status';

    -- 원자적 UPDATE: status가 NULL이거나 'failed'일 때만 'processing'으로 변경
    EXECUTE format(
        'UPDATE summary
         SET %I = ''processing''
         WHERE id = $1
         AND (%I IS NULL OR %I = ''failed'')',
        v_status_column, v_status_column, v_status_column
    ) USING p_summary_id;

    -- 업데이트된 행 수 확인
    GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

    -- 1개 이상 업데이트되었으면 성공 (락 획득)
    RETURN v_rows_updated > 0;
END;
$$;

COMMENT ON FUNCTION update_processing_status IS 'Atomically update status to processing if available';
