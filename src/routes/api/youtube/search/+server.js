import { json } from '@sveltejs/kit';
import { searchYoutube } from '$lib/remote/youtube.remote.js';

/**
 * YouTube 검색 API
 * GET /api/youtube/search?q={query}&type=video&upload_date=week&duration=short&sort_by=relevance
 *
 * @deprecated Remote function을 사용하세요: import { searchYoutube } from '$lib/remote/youtube.remote.js'
 */
export async function GET({ url }) {
	const query = url.searchParams.get('q');
	const type = url.searchParams.get('type') ?? undefined;
	const upload_date = url.searchParams.get('upload_date') ?? undefined;
	const duration = url.searchParams.get('duration') ?? undefined;
	const sort_by = url.searchParams.get('sort_by') ?? undefined;
	const features = url.searchParams.get('features') ?? undefined;

	const result = await searchYoutube({
		query,
		type,
		upload_date,
		duration,
		sort_by,
		features
	});

	return json(result);
}
