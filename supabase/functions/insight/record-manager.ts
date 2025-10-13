/**
 * summary 테이블 레코드 상태 관리
 * pending → processing → completed/failed
 */

import { createSupabaseClient } from '../_shared/supabase-client.ts';

export async function markAsProcessing(record_id: string): Promise<void> {
  console.log(`[Record Manager] Marking as processing: ${record_id}`);

  const supabase = createSupabaseClient();

  const { error } = await supabase
    .from('summary')
    .update({
      processing_status: 'processing',
      updated_at: new Date().toISOString(),
    })
    .eq('id', record_id);

  if (error) {
    throw new Error(`Failed to mark as processing: ${error.message}`);
  }

  console.log(`[Record Manager] ✅ Record marked as processing: ${record_id}`);
}

export async function saveInsightResult(
  record_id: string,
  data: {
    title: string;
    transcript: string;
    summary: string;
    insights: string;
  }
): Promise<void> {
  console.log(`[Record Manager] Saving insight result for: ${record_id}`);

  const supabase = createSupabaseClient();

  const { error } = await supabase
    .from('summary')
    .update({
      title: data.title,
      transcript: data.transcript,
      summary: data.summary,
      insights: data.insights,
      processing_status: 'completed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', record_id);

  if (error) {
    throw new Error(`Failed to save insight result: ${error.message}`);
  }

  console.log(`[Record Manager] ✅ Record marked as completed: ${record_id}`);
}

export async function markAsFailed(record_id: string, errorMessage: string): Promise<void> {
  console.log(`[Record Manager] Marking record as failed: ${record_id}`);

  const supabase = createSupabaseClient();

  const { error } = await supabase
    .from('summary')
    .update({
      processing_status: 'failed',
      summary: `처리 실패: ${errorMessage}`,
      updated_at: new Date().toISOString(),
    })
    .eq('id', record_id);

  if (error) {
    console.error(`[Record Manager] Failed to update failed status: ${error.message}`);
  }

  console.log(`[Record Manager] ✅ Record marked as failed: ${record_id}`);
}
