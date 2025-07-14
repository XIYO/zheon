/**
 * YouTube URL 관련 유틸리티 함수들
 */

/**
 * YouTube URL을 정규화합니다
 * @param {string} url - 정규화할 YouTube URL
 * @returns {string | null} - 정규화된 URL 또는 null (유효하지 않은 경우)
 */
export function normalizeYouTubeUrl(url) {
	try {
		const parsedUrl = new URL(url);

		// youtu.be 형태 처리
		if (parsedUrl.hostname === 'youtu.be') {
			return `https://www.youtube.com/watch?v=${parsedUrl.pathname.slice(1)}`;
		}

		// youtube.com 형태 처리
		if (parsedUrl.hostname.includes('youtube.com') && parsedUrl.searchParams.has('v')) {
			// 시간 파라미터 제거
			parsedUrl.searchParams.delete('t');
			return parsedUrl.toString();
		}
	} catch {
		return null;
	}
	return null;
}

/**
 * YouTube URL을 검증하고 정규화합니다
 * @param {string} youtubeUrl - 검증할 YouTube URL
 * @returns {string} - 정규화된 YouTube URL
 * @throws {Error} - 유효하지 않은 URL인 경우
 */
export function validateAndNormalizeUrl(youtubeUrl) {
	const normalizedUrl = normalizeYouTubeUrl(youtubeUrl);
	if (!normalizedUrl) {
		throw new Error('유효한 유튜브 URL이 필요합니다.');
	}
	return normalizedUrl;
}

/**
 * YouTube 비디오 ID를 추출합니다
 * @param {string} url - YouTube URL
 * @returns {string | null} - 비디오 ID 또는 null
 */
export function extractVideoId(url) {
	try {
		const normalizedUrl = normalizeYouTubeUrl(url);
		if (!normalizedUrl) return null;

		const parsedUrl = new URL(normalizedUrl);
		return parsedUrl.searchParams.get('v');
	} catch {
		return null;
	}
}
