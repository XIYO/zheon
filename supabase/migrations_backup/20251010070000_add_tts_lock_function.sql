-- RPC 함수: TTS 생성을 위한 원자적 락 획득
CREATE OR REPLACE FUNCTION try_acquire_tts_lock(
    p_summary_id UUID,
    p_section TEXT,
    p_lock_key BIGINT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_status_column TEXT;
    v_current_status TEXT;
    v_lock_acquired BOOLEAN;
BEGIN
    -- 섹션에 따른 컬럼명 결정
    v_status_column := p_section || '_audio_status';

    -- Advisory lock 시도 (non-blocking)
    v_lock_acquired := pg_try_advisory_lock(p_lock_key);

    IF NOT v_lock_acquired THEN
        -- 락 획득 실패
        RETURN FALSE;
    END IF;

    -- 현재 상태 확인
    EXECUTE format('SELECT %I FROM summary WHERE id = $1', v_status_column)
    INTO v_current_status
    USING p_summary_id;

    -- 이미 processing이거나 completed면 락 해제하고 실패 반환
    IF v_current_status = 'processing' OR v_current_status = 'completed' THEN
        PERFORM pg_advisory_unlock(p_lock_key);
        RETURN FALSE;
    END IF;

    -- status를 'processing'으로 업데이트
    EXECUTE format('UPDATE summary SET %I = ''processing'' WHERE id = $1', v_status_column)
    USING p_summary_id;

    -- 락은 유지 (트랜잭션 종료 시 자동 해제)
    RETURN TRUE;
END;
$$;

-- 함수에 주석 추가
COMMENT ON FUNCTION try_acquire_tts_lock IS 'Atomically acquire lock for TTS generation using advisory locks';
