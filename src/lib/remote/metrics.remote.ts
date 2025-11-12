import { query, getRequestEvent } from '$app/server';
import { GetMetricsSchema } from './metrics.schema';
import { logger } from '$lib/logger';

export const getMetrics = query(GetMetricsSchema, async ({ videoId }) => {
	const { locals } = getRequestEvent();
	const { supabase } = locals;

	const { data, error: sbError } = await supabase
		.from('content_metrics')
		.select('metrics')
		.eq('video_id', videoId)
		.maybeSingle();

	if (sbError) {
		logger.warn('[remote/getMetrics] fetch error', sbError.message);
		return {};
	}

	return data?.metrics || {};
});
