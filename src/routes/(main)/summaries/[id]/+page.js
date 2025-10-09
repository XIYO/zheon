import { error } from '@sveltejs/kit';

export const load = async ({ parent, params }) => {
	const { supabase } = await parent();

	// RLS 정책이 인증된 사용자의 데이터만 반환하도록 처리
	const { data: summary, error: fetchError } = await supabase
		.from('summary')
		.select('id, url, title, summary, content, lang, created_at, summary_audio_url, summary_audio_status, content_audio_url, content_audio_status')
		.eq('id', params.id)
		.single();

	if (fetchError) {
		console.error('Fetch error:', fetchError);
		error(404, 'Summary not found');
	}

	if (!summary) {
		error(404, 'Summary not found');
	}

	return {
		meta: {
			title: summary.title
		},
		summary
	};
};
