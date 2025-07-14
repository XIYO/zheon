/**
 * 입력 검증 관련 유틸리티 함수들
 */

/**
 * 폼 데이터에서 YouTube URL을 검증합니다
 * @param {FormData} formData - 폼 데이터
 * @returns {string} - 검증된 YouTube URL
 * @throws {Error} - URL이 없거나 유효하지 않은 경우
 */
export function validateYouTubeUrlFromForm(formData) {
	const youtubeUrl = formData.get('youtubeUrl');

	if (!youtubeUrl || typeof youtubeUrl !== 'string') {
		throw new Error('유튜브 URL이 필요합니다.');
	}

	return youtubeUrl.trim();
}

/**
 * 폼 데이터에서 언어 코드를 검증합니다
 * @param {FormData} formData - 폼 데이터
 * @returns {string} - 검증된 언어 코드 ('ko' 또는 'en')
 */
export function validateLanguageFromForm(formData) {
	const lang = formData.get('lang');
	return lang === 'en' ? 'en' : 'ko';
}

/**
 * 자막이 문자열인지 검증합니다
 * @param {unknown} subtitle - 검증할 자막
 * @returns {boolean} - 유효한 문자열 여부
 */
export function isValidSubtitle(subtitle) {
	return typeof subtitle === 'string' && subtitle.length > 0;
}

/**
 * 요약 데이터의 필수 필드를 검증합니다
 * @param {object} summaryData - 요약 데이터
 * @returns {boolean} - 유효한 요약 데이터 여부
 */
export function isValidSummaryData(summaryData) {
	return (
		summaryData &&
		typeof summaryData.title === 'string' &&
		typeof summaryData.summary === 'string' &&
		typeof summaryData.content === 'string'
	);
}
