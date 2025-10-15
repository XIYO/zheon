import { json } from '@sveltejs/kit';
import { getChannelInfo } from '$lib/remote/youtube.remote.js';

/**
 * YouTube 채널 기본 정보 API
 * GET /api/youtube/channel/{channelId}
 *
 * @deprecated Remote function을 사용하세요: import { getChannelInfo } from '$lib/remote/youtube.remote.js'
 */
export async function GET({ params }) {
	const { channelId } = params;
	const result = await getChannelInfo(channelId);
	return json(result);
}
