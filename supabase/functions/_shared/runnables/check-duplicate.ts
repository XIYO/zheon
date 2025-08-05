/**
 * 중복 URL 체크 Runnable (공개 캐시 시스템)
 * 입력: { url: string }
 * 출력: 입력 데이터 그대로 또는 기존 레코드 정보
 */

import { RunnableLambda } from "npm:@langchain/core/runnables";
import { createSupabaseClient } from "../supabase-client.ts";

export const checkDuplicate = RunnableLambda.from(
  async (input: { url: string }) => {
    console.log(`[Check] Checking for duplicate URL in public cache system...`);
    
    const supabase = createSupabaseClient();
    
    // RPC 함수로 중복 체크 및 타임스탬프 업데이트 (원자적 처리)
    const { data: existingId, error } = await supabase
      .rpc('check_existing_summary', {
        p_youtube_url: input.url
      });
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    if (existingId) {
      console.log(`[Check] 🔄 Found existing summary (ID: ${existingId}), timestamps updated`);
      
      // 기존 레코드 정보 가져오기
      const { data: existingRecord, error: fetchError } = await supabase
        .from("summary")
        .select("id, created_at")
        .eq("id", existingId)
        .single();
      
      if (fetchError) {
        console.log(`[Check] ⚠️ Failed to fetch existing record: ${fetchError.message}`);
      }
      
      // subtitles 테이블도 확인해서 업데이트 (최상단 이동)
      const { data: subtitleRecord, error: subtitleError } = await supabase
        .from("subtitles")
        .select("id")
        .eq("url", input.url)
        .limit(1);
        
      if (!subtitleError && subtitleRecord && subtitleRecord.length > 0) {
        await supabase
          .from("subtitles")
          .update({ created_at: new Date().toISOString() })
          .eq("id", subtitleRecord[0].id);
        console.log(`[Check] ✅ Also updated subtitles record timestamp`);
      }
      
      // 기존 레코드 정보와 함께 특별한 플래그를 추가해서 반환
      return {
        ...input,
        _existing_record: existingRecord || { id: existingId },
        _skip_save: true // 저장 단계에서 스킵하도록 플래그 추가
      };
    }
    
    console.log(`[Check] ✅ No existing summary found, proceeding with new creation`);
    
    // 입력 데이터를 그대로 다음 단계로 전달
    return input;
  }
);