import { query, form, getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import * as v from 'valibot';
import { SummarySchema } from './summary.schema';
import { extractVideoId, normalizeYouTubeUrl } from '$lib/utils/youtube.js';
import { GetSummariesSchema } from './summary.schema';
import { SummaryService } from '$lib/server/services/summary.service';

export const getSummaries = query(
	GetSummariesSchema,
	async (params = { limit: 20, sortBy: 'newest' as const }) => {
		const { cursor, limit = 20, sortBy = 'newest' } = params;
		const { locals } = getRequestEvent();
		const { supabase } = locals;

		const ascending = sortBy === 'oldest';

		let queryBuilder = supabase
			.from('summaries')
			.select('id, url, title, summary, processing_status, thumbnail_url, updated_at')
			.order('updated_at', { ascending })
			.limit(limit + 1);

		if (cursor) {
			if (ascending) queryBuilder = queryBuilder.gt('updated_at', cursor);
			else queryBuilder = queryBuilder.lt('updated_at', cursor);
		}

		const { data, error: sbError } = await queryBuilder;

		if (sbError) throw error(500, sbError.message);

		const hasMore = data.length > limit;
		const summaries = hasMore ? data.slice(0, limit) : data;

		return {
			summaries,
			nextCursor: hasMore ? summaries[summaries.length - 1]?.updated_at : undefined
		};
	}
);

const GetSummaryByIdSchema = v.object({
	id: v.string()
});

export const getSummaryById = query(GetSummaryByIdSchema, async ({ id }) => {
	console.log('[remote/getSummaryById] called', { id });
	const { locals } = getRequestEvent();
	const { supabase } = locals;

	const { data, error: sbError } = await supabase
		.from('summaries')
		.select('*')
		.eq('id', id)
		.single();

	if (sbError) {
		console.error('[remote/getSummaryById] supabase error', { id, message: sbError.message });
		throw error(404, 'Summary not found');
	}
	if (!data) {
		console.warn('[remote/getSummaryById] no data returned', { id });
		throw error(404, 'Summary not found');
	}

	console.log('[remote/getSummaryById] success', {
		id: data.id,
		analysis_status: data.analysis_status,
		summary_audio_status: data.summary_audio_status
	});

	return data;
});

export const createSummary = form(SummarySchema, async ({ id, url }) => {
	const { locals } = getRequestEvent();
	const { supabase, adminSupabase } = locals;

	const videoId = extractVideoId(url);
	const normalizedUrl = normalizeYouTubeUrl(videoId);

	const { data: existing, error: selectError } = await supabase
		.from('summaries')
		.select('id, analysis_status')
		.eq('url', normalizedUrl)
		.maybeSingle();

	if (selectError) throw error(500, selectError);

	let summaryId;

	if (existing) {
		summaryId = existing.id;
		console.log(`[createSummary] 기존 레코드, status=${existing.analysis_status}`);

		if (existing.analysis_status === 'completed') {
			await adminSupabase
				.from('summaries')
				.update({ updated_at: new Date().toISOString() })
				.eq('id', summaryId);

			const { data: current } = await supabase
				.from('summaries')
				.select('id, url, title, summary, processing_status, thumbnail_url, updated_at')
				.eq('id', summaryId)
				.single();

			return current;
		}

		await adminSupabase
			.from('summaries')
			.update({
				processing_status: 'processing',
				analysis_status: 'processing',
				updated_at: new Date().toISOString()
			})
			.eq('id', summaryId);
	} else {
		const { data: newData, error: insertError } = await supabase
			.from('summaries')
			.insert({
				id,
				url: normalizedUrl,
				processing_status: 'processing',
				analysis_status: 'processing'
			})
			.select('id')
			.single();

		if (insertError) throw error(500, insertError);
		summaryId = newData.id;
	}

	const { data: summaryData } = await supabase
		.from('summaries')
		.select('id, url, title, summary, processing_status, thumbnail_url, updated_at')
		.eq('id', summaryId)
		.single();

	if (!videoId) throw error(400, 'Invalid video ID');

	const summaryService = new SummaryService(adminSupabase);
	summaryService
		.analyzeSummary(videoId, {
			maxBatches: 5,
			force: true,
			geminiApiKey: process.env.GEMINI_API_KEY || ''
		})
		.catch(async (err) => {
			console.error('[createSummary] 백그라운드 분석 실패:', err);
			await adminSupabase
				.from('summaries')
				.update({
					analysis_status: 'failed',
					processing_status: 'failed',
					updated_at: new Date().toISOString()
				})
				.eq('id', summaryId);
		});

	return summaryData;
});
