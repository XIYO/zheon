export const load = async ({ parent }) => {
	const { supabase } = await parent();
	
	// 인증된 사용자만 summary 테이블 조회 가능 (RLS 적용)
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
