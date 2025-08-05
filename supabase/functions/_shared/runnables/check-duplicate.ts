/**
 * 중복 URL 체크 Runnable
 * 입력: { youtube_url: string }
 * 출력: 입력 데이터 그대로 (중복 시 에러 발생)
 */

import { RunnableLambda } from "npm:@langchain/core/runnables";
import { createSupabaseClient } from "../supabase-client.ts";

export const checkDuplicate = RunnableLambda.from(
  async (input: { youtube_url: string }) => {
    console.log(`[Check] Checking for duplicate URL...`);
    
    const supabase = createSupabaseClient();
    
    // 기존 레코드 확인 (subtitles 테이블 사용)
    const { data: existing, error } = await supabase
      .from("subtitles")
      .select("id, created_at")
      .eq("youtube_url", input.youtube_url)
      .limit(1);
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    if (existing && existing.length > 0) {
      console.log(`[Check] 🔄 Duplicate found: ${existing[0].id}, updating created_at to move to top...`);
      
      // 기존 레코드의 created_at을 현재 시간으로 업데이트 (최신 순으로 정렬되도록)
      const { error: updateError } = await supabase
        .from("subtitles")
        .update({ created_at: new Date().toISOString() })
        .eq("id", existing[0].id);
      
      if (updateError) {
        console.log(`[Check] ⚠️ Failed to update timestamp: ${updateError.message}`);
      } else {
        console.log(`[Check] ✅ Updated created_at for existing record (moved to top)`);
      }
      
      // 기존 레코드 정보와 함께 특별한 플래그를 추가해서 반환
      return {
        ...input,
        _existing_record: existing[0],
        _skip_save: true // 저장 단계에서 스킵하도록 플래그 추가
      };
    }
    
    console.log(`[Check] ✅ No duplicate found`);
    
    // 입력 데이터를 그대로 다음 단계로 전달
    return input;
  }
);