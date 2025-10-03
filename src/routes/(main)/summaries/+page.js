import { error } from '@sveltejs/kit';

export const load = async ({ parent }) => {
	const { supabase, session } = await parent();

	if (!session) {
		error(401, 'Unauthorized');
	}

	// 사용자의 최근 50개 요약 가져오기
	const { data: summaries, error: fetchError } = await supabase
		.from('summary')
		.select('id, url, title, summary, created_at')
		.order('created_at', { ascending: false })
		.limit(50);

	if (fetchError) {
		console.error('Error fetching summaries:', fetchError);
		error(500, 'Failed to load summaries');
	}

	return {
		meta: {
			title: '인사이트',
			description: '지금까지 정리한 모든 영상 인사이트를 확인하세요',
		},
		summaries: summaries || []
	};
};