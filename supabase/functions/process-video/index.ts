import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsValidation, corsResponse, corsError } from '../_shared/cors.ts';
import { extractSubtitles } from '../_shared/runnables/extract-subtitles.ts';
import { generateSummary } from '../_shared/runnables/generate-summary.ts';
import { updateToCompleted } from '../_shared/runnables/update-to-completed.ts';
import { updateToFailed } from '../_shared/runnables/update-to-failed.ts';

console.log('🎬 Process Video Function Started');

interface WebhookPayload {
	type: 'INSERT' | 'UPDATE' | 'DELETE';
	table: string;
	schema: string;
	record: {
		id: string;
		url: string;
		processing_status: string;
	};
	old_record: null | Record<string, unknown>;
}

Deno.serve(async (req) => {
	const validation = corsValidation(req, ['POST']);
	if (validation) return validation;

	let recordId: string | undefined;

	try {
		const payload: WebhookPayload = await req.json();

		console.log(`🔔 Webhook received: ${payload.type} on ${payload.table}`);

		if (payload.type !== 'INSERT' && payload.type !== 'UPDATE') {
			console.log(`⏭️  Skipping ${payload.type} event`);
			return corsResponse({ success: true, skipped: true });
		}

		if (payload.record.processing_status !== 'pending') {
			console.log(`⏭️  Skipping non-pending status: ${payload.record.processing_status}`);
			return corsResponse({ success: true, skipped: true });
		}

		recordId = payload.record.id;
		const url = payload.record.url;

		console.log(`🚀 Processing video: ${url} (record: ${recordId})`);

		const processingPipeline = extractSubtitles.pipe(generateSummary).pipe(updateToCompleted);

		await processingPipeline.invoke({
			url,
			record_id: recordId
		});

		console.log(`✅ Processing completed: ${recordId}`);

		return corsResponse({ success: true, record_id: recordId });
	} catch (error) {
		console.error('❌ Processing error:', error);

		if (recordId) {
			console.log(`🔄 Updating to failed: ${recordId}`);
			await updateToFailed(recordId, error instanceof Error ? error : new Error(String(error)));
		}

		return corsError(
			error instanceof Error ? error.message : 'Processing failed',
			'PROCESSING_ERROR',
			500
		);
	}
});
