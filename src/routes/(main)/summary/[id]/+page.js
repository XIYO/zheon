import { error } from '@sveltejs/kit';

export const load = async ({ parent, params }) => {
	const { supabase, user } = await parent();
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const { data: summary, error: fetchError } = await supabase
		.from('summary')
		.select('id, youtube_url, title, summary, content, lang, created_at, user_id')
		.eq('id', params.id)
		.eq('user_id', user.id)
		.single();

	if (fetchError) {
		console.error('Fetch error:', fetchError);
		throw error(404, 'Summary not found');
	}

	if (!summary) {
		throw error(404, 'Summary not found');
	}

	return {
		summary
	};
};
