export const load = async ({ parent }) => {
	const { supabase } = await parent();

	// 모든 사용자가 summary 테이블 조회 가능 (RLS에서 anon 허용 필요)
	const { data: summaries, error } = await supabase
		.from('summary')
		.select('id, url, title, summary, lang, last_modified_at')
		.order('last_modified_at', { ascending: false });

	if (error) {
		console.error('Load error:', error);
	}

	return {
		summaries: summaries || []
	};
};
