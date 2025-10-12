/**
 * Failed 상태 업데이트 Runnable (에러 핸들링용)
 * 입력: { record_id: string, error: Error }
 * 출력: { record_id: string, failed_at: string, error_message: string }
 */

import { RunnableLambda } from "npm:@langchain/core/runnables";
import { createSupabaseClient } from "../supabase-client.ts";

export const updateToFailed = async (
  recordId: string,
  error: Error,
): Promise<void> => {
  console.log(`[UpdateFailed] Marking record ${recordId} as failed...`);

  const supabase = createSupabaseClient();

  try {
    const { error: updateError } = await supabase
      .from("summary")
      .update({
        processing_status: "failed",
        summary: `Processing failed: ${error.message}`,
        transcript: `Error: ${error.message}\n\nStack: ${
          error.stack || "No stack trace"
        }`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", recordId);

    if (updateError) {
      console.error(
        `[UpdateFailed] ⚠️  Failed to update record status:`,
        updateError,
      );
      return;
    }

    console.log(`[UpdateFailed] ✅ Record ${recordId} marked as failed`);
  } catch (err) {
    console.error(`[UpdateFailed] ❌ Unexpected error:`, err);
  }
};
