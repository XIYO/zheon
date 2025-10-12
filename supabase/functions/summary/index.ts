import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsValidation, corsError } from '../_shared/cors.ts';
import { validateUrl } from '../_shared/runnables/validate-url.ts';
import { createPendingRecord } from '../_shared/runnables/create-pending-record.ts';

console.log('🦜 Summary UPSERT Function Started');

Deno.serve(async (req) => {
	const validation = corsValidation(req, ['POST']);
	if (validation) return validation;

	try {
		let url: string | undefined;

		// Content-Type에 따라 다르게 처리
		const contentType = req.headers.get('content-type') || '';

		if (contentType.includes('multipart/form-data')) {
			const formData = await req.formData();
			url = formData.get('url') as string;
		} else if (contentType.includes('application/x-www-form-urlencoded')) {
			const text = await req.text();
			const params = new URLSearchParams(text);
			url = params.get('url') || undefined;
		} else {
			const body = await req.json().catch(() => ({}));
			url = body.url;
		}

		if (!url) {
			return corsError('URL is required', 'MISSING_URL', 400);
		}

		console.log(`🚀 UPSERT: ${url}`);

		// URL 검증 및 UPSERT만 수행
		const recordPipeline = validateUrl.pipe(createPendingRecord);
		const recordResult = await recordPipeline.invoke({ url });

		console.log(`📝 Record upserted: ${recordResult.record_id}`);

		// 즉시 204 응답 (Webhook이 처리 담당)
		return new Response(null, { status: 204 });
	} catch (error) {
		console.error('❌ UPSERT error:', error);

		if (error instanceof Error && error.message.includes('Unsupported URL')) {
			return corsError(error.message, 'UNSUPPORTED_URL', 400);
		}

		if (
			error instanceof Error &&
			(error.message.includes('Invalid URL') || error.message.includes('Could not extract'))
		) {
			return corsError(error.message, 'INVALID_URL', 400);
		}

		return corsError(
			error instanceof Error ? error.message : 'UPSERT failed',
			'UPSERT_ERROR',
			500
		);
	}
});
