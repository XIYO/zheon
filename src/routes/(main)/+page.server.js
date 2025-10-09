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

		// 2. Edge Function 호출 (Fire-and-Forget - 응답을 기다리지 않음)
		console.log(`📡 Triggering Edge Function for: ${youtubeUrl}`);

		try {
			// Edge Function을 백그라운드에서 실행 (응답 대기하지 않음)
			supabase.functions.invoke('summary', {
				body: { url: youtubeUrl }
			});

			const totalTime = Date.now() - requestStartTime;

			console.log(`✅ Edge Function triggered successfully:`, {
				totalTime: `${totalTime}ms`,
				youtubeUrl,
				timestamp: new Date().toISOString()
			});

			// 즉시 성공 응답 반환
			return {
				success: true,
				message: '요약 처리가 시작되었습니다. 잠시 후 완료됩니다.',
				youtubeUrl
			};
		} catch (error) {
			const totalTime = Date.now() - requestStartTime;

			console.error(`❌ Failed to trigger Edge Function:`, {
				error: error.message,
				totalTime: `${totalTime}ms`,
				timestamp: new Date().toISOString()
			});

			return fail(500, {
				message: '요약 처리 시작에 실패했습니다. 잠시 후 다시 시도해주세요.',
				type: 'trigger_error'
			});
		}
	}
};
