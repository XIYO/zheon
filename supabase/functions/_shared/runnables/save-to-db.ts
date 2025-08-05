/**
 * 데이터베이스 저장 Runnable
 * 입력: { youtube_url: string, transcript: string, summary: string, ... }
 * 출력: { record_id: string } (최종 결과)
 */

import { RunnableLambda } from "npm:@langchain/core/runnables";
import { createSupabaseClient } from "../supabase-client.ts";

export const saveToDB = RunnableLambda.from(
  async (input: { 
    youtube_url: string; 
    transcript: string;
    summary: string;
    summary_method: string;
    _skip_save?: boolean;
    _existing_record?: any;
  }) => {
    console.log(`[Save] Storing to database...`);
    
    // 중복 레코드가 이미 업데이트되었으면 저장 스킵
    if (input._skip_save && input._existing_record) {
      console.log(`[Save] ✅ Skipping save - existing record updated (ID: ${input._existing_record.id})`);
      return {
        record_id: input._existing_record.id,
        saved_at: new Date().toISOString(), // 업데이트된 시간
        was_duplicate: true
      };
    }
    
    const supabase = createSupabaseClient();
    
    // subtitles 테이블에 저장 (새로운 레코드만)
    const { data, error } = await supabase
      .from("subtitles")
      .insert({
        youtube_url: input.youtube_url,
        subtitle: input.transcript,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    console.log(`[Save] ✅ Saved new record with ID: ${data.id}`);
    
    // 최종 결과 (필요한 정보만)
    return {
      record_id: data.id,
      saved_at: data.created_at,
      was_duplicate: false
    };
  }
);