import { query, getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import { CommunityMetricsService } from '$lib/server/services/community-metrics.service';
import { env } from '$env/dynamic/private';
import { AnalyzeCommunitySchema, GetCommunitySchema } from './community.schema';

export const analyzeCommunityMetrics = query(
	AnalyzeCommunitySchema,
	async ({ videoId, maxBatches = 5 }) => {
		const { locals } = getRequestEvent();
		const { adminSupabase } = locals;

		if (!adminSupabase) throw error(500, 'adminSupabase가 구성되어 있지 않습니다');

		const service = new CommunityMetricsService(adminSupabase);
		const result = await service.analyze(
			{ videoId },
			{
				geminiApiKey: env.GEMINI_API_KEY,
				openaiApiKey: env.OPENAI_API_KEY,
				geminiModel: env.GEMINI_MODEL,
				openaiModel: env.OPENAI_MODEL
			},
			{ maxBatches }
		);
		return result;
	}
);

export const getCommunityMetrics = query(GetCommunitySchema, async ({ videoId }) => {
	const { locals } = getRequestEvent();
	const { supabase } = locals;

	const { data, error: sbError } = await supabase
		.from('content_community_metrics')
		.select('*')
		.eq('video_id', videoId)
		.maybeSingle();

	if (sbError) throw error(500, sbError.message);
	return data;
});
