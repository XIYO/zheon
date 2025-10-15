import { json } from '@sveltejs/kit';
import { getChannelPlaylists } from '$lib/remote/youtube.remote.js';

/**
 * YouTube 채널 재생목록 API
 * GET /api/youtube/channel/{channelId}/playlists
 *
 * @deprecated Remote function을 사용하세요: import { getChannelPlaylists } from '$lib/remote/youtube.remote.js'
 */
export async function GET({ params }) {
	const { channelId } = params;
	const result = await getChannelPlaylists(channelId);
	return json(result);
}
