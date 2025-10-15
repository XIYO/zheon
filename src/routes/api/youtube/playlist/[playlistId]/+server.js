import { json } from '@sveltejs/kit';
import { getPlaylist } from '$lib/remote/youtube.remote.js';

/**
 * YouTube 재생목록 조회 API
 * GET /api/youtube/playlist/{playlistId}
 *
 * @deprecated Remote function을 사용하세요: import { getPlaylist } from '$lib/remote/youtube.remote.js'
 */
export async function GET({ params }) {
	const { playlistId } = params;
	const result = await getPlaylist(playlistId);
	return json(result);
}
