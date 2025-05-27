import { summarizeTranscript } from '$lib/server/summary.js';
import { fail } from '@sveltejs/kit';

// 유틸리티 함수들 임포트
import { validateAndNormalizeUrl } from '$lib/server/youtube-utils.js';
import { validateUser } from '$lib/server/auth-utils.js';
import { handleError, handleSubtitleError } from '$lib/server/error-utils.js';
import { getOrCacheSubtitle, processSubtitle, validateLanguage } from '$lib/server/subtitle-service.js';
import { upsertSummary } from '$lib/server/summary-service.js';
import { validateYouTubeUrlFromForm, validateLanguageFromForm } from '$lib/server/validation-utils.js';

export const load = async ({ locals: { supabase, user } }) => {
	if (!user) return { summaries: [] };
	const { data: summaries, error } = await supabase
		.from('summary')
		.select('id, youtube_url, title, summary, user_id')
		.eq('user_id', user.id)
		.order('created_at', { ascending: false });

	if (error) {
		console.error('Load error:', error);
	}

	return {
		summaries
	};
};

export const actions = {
	default: async ({ url, request, locals: { supabase, user } }) => {
		// 1. 사용자 인증 검증
		try {
			validateUser(user, url);
		} catch (error) {
			return fail(400, handleError(error));
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

		// 4. 자막 추출 및 캐싱
		let subtitle;
		try {
			subtitle = await getOrCacheSubtitle(normalizedUrl, lang, supabase);
		} catch (error) {
			return fail(400, handleSubtitleError(error));
		}

		// 5. 자막 처리 및 검증
		let transcript;
		try {
			transcript = processSubtitle(subtitle);
		} catch (error) {
			return fail(400, handleSubtitleError(error));
		}

		// 6. 요약 생성
		const safeLang = validateLanguage(lang);
		const { title, summary, content } = await summarizeTranscript(transcript, { lang: safeLang });

		// 7. 요약 저장 또는 업데이트
		try {
			const summaryData = await upsertSummary(
				youtubeUrl, 
				lang, 
				title, 
				summary, 
				content, 
				user.id, 
				supabase
			);

			return { summary: summaryData };
		} catch (error) {
			return fail(500, handleError(error));
		}
	}
};
