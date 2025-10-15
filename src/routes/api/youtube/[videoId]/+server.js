import { json } from '@sveltejs/kit';
import { getVideoInfo } from '$lib/remote/youtube.remote.js';

/**
 * YouTube 비디오 상세 정보 API
 * GET /api/youtube/{videoId}
 *
 * @deprecated Remote function을 사용하세요: import { getVideoInfo } from '$lib/remote/youtube.remote.js'
 */
export async function GET({ params }) {
	const { videoId } = params;
	const result = await getVideoInfo(videoId);
	return json(result);
}
