import { json } from '@sveltejs/kit';
import { getTrending } from '$lib/remote/youtube.remote.js';

/**
 * YouTube 인기 급상승 API
 * GET /api/youtube/trending
 *
 * @deprecated Remote function을 사용하세요: import { getTrending } from '$lib/remote/youtube.remote.js'
 */
export async function GET() {
	const result = await getTrending();
	return json(result);
}
