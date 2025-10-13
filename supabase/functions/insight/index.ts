import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsValidation, corsError } from '../_shared/cors.ts';
import { fetchTranscript } from './transcript-fetcher.ts';
import { generateInsight } from './insight-generator.ts';
import { markAsProcessing, saveInsightResult, markAsFailed } from './record-manager.ts';

console.log('🧠 Insight Webhook Function Started');

Deno.serve(async (req) => {
  const validation = corsValidation(req, ['POST']);
  if (validation) return validation;

  try {
    const body = await req.json();
    const record_id = body.record!.id!;
    const url = body.record!.url!;

    console.log(`🚀 Webhook triggered: record_id=${record_id}, url=${url}`);

    // 백그라운드 처리 시작
    setTimeout(async () => {
      try {
        console.log(`[Insight] Starting background processing for ${record_id}`);

        // 1. pending → processing 상태 변경
        await markAsProcessing(record_id);

        // 2. 자막 추출
        const { transcript } = await fetchTranscript(url);

        // 3. AI 인사이트 생성
        const { title, summary, insights } = await generateInsight(transcript);

        // 4. processing → completed 상태로 저장
        await saveInsightResult(record_id, {
          title,
          transcript,
          summary,
          insights,
        });

        console.log(`[Insight] ✅ Completed processing for ${record_id}`);
      } catch (error) {
        console.error(`[Insight] ❌ Error processing ${record_id}:`, error);
        // → failed 상태로 변경
        await markAsFailed(
          record_id,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }, 0);

    // 즉시 수락 응답
    return new Response(null, { status: 202 });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return corsError(
      error instanceof Error ? error.message : 'Webhook processing failed',
      'WEBHOOK_ERROR',
      500
    );
  }
});
