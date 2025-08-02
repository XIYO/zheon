import { extractSubtitle } from './pyExtractSubtitle.js';

/**
 * 자막 추출 및 캐싱 서비스
 */

/**
 * 자막을 추출합니다 (캐시 시스템 제거, 간소화)
 * @param {string} youtubeUrl - 정규화된 YouTube URL
 * @param {string} lang - 언어 코드 ('ko' 또는 'en')
 * @returns {Promise<{success: boolean, subtitle?: string, error?: {type: string, message: string}}>} - 추출 결과
 */
export async function getOrCacheSubtitle(youtubeUrl, lang) {
	// 직접 자막 추출 (캐시 없이)
	const extractionResult = await extractSubtitle(youtubeUrl, lang);

	if (!extractionResult.success || !extractionResult.data) {
		return {
			success: false,
			error: extractionResult.error || {
				type: 'EXTRACTION_FAILED',
				message: '자막 추출에 실패했습니다. YouTube URL을 확인해주세요.'
			}
		};
	}

	return {
		success: true,
		subtitle: extractionResult.data
	};
}

/**
 * 캐시된 자막을 가져옵니다
 * @param {string} youtubeUrl - YouTube URL
 * @param {string} lang - 언어 코드
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase - Supabase 클라이언트
 * @returns {Promise<string | null>} - 캐시된 자막 또는 null
 */
async function getCachedSubtitle(youtubeUrl, lang, supabase) {
	try {
		const { data: existingSubtitle, error } = await supabase
			.from('subtitles')
			.select('subtitle')
			.eq('youtube_url', youtubeUrl)
			.eq('lang', lang)
			.maybeSingle();

		if (error) {
			console.error('Subtitle fetch error:', error);
			return null;
		}

		return existingSubtitle?.subtitle || null;
	} catch (error) {
		console.error('Error getting cached subtitle:', error);
		return null;
	}
}

/**
 * 자막을 캐시에 저장합니다
 * @param {string} youtubeUrl - YouTube URL
 * @param {string} lang - 언어 코드
 * @param {string} subtitle - 자막 내용
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase - Supabase 클라이언트
 */
async function cacheSubtitle(youtubeUrl, lang, subtitle, supabase) {
	try {
		const { error } = await supabase
			.from('subtitles')
			.insert({ youtube_url: youtubeUrl, lang, subtitle });

		if (error) {
			console.error('Subtitle insert error:', error);
		}
	} catch (error) {
		console.error('Error caching subtitle:', error);
	}
}

/**
 * 자막을 검증하고 문자열로 변환합니다
 * @param {unknown} subtitle - 검증할 자막
 * @returns {string} - 검증된 자막 문자열
 * @throws {Error} - 자막이 유효하지 않은 경우
 */
export function processSubtitle(subtitle) {
	if (!subtitle || typeof subtitle !== 'string') {
		throw new Error('Subtitle is invalid or undefined.');
	}
	return subtitle;
}

/**
 * 언어 코드를 검증하고 안전한 형태로 변환합니다
 * @param {string | null} lang - 언어 코드
 * @returns {'ko' | 'en'} - 검증된 언어 코드
 */
export function validateLanguage(lang) {
	return lang === 'en' ? 'en' : 'ko';
}
