export const load = async ({ parent }) => {
	const { supabase } = await parent();

	// 최근 50개 요약 조회
	const { data: summaries, error } = await supabase
		.from('summary')
		.select('id, url, title, summary, lang, last_modified_at')
		.order('last_modified_at', { ascending: false })
		.limit(50);

	if (error) {
		console.error('Load error:', error);
	}

	return {
		summaries: summaries || []
	};
};
