import { json } from '@sveltejs/kit';
import { getChannelAbout } from '$lib/remote/youtube.remote.js';

/**
 * YouTube 채널 About 정보 API
 * GET /api/youtube/channel/{channelId}/about
 *
 * @deprecated Remote function을 사용하세요: import { getChannelAbout } from '$lib/remote/youtube.remote.js'
 */
export async function GET({ params }) {
	const { channelId } = params;
	const result = await getChannelAbout(channelId);
	return json(result);
}
