export const load = async ({ parent }) => {
	const { supabase, user } = await parent();
	if (!user) return { summaries: [] };
	const { data: summaries, error } = await supabase
		.from('summary')
		.select('id, youtube_url, title, summary, user_id')
		.eq('user_id', user.id)
		.order('created_at', { ascending: false });

	if (error) {
		console.error('Load error:', error);
	}

	return {
		summaries
	};
};
