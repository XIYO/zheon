import { summarizeTranscript } from '$lib/server/summary-claude.js';
import { fail, redirect } from '@sveltejs/kit';

// 유틸리티 함수들 임포트
import { validateAndNormalizeUrl } from '$lib/server/youtube-utils.js';
import { validateUser } from '$lib/server/auth-utils.js';
import { handleError, handleSubtitleError } from '$lib/server/error-utils.js';
import {
	getOrCacheSubtitle,
	processSubtitle
} from '$lib/server/subtitle-service.js';
import { upsertSummary, getExistingSummary } from '$lib/server/summary-service.js';
import {
	validateYouTubeUrlFromForm
} from '$lib/server/validation-utils.js';

export const actions = {
	default: async ({ url, request, locals: { supabase, user } }) => {
		const requestStartTime = Date.now();
		console.log(`🚀 Dashboard request started:`, {
			timestamp: new Date().toISOString(),
			userAgent: request.headers.get('user-agent'),
			referer: request.headers.get('referer')
		});
		// 1. 사용자 인증 검증
		try {
			validateUser(user, url);
		} catch {
			return redirect(303, `/auth/sign-in?redirectTo=${url.pathname}${url.search}`);
		}

		// user가 null이 아님을 보장 (validateUser에서 이미 검증됨)
		if (!user) {
			return fail(400, { error: 'User is not authenticated.' });
		}

		// 2. 폼 데이터 검증
		const formData = await request.formData();
		let youtubeUrl;

		try {
			youtubeUrl = validateYouTubeUrlFromForm(formData);
			// 언어 파라미터 제거 - 항상 영어 자막 추출 후 한국어로 요약
		} catch (error) {
			return fail(400, handleError(error));
		}

		// 3. YouTube URL 정규화
		let normalizedUrl;
		try {
			normalizedUrl = validateAndNormalizeUrl(youtubeUrl);
		} catch (error) {
			return fail(400, handleError(error));
		}

		// 4. 기존 요약 있는지 먼저 확인 (429 에러 방지)
		// 언어는 항상 'ko' 고정 (영어 자막을 한국어로 요약)
		const lang = 'ko';
		const dbCheckStartTime = Date.now();
		console.log(`📄 Checking existing summary for: ${normalizedUrl} (Korean output)`);
		
		const existingSummary = await getExistingSummary(normalizedUrl, lang, user.id, supabase);
		const dbCheckTime = Date.now() - dbCheckStartTime;
		
		if (existingSummary) {
			// 이미 요약이 있으면 자막 추출 없이 바로 반환
			const totalTime = Date.now() - requestStartTime;
			console.log(`✅ Existing summary found - fast path:`, {
				url: normalizedUrl,
				dbCheckTime: `${dbCheckTime}ms`,
				totalTime: `${totalTime}ms`,
				summaryId: existingSummary.id,
				timestamp: new Date().toISOString()
			});
			return { summary: existingSummary, fromCache: true };
		}

		// 5. 새로운 영상만 자막 추출 시도
		console.log(`🎆 New video detected - full processing path:`, {
			url: normalizedUrl,
			dbCheckTime: `${dbCheckTime}ms`,
			timestamp: new Date().toISOString()
		});
		
		const subtitleStartTime = Date.now();
		const subtitleResult = await getOrCacheSubtitle(normalizedUrl); // 언어 파라미터 제거
		const subtitleTime = Date.now() - subtitleStartTime;
		
		if (!subtitleResult.success) {
			const error = subtitleResult.error;
			
			// Rate Limit 에러에 대한 특별 처리
			if (error?.type === 'RATE_LIMIT') {
				return fail(429, {
					message: error.message,
					type: 'rate_limit',
					retryAfter: 300 // 5분 후 재시도 권장
				});
			}
			
			// 기타 에러들
			return fail(400, {
				message: error?.message || '자막 추출에 실패했습니다.',
				type: error?.type?.toLowerCase() || 'extraction_error'
			});
		}

		// 6. 자막 처리 및 검증
		let transcript;
		try {
			transcript = processSubtitle(subtitleResult.subtitle);
			console.log(`📝 Subtitle processed:`, {
				subtitleTime: `${subtitleTime}ms`,
				transcriptLength: transcript.length,
				timestamp: new Date().toISOString()
			});
		} catch (error) {
			return fail(400, handleSubtitleError(error));
		}

		// 7. 요약 생성 (영어 자막을 한국어로 번역 및 요약)
		const summaryStartTime = Date.now();
		const { title, summary, content } = await summarizeTranscript(transcript); // lang 파라미터 제거
		const summaryTime = Date.now() - summaryStartTime;

		// 8. 새로운 요약 저장
		try {
			const dbSaveStartTime = Date.now();
			const summaryData = await upsertSummary(
				normalizedUrl, // 정규화된 URL 사용
				lang, // 항상 'ko'
				title,
				summary,
				content,
				user.id,
				supabase
			);
			const dbSaveTime = Date.now() - dbSaveStartTime;
			const totalTime = Date.now() - requestStartTime;

			console.log(`✅ New summary created - complete processing:`, {
				url: normalizedUrl,
				dbCheckTime: `${dbCheckTime}ms`,
				subtitleTime: `${subtitleTime}ms`,
				summaryTime: `${summaryTime}ms`,
				dbSaveTime: `${dbSaveTime}ms`,
				totalTime: `${totalTime}ms`,
				summaryId: summaryData.id,
				titleLength: title.length,
				summaryLength: summary.length,
				contentLength: content.length,
				timestamp: new Date().toISOString()
			});
			
			return { summary: summaryData, fromCache: false };
		} catch (error) {
			return fail(500, handleError(error));
		}
	}
};
