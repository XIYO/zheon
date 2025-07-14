import { extractSubtitle } from './pyExtractSubtitle.js';

/**
 * 자막 추출 및 캐싱 서비스
 */

/**
 * 자막을 추출하거나 캐시에서 가져옵니다
 * @param {string} youtubeUrl - 정규화된 YouTube URL
 * @param {string} lang - 언어 코드 ('ko' 또는 'en')
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase - Supabase 클라이언트
 * @returns {Promise<string>} - 추출된 자막
 * @throws {Error} - 자막 추출 실패 시
 */
export async function getOrCacheSubtitle(youtubeUrl, lang, supabase) {
	// 캐시된 자막이 있는지 확인
	const cachedSubtitle = await getCachedSubtitle(youtubeUrl, lang, supabase);
	if (cachedSubtitle) {
		return cachedSubtitle;
	}

	// 자막 추출 시도 (백엔드에서 재시도 처리)
	const extractedSubtitle = await extractSubtitle(youtubeUrl, lang);
	
	if (!extractedSubtitle || typeof extractedSubtitle !== 'string') {
		throw new Error('Failed to extract subtitle. Please check the YouTube URL.');
	}
	
	// 캐시에 저장
	await cacheSubtitle(youtubeUrl, lang, extractedSubtitle, supabase);
	
	return extractedSubtitle;
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
