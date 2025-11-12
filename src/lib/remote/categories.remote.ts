import { query, getRequestEvent } from '$app/server';
import { GetCategoriesSchema } from './categories.schema';
import { logger } from '$lib/logger';

export const getCategories = query(GetCategoriesSchema, async ({ videoId }) => {
	const { locals } = getRequestEvent();
	const { supabase } = locals;

	const { data, error: sbError } = await supabase
		.from('video_categories')
		.select('categories(slug, name, name_ko, description)')
		.eq('video_id', videoId)
		.order('priority', { ascending: true });

	if (sbError) {
		logger.warn('[remote/getCategories] fetch error', sbError.message);
		return [];
	}

	return (data || []).map((item) => item.categories).filter(Boolean);
});
