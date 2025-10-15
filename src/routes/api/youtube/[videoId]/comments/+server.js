import { json } from '@sveltejs/kit';
import { getVideoComments } from '$lib/remote/youtube.remote.js';

/**
 * YouTube 댓글 조회 API
 * GET /api/youtube/{videoId}/comments?sortBy=top&continuation=xxx
 *
 * @deprecated Remote function을 사용하세요: import { getVideoComments } from '$lib/remote/youtube.remote.js'
 */
export async function GET({ params, url }) {
	const { videoId } = params;
	const sortBy = url.searchParams.get('sortBy') || 'top';
	const continuation = url.searchParams.get('continuation') ?? undefined;

	const result = await getVideoComments({ videoId, sortBy, continuation });
	return json(result);
}
