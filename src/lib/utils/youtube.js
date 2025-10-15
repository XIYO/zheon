/**
 * YouTube URL에서 videoId 추출
 *
 * 지원 URL 형식:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 * - https://youtube.com/watch?v=VIDEO_ID
 * - VIDEO_ID (이미 ID인 경우)
 *
 * @param {string} url - YouTube URL 또는 videoId
 * @returns {string | null} - videoId 또는 null
 */
export function extractVideoId(url) {
	if (!url || typeof url !== 'string') return null;

	const trimmedUrl = url.trim();

	// 이미 videoId인 경우 (11자리 영숫자)
	if (/^[a-zA-Z0-9_-]{11}$/.test(trimmedUrl)) {
		return trimmedUrl;
	}

	// youtube.com/watch?v=VIDEO_ID
	const watchMatch = trimmedUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
	if (watchMatch) return watchMatch[1];

	// youtube.com/shorts/VIDEO_ID
	const shortsMatch = trimmedUrl.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
	if (shortsMatch) return shortsMatch[1];

	// youtu.be/VIDEO_ID
	const shortMatch = trimmedUrl.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
	if (shortMatch) return shortMatch[1];

	// youtube.com/embed/VIDEO_ID
	const embedMatch = trimmedUrl.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
	if (embedMatch) return embedMatch[1];

	// youtube.com/v/VIDEO_ID
	const vMatch = trimmedUrl.match(/youtube\.com\/v\/([a-zA-Z0-9_-]{11})/);
	if (vMatch) return vMatch[1];

	return null;
}

/**
 * videoId가 유효한지 검증
 *
 * @param {string} videoId
 * @returns {boolean}
 */
export function isValidVideoId(videoId) {
	return videoId && typeof videoId === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(videoId);
}

/**
 * YouTube URL 정규화
 *
 * @param {string} videoId
 * @returns {string} - https://www.youtube.com/watch?v=VIDEO_ID
 */
export function normalizeYouTubeUrl(videoId) {
	if (!isValidVideoId(videoId)) {
		throw new Error('Invalid YouTube video ID');
	}
	return `https://www.youtube.com/watch?v=${videoId}`;
}
