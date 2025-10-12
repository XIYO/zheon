import * as v from 'valibot';

/**
 * YouTube URL 검증
 */
const isYouTubeUrl = (input) => {
	try {
		const url = new URL(input);
		const hostname = url.hostname.toLowerCase();
		return (
			hostname === 'youtube.com' ||
			hostname === 'www.youtube.com' ||
			hostname === 'youtu.be' ||
			hostname === 'm.youtube.com'
		);
	} catch {
		return false;
	}
};

/**
 * Summary Valibot 스키마
 */
export const SummarySchema = v.object({
	url: v.pipe(
		v.string('URL을 입력해주세요'),
		v.trim(),
		v.nonEmpty('URL을 입력해주세요'),
		v.url('올바른 URL 형식이 아닙니다'),
		v.check(isYouTubeUrl, 'YouTube URL만 지원됩니다')
	)
});
