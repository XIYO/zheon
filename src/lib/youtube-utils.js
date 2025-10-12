/**
 * YouTube 유틸리티 함수
 * 클라이언트와 서버 모두에서 사용 가능
 */

/**
 * YouTube URL에서 비디오 ID 추출
 * @param {string} url - YouTube URL
 * @returns {string} 비디오 ID 또는 빈 문자열
 */
export function extractYoutubeId(url) {
	try {
		const parsedUrl = new URL(url);

		// youtu.be 형태 처리
		if (parsedUrl.hostname === 'youtu.be') {
			return parsedUrl.pathname.slice(1); // '/' 제거
		}

		// youtube.com 형태 처리
		if (parsedUrl.hostname.includes('youtube.com')) {
			return parsedUrl.searchParams.get('v') || '';
		}
	} catch {
		return '';
	}
	return '';
}

/**
 * YouTube URL에서 썸네일 URL 생성
 * @param {string} url - YouTube URL
 * @param {string} [quality='maxresdefault'] - 썸네일 품질 (default, mqdefault, hqdefault, sddefault, maxresdefault)
 * @returns {string} 썸네일 URL 또는 빈 문자열
 */
export function extractThumbnail(url, quality = 'maxresdefault') {
	const id = extractYoutubeId(url);
	return id ? `https://img.youtube.com/vi/${id}/${quality}.jpg` : '';
}

/**
 * YouTube URL 유효성 검증
 * @param {string} url - 검증할 URL
 * @returns {boolean} 유효한 YouTube URL인지 여부
 */
export function isYoutubeUrl(url) {
	try {
		const parsedUrl = new URL(url);
		const hostname = parsedUrl.hostname.toLowerCase();
		return (
			hostname === 'youtube.com' ||
			hostname === 'www.youtube.com' ||
			hostname === 'youtu.be' ||
			hostname === 'm.youtube.com'
		);
	} catch {
		return false;
	}
}
