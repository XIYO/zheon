import { json } from '@sveltejs/kit';
import { getSearchSuggestions } from '$lib/remote/youtube.remote.js';

/**
 * YouTube 검색 자동완성 제안 API
 * GET /api/youtube/suggestions?q={query}
 *
 * @deprecated Remote function을 사용하세요: import { getSearchSuggestions } from '$lib/remote/youtube.remote.js'
 */
export async function GET({ url }) {
	const query = url.searchParams.get('q');
	const result = await getSearchSuggestions(query);
	return json(result);
}
