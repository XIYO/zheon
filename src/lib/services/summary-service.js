/**
 * Summary 관련 비즈니스 로직
 */

/**
 * 최근 요약 목록 조회
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function getRecentSummaries(supabase, limit = 3) {
	const { data, error } = await supabase
		.from('summary')
		.select('id, url, title, summary, processing_status, updated_at')
		.order('updated_at', { ascending: false })
		.limit(limit);

	if (error) {
		console.error('Failed to load summaries:', error);
		throw error;
	}

	return data ?? [];
}
