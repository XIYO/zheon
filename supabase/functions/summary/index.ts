import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsValidation, corsResponse, corsError } from '../_shared/cors.ts';
import { createSupabaseClient } from '../_shared/supabase-client.ts';
import { validateUrl } from '../_shared/runnables/validate-url.ts';
import { createPendingRecord } from '../_shared/runnables/create-pending-record.ts';
import { extractSubtitles } from '../_shared/runnables/extract-subtitles.ts';
import { generateSummary } from '../_shared/runnables/generate-summary.ts';
import { updateToCompleted } from '../_shared/runnables/update-to-completed.ts';
import { updateToFailed } from '../_shared/runnables/update-to-failed.ts';

console.log('🦜 Summary Pipeline Started');

Deno.serve(async (req) => {
	const validation = corsValidation(req, ['POST']);
	if (validation) return validation;

	let recordId: string | undefined;

	try {
		let url: string | undefined;

		// Content-Type에 따라 다르게 처리
		const contentType = req.headers.get('content-type') || '';

		if (contentType.includes('multipart/form-data')) {
			// FormData로 전송된 경우
			const formData = await req.formData();
			url = formData.get('url') as string;
		} else if (contentType.includes('application/x-www-form-urlencoded')) {
			// URL encoded form으로 전송된 경우
			const text = await req.text();
			const params = new URLSearchParams(text);
			url = params.get('url') || undefined;
		} else {
			// JSON으로 전송된 경우 (기존 방식)
			const body = await req.json().catch(() => ({}));
			url = body.url;
		}

		if (!url) {
			return corsError('URL is required', 'MISSING_URL', 400);
		}

		console.log(`🚀 Processing: ${url}`);

		// Step 1: URL 검증 및 Pending 레코드 생성 (중복 체크 포함)
		const recordPipeline = validateUrl.pipe(createPendingRecord);
		const recordResult = await recordPipeline.invoke({ url });

		// record_id 저장 (이후 에러 발생 시 failed 상태로 업데이트하기 위함)
		recordId = recordResult.record_id;
		console.log(`📝 Record created/found: ${recordId}`);

		// 중복된 완료 레코드인 경우 파이프라인 스킵
		if (recordResult._skip_processing) {
			console.log('⏭️ Skipping processing - using existing completed record');
			return corsResponse({
				status: 'success',
				message: 'Using cached summary',
				debug: {
					record_id: recordId,
					saved_at: recordResult._existing_record?.created_at,
					was_duplicate: true
				}
			});
		}

		// Step 2: 자막 추출 → AI 요약 → Completed 업데이트
		const processingPipeline = extractSubtitles.pipe(generateSummary).pipe(updateToCompleted);
		const result = await processingPipeline.invoke(recordResult);

		console.log('🎯 Pipeline result:', result);

		// 간단한 성공 응답
		return corsResponse({
			status: 'success',
			message: result?.was_duplicate ? 'Using cached summary' : 'Video processed successfully',
			debug: {
				record_id: result?.record_id,
				saved_at: result?.saved_at,
				was_duplicate: result?.was_duplicate || false
			}
		});
	} catch (error) {
		console.error('❌ Pipeline error:', error);

		// record_id가 있으면 failed 상태로 업데이트
		console.log(`🔍 Debug: recordId = ${recordId}, type = ${typeof recordId}`);
		if (recordId) {
			console.log(`🔄 Calling updateToFailed for record: ${recordId}`);
			await updateToFailed(recordId, error instanceof Error ? error : new Error(String(error)));
			console.log(`✅ updateToFailed completed for record: ${recordId}`);
		} else {
			console.warn(`⚠️  recordId is ${recordId}, skipping updateToFailed`);
		}

		// 지원하지 않는 URL 에러인 경우 400 Bad Request 반환
		if (error instanceof Error && error.message.includes('Unsupported URL')) {
			return corsError(error.message, 'UNSUPPORTED_URL', 400);
		}

		// Invalid URL 에러인 경우 400 Bad Request 반환
		if (
			error instanceof Error &&
			(error.message.includes('Invalid URL') || error.message.includes('Could not extract'))
		) {
			return corsError(error.message, 'INVALID_URL', 400);
		}

		return corsError(
			error instanceof Error ? error.message : 'Pipeline failed',
			'PIPELINE_ERROR',
			500
		);
	}
});
