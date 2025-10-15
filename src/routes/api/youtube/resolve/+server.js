import { json } from '@sveltejs/kit';
import { resolveYoutubeUrl } from '$lib/remote/youtube.remote.js';

/**
 * YouTube URL/핸들 해석 API
 * GET /api/youtube/resolve?url={url}
 *
 * @deprecated Remote function을 사용하세요: import { resolveYoutubeUrl } from '$lib/remote/youtube.remote.js'
 */
export async function GET({ url }) {
	const urlParam = url.searchParams.get('url');
	const result = await resolveYoutubeUrl(urlParam);
	return json(result);
}
