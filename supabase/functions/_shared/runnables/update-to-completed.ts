/**
 * Completed 상태 업데이트 Runnable
 * 입력: { record_id: string, url: string, transcript: string, summary: string, title: string, insights: string, ... }
 * 출력: { record_id: string, saved_at: string }
 */

import { RunnableLambda } from "npm:@langchain/core/runnables";
import { createSupabaseClient } from "../supabase-client.ts";

export const updateToCompleted = RunnableLambda.from(
  async (input: {
    record_id: string;
    url: string;
    transcript: string;
    summary: string;
    insights?: string;
    summary_method: string;
    title?: string;
    _skip_processing?: boolean;
    _existing_record?: any;
  }) => {
    // 중복 레코드로 처리 스킵된 경우
    if (input._skip_processing && input._existing_record) {
      console.log(
        `[UpdateCompleted] ⏭️  Skipping update - using existing completed record (ID: ${input.record_id})`,
      );
      return {
        record_id: input.record_id,
        saved_at: input._existing_record.created_at,
        was_duplicate: true,
      };
    }

    console.log(
      `[UpdateCompleted] Updating record ${input.record_id} to completed...`,
    );

    const supabase = createSupabaseClient();

    try {
      // pending/processing 상태를 completed로 업데이트
      const { data, error } = await supabase
        .from("summary")
        .update({
          title: input.title || "YouTube Video Summary",
          transcript: input.transcript,
          summary: input.summary,
          insights: input.insights || "",
          processing_status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.record_id)
        .select()
        .single();

      if (error) {
        throw new Error(
          `Failed to update record to completed: ${error.message}`,
        );
      }

      console.log(
        `[UpdateCompleted] ✅ Record ${input.record_id} marked as completed`,
      );

      return {
        record_id: data.id,
        saved_at: data.updated_at,
        was_duplicate: false,
      };
    } catch (error) {
      console.error(`[UpdateCompleted] ❌ Error:`, error);
      throw error;
    }
  },
);
