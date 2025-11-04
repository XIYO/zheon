/**
 * @typedef {import('$lib/types/database.types').Tables<'summary'>} SummaryRow
 */

import { getRequestEvent, query } from '$app/server';
import { error } from '@sveltejs/kit';
import * as v from 'valibot';

// 스키마 정의
const GetSummariesSchema = v.optional(v.object({
	cursor: v.optional(v.string()),
	limit: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(100)), 20),
	sortBy: v.optional(v.picklist(['newest', 'oldest']), 'newest')
}));

/**
 * Query: 요약 목록 조회 (커서 기반 페이지네이션)
 * - 모든 사용자: 모든 요약 조회 가능 (공개 캐시)
 * @param {{ cursor?: string, limit?: number, sortBy?: 'newest' | 'oldest' }} params
 * @returns {Promise<{ summaries: Array<SummaryRow>, nextCursor: string | null, hasMore: boolean }>}
 */
export const getSummaries = query(GetSummariesSchema, async (params = {}) => {
	const { cursor, limit = 20, sortBy = 'newest' } = params;
	const { locals } = getRequestEvent();
	const { supabase } = locals;

	const ascending = sortBy === 'oldest';

	let query = supabase
		.from('summaries')
		.select('id, url, title, summary, processing_status, thumbnail_url, updated_at')
		.order('updated_at', { ascending })
		.limit(limit + 1);

	if (cursor) {
		if (ascending) query = query.gt('updated_at', cursor);
		else query = query.lt('updated_at', cursor);
	}

	const { data, error: sbError } = await query;

	if (sbError) throw error(500, sbError);

	const hasMore = data.length > limit;
	const summaries = hasMore ? data.slice(0, limit) : data;
	const nextCursor = hasMore ? summaries[summaries.length - 1].updated_at : null;

	return { summaries, nextCursor, hasMore };
});

// 단일 요약 조회 스키마
const GetSummaryByIdSchema = v.object({
	id: v.string()
});

/**
 * Query: 단일 요약 조회
 * @param {{ id: string }} params
 * @returns {Promise<SummaryRow>}
 */
export const getSummaryById = query(GetSummaryByIdSchema, async ({ id }) => {
	const { locals } = getRequestEvent();
	const { supabase } = locals;

	const { data, error: sbError } = await supabase
		.from('summaries')
		.select('id, url, title, summary, language, processing_status, thumbnail_url, updated_at, summary_audio_url, summary_audio_status')
		.eq('id', id)
		.single();

	if (sbError) throw error(404, 'Summary not found');

	if (!data) throw error(404, 'Summary not found');

	const videoIdMatch = data.url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
	const videoId = videoIdMatch?.[1];

	let insight = null;
	if (videoId) {
		const { data: videoData } = await supabase
			.from('channel_videos')
			.select('video_insight')
			.eq('video_id', videoId)
			.single();

		insight = videoData?.video_insight || null;
	}

	return {
		...data,
		video_insight: insight
	};
});