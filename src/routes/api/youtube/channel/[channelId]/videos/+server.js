import { json } from '@sveltejs/kit';
import { getYoutubeChannelVideos } from '$lib/remote/youtube.remote.js';

/**
 * YouTube 채널 비디오 목록 API
 * GET /api/youtube/channel/{channelId}/videos?filter=popular
 *
 * @deprecated Remote function을 사용하세요: import { getYoutubeChannelVideos } from '$lib/remote/youtube.remote.js'
 */
export async function GET({ params, url }) {
	const { channelId } = params;
	const filter = url.searchParams.get('filter') ?? undefined;

	const result = await getYoutubeChannelVideos({ channelId, filter });
	return json(result);
}
