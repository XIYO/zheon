import { query, getRequestEvent } from '$app/server';
import { GetTagsSchema } from './tags.schema';
import { logger } from '$lib/logger';

export const getTags = query(GetTagsSchema, async ({ videoId }) => {
	const { locals } = getRequestEvent();
	const { supabase } = locals;

	const { data, error: sbError } = await supabase
		.from('video_tags')
		.select('tags(slug, name, name_ko), weight')
		.eq('video_id', videoId)
		.order('weight', { ascending: false });

	if (sbError) {
		logger.warn('[remote/getTags] fetch error', sbError.message);
		return [];
	}

	return (data || [])
		.map((item) => ({ ...item.tags, weight: item.weight }))
		.filter((tag) => tag.slug);
});
