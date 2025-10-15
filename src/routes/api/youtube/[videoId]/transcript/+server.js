import { json } from '@sveltejs/kit';
import { getVideoTranscript } from '$lib/remote/youtube.remote.js';

/**
 * YouTube 자막 추출 API
 * GET /api/youtube/{videoId}/transcript
 *
 * @deprecated Remote function을 사용하세요: import { getVideoTranscript } from '$lib/remote/youtube.remote.js'
 */
export async function GET({ params }) {
	const { videoId } = params;
	const result = await getVideoTranscript(videoId);
	return json(result);
}
