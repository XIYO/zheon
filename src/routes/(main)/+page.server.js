import { fail, redirect } from '@sveltejs/kit';
import { urlSchema } from '$lib/schemas/url.js';

export const actions = {
	summarize: async ({ request, locals: { supabase }, url }) => {
		const requestStartTime = Date.now();
		console.log(`🚀 Main page request started:`, {
			timestamp: new Date().toISOString(),
			userAgent: request.headers.get('user-agent'),
			referer: request.headers.get('referer')
		});

		// 1. 폼 데이터 검증
		const formData = await request.formData();
		const youtubeUrl = formData.get('youtubeUrl')?.toString().trim();

		// URL 스키마로 검증
		const validation = urlSchema.safeParse(youtubeUrl);
		if (!validation.success) {
			return fail(400, {
				message: validation.error.errors[0].message,
				type: 'validation_error'
			});
		}

		// 2. Edge Function 호출 (공개 시스템)
		console.log(`📡 Calling Edge Function for: ${youtubeUrl}`);
		const edgeStartTime = Date.now();

		try {
			const { data, error } = await supabase.functions.invoke('summary', {
				body: { url: youtubeUrl }
			});

			const edgeTime = Date.now() - edgeStartTime;
			const totalTime = Date.now() - requestStartTime;

			if (error) {
				// 에러 상세 정보 추출
				let errorDetails = { message: error.message, code: 'UNKNOWN' };

				if (error.context) {
					try {
						const errorBody = await error.context.text();
						const parsedError = JSON.parse(errorBody);
						errorDetails = {
							message: parsedError.error || error.message,
							code: parsedError.code || 'UNKNOWN'
						};
					} catch {
						// JSON 파싱 실패 시 기본 에러 메시지 사용
					}
				}

				console.error(`❌ Edge Function error:`, {
					error: errorDetails,
					edgeTime: `${edgeTime}ms`,
					totalTime: `${totalTime}ms`,
					timestamp: new Date().toISOString()
				});

				// 구체적인 에러 타입별 처리
				if (errorDetails.message?.includes('Rate limit')) {
					return fail(429, {
						message: '서버가 바쁩니다. 잠시 후 다시 시도해주세요.',
						type: 'rate_limit',
						retryAfter: 300
					});
				}

				if (errorDetails.message?.includes('Failed to extract video data')) {
					return fail(400, {
						message:
							'이 영상의 자막을 추출할 수 없습니다. 영어 자막이 있는 다른 영상을 시도해보세요.',
						type: 'subtitle_extraction_error'
					});
				}

				if (errorDetails.code === 'PIPELINE_ERROR') {
					return fail(400, {
						message: '영상 처리 중 오류가 발생했습니다. 다른 영상을 시도해보세요.',
						type: 'pipeline_error'
					});
				}

				// 기타 에러
				return fail(400, {
					message: errorDetails.message || 'AI 처리 중 오류가 발생했습니다.',
					type: 'edge_function_error'
				});
			}

			// 성공적인 응답 처리
			if (data?.status === 'success') {
				const recordId = data.debug?.record_id || data.record_id;
				const wasDuplicate = data.debug?.was_duplicate || data.was_duplicate || false;

				console.log(`✅ Edge Function completed successfully:`, {
					edgeTime: `${edgeTime}ms`,
					totalTime: `${totalTime}ms`,
					recordId,
					wasDuplicate,
					timestamp: new Date().toISOString()
				});

				// 중복 처리된 경우와 새로 생성된 경우 구분
				return {
					success: true,
					fromCache: wasDuplicate,
					recordId
				};
			}

			// 예상치 못한 응답 형태
			console.error(`❌ Unexpected Edge Function response:`, data);
			return fail(500, {
				message: '예상치 못한 응답 형태입니다.',
				type: 'unexpected_response'
			});
		} catch (fetchError) {
			const edgeTime = Date.now() - edgeStartTime;
			const totalTime = Date.now() - requestStartTime;

			console.error(`❌ Edge Function call failed:`, {
				error: fetchError.message,
				edgeTime: `${edgeTime}ms`,
				totalTime: `${totalTime}ms`,
				timestamp: new Date().toISOString()
			});

			return fail(500, {
				message: 'AI 서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.',
				type: 'network_error'
			});
		}
	}
};
