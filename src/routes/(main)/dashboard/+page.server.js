import { summarizeTranscript } from '$lib/server/summary-claude.js';
import { fail, redirect } from '@sveltejs/kit';

// 유틸리티 함수들 임포트
import { validateAndNormalizeUrl } from '$lib/server/youtube-utils.js';
import { validateUser } from '$lib/server/auth-utils.js';
import { handleError, handleSubtitleError } from '$lib/server/error-utils.js';
import {
	getOrCacheSubtitle,
	processSubtitle,
	validateLanguage
} from '$lib/server/subtitle-service.js';
import { upsertSummary, getExistingSummary } from '$lib/server/summary-service.js';
import {
	validateYouTubeUrlFromForm,
	validateLanguageFromForm
} from '$lib/server/validation-utils.js';

export const actions = {
	default: async ({ url, request, locals: { supabase, user } }) => {
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
		let youtubeUrl, lang;

		try {
			youtubeUrl = validateYouTubeUrlFromForm(formData);
			lang = validateLanguageFromForm(formData);
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
		const safeLang = validateLanguage(lang);
		const existingSummary = await getExistingSummary(normalizedUrl, safeLang, user.id, supabase);
		
		if (existingSummary) {
			// 이미 요약이 있으면 자막 추출 없이 바로 반환
			console.log(`Existing summary found for ${normalizedUrl}, skipping subtitle extraction`);
			return { summary: existingSummary, fromCache: true };
		}

		// 5. 새로운 영상만 자막 추출 시도
		console.log(`New video detected: ${normalizedUrl}, starting subtitle extraction`);
		const subtitleResult = await getOrCacheSubtitle(normalizedUrl, safeLang);
		
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
		} catch (error) {
			return fail(400, handleSubtitleError(error));
		}

		// 7. 요약 생성
		const { title, summary, content } = await summarizeTranscript(transcript, { lang: safeLang });

		// 8. 새로운 요약 저장
		try {
			const summaryData = await upsertSummary(
				normalizedUrl, // 정규화된 URL 사용
				safeLang,
				title,
				summary,
				content,
				user.id,
				supabase
			);

			console.log(`New summary created for ${normalizedUrl}`);
			return { summary: summaryData, fromCache: false };
		} catch (error) {
			return fail(500, handleError(error));
		}
	}
};
