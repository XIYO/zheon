import { command, query, form, getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import * as v from 'valibot';
import { collectTranscript } from './youtube/transcription.remote.ts';
import { collectComments } from './youtube/comment.remote.ts';
import { analyzeAndSummarizeVideo } from './ai.remote.ts';
import { SummarySchema } from './summary.schema';
import { extractVideoId, normalizeYouTubeUrl } from '$lib/utils/youtube.js';
import { AnalyzeVideoInputSchema, GetSummariesSchema } from './summary.schema.ts';

export const analyzeVideo = command(AnalyzeVideoInputSchema, async (input) => {
	try {
		const { videoId, maxComments = 100 } = v.parse(AnalyzeVideoInputSchema, input);
		const { locals } = getRequestEvent();
		const { supabase, adminSupabase } = locals;

		console.log(`[Summaries] 영상 분석 시작 videoId=${videoId}`);

		const { data: existing } = await supabase
			.schema('zheon')
			.from('summaries')
			.select('id, analysis_status')
			.eq('url', `https://www.youtube.com/watch?v=${videoId}`)
			.maybeSingle();

		let summaryId = existing?.id;

		if (!summaryId) {
			const { data: created, error: createError } = await adminSupabase
				.schema('zheon')
				.from('summaries')
				.insert({
					url: `https://www.youtube.com/watch?v=${videoId}`,
					processing_status: 'pending',
					analysis_status: 'pending'
				})
				.select('id')
				.single();

			if (createError) throw error(500, `요약 레코드 생성 실패: ${createError.message}`);
			summaryId = created.id;
			console.log(`[Summaries] 요약 레코드 생성 summaryId=${summaryId}`);
		} else {
			console.log(`[Summaries] 기존 요약 사용 summaryId=${summaryId}`);
		}

		await adminSupabase
			.schema('zheon')
			.from('summaries')
			.update({
				analysis_status: 'processing',
				processing_status: 'processing'
			})
			.eq('id', summaryId);

		console.log(`[Summaries] 1단계: 자막/댓글 병렬 수집 시작`);
		const [transcriptResult, commentsResult] = await Promise.all([
			collectTranscript({ videoId }),
			collectComments({ videoId, maxComments })
		]);

		if (!transcriptResult.success || !transcriptResult.data) {
			throw error(400, '자막을 사용할 수 없습니다');
		}

		if (!commentsResult.success) {
			throw error(400, '댓글을 수집할 수 없습니다');
		}

		console.log(
			`[Summaries] 수집 완료 - 자막: ${transcriptResult.data.segments?.length || 0}개, 댓글: ${commentsResult.collected}개`
		);

		const transcript = transcriptResult.data.segments
			.map((seg) => seg.text || '')
			.join(' ')
			.trim();

		const { data: commentRecords, error: commentError } = await supabase
			.schema('zheon')
			.from('comments')
			.select('data')
			.eq('video_id', videoId)
			.order('updated_at', { ascending: false })
			.limit(100);

		if (commentError) {
			throw error(500, `댓글 조회 실패: ${commentError.message}`);
		}

		const comments = commentRecords
			.map((record) => {
				const commentData = record.data;
				return commentData?.content?.text || commentData?.text || '';
			})
			.filter((text) => text.length > 0);

		console.log(`[Summaries] 2단계: AI 요약 + 분석 시작`);
		const result = await analyzeAndSummarizeVideo({
			videoId,
			transcript,
			comments
		});

		if (!result.success) {
			throw error(500, 'AI 분석 실패');
		}

		const {
			summary,
			content_quality,
			sentiment,
			community,
			age_groups,
			insights,
			total_comments_analyzed
		} = result;

		console.log(`[Summaries] 3단계: DB 저장 시작`);
		const { error: updateError } = await adminSupabase
			.schema('zheon')
			.from('summaries')
			.update({
				transcript,
				summary,
				processing_status: 'completed',

				content_quality_score: content_quality.overall_score,
				content_educational_value: content_quality.educational_value,
				content_entertainment_value: content_quality.entertainment_value,
				content_information_accuracy: content_quality.information_accuracy,
				content_clarity: content_quality.clarity,
				content_depth: content_quality.depth,
				content_category: content_quality.category,
				content_target_audience: content_quality.target_audience,

				sentiment_overall_score: sentiment.overall_score,
				sentiment_positive_ratio: sentiment.positive_ratio,
				sentiment_neutral_ratio: sentiment.neutral_ratio,
				sentiment_negative_ratio: sentiment.negative_ratio,
				sentiment_intensity: sentiment.intensity,

				community_quality_score: community.overall_score,
				community_politeness: community.politeness,
				community_rudeness: community.rudeness,
				community_kindness: community.kindness,
				community_toxicity: community.toxicity,
				community_constructive: community.constructive,
				community_self_centered: community.self_centered,
				community_off_topic: community.off_topic,

				age_group_teens: age_groups.teens,
				age_group_20s: age_groups.twenties,
				age_group_30s: age_groups.thirties,
				age_group_40plus: age_groups.forty_plus,

				ai_content_summary: insights.content_summary,
				ai_audience_reaction: insights.audience_reaction,
				ai_key_insights: insights.key_insights,
				ai_recommendations: insights.recommendations,

				total_comments_analyzed,
				analysis_status: 'completed',
				analyzed_at: new Date().toISOString(),
				analysis_model: 'gemini-2.0-flash-exp',
				updated_at: new Date().toISOString()
			})
			.eq('id', summaryId);

		if (updateError) {
			throw error(500, `분석 결과 저장 실패: ${updateError.message}`);
		}

		console.log(`[Summaries] 완료 summaryId=${summaryId}`);

		return {
			success: true,
			summaryId,
			videoId,
			summary,
			transcript_segments: transcriptResult.data.segments.length,
			comments_collected: commentsResult.collected,
			comments_analyzed: total_comments_analyzed,
			scores: {
				content_quality: content_quality.overall_score,
				sentiment: sentiment.overall_score,
				community_quality: community.overall_score
			}
		};
	} catch (err) {
		console.error('[Summaries] 분석 실패:', err);

		const errorMessage = err instanceof Error ? err.message : String(err);
		throw error(500, `영상 분석 실패: ${errorMessage}`);
	}
});

export const getSummaries = query(GetSummariesSchema, async (params = {}) => {
	const { cursor, limit = 20, sortBy = 'newest' } = params;
	const { locals } = getRequestEvent();
	const { supabase } = locals;

	const ascending = sortBy === 'oldest';

	let queryBuilder = supabase
		.schema('zheon')
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
});

const GetSummaryByIdSchema = v.object({
	id: v.string()
});

export const getSummaryById = query(GetSummaryByIdSchema, async ({ id }) => {
	const { locals } = getRequestEvent();
	const { supabase } = locals;

	const { data, error: sbError } = await supabase
		.schema('zheon')
		.from('summaries')
		.select('*')
		.eq('id', id)
		.single();

	if (sbError) throw error(404, 'Summary not found');
	if (!data) throw error(404, 'Summary not found');

	return data;
});

export const createSummary = form(SummarySchema, async ({ url }) => {
	const { locals } = getRequestEvent();
	const { supabase } = locals;

	const videoId = extractVideoId(url);
	const normalizedUrl = normalizeYouTubeUrl(videoId);

	const { data: existing, error: selectError } = await supabase
		.from('summaries')
		.select('id, url, title, summary, processing_status, thumbnail_url, updated_at')
		.eq('url', normalizedUrl)
		.maybeSingle();

	if (selectError) throw error(500, selectError);

	let summaryData;

	if (existing) {
		const { data: updated, error: updateError } = await supabase
			.from('summaries')
			.update({ updated_at: new Date().toISOString() })
			.eq('id', existing.id)
			.select('id, url, title, summary, processing_status, thumbnail_url, updated_at')
			.single();

		if (updateError) throw error(500, updateError);
		summaryData = updated;
	} else {
		const { data: newData, error: insertError } = await supabase
			.from('summaries')
			.insert({ url: normalizedUrl, processing_status: 'pending' })
			.select('id, url, title, summary, processing_status, thumbnail_url, updated_at')
			.single();

		if (insertError) throw error(500, insertError);
		summaryData = newData;
	}

	try {
		const { waitUntil } = await import('cloudflare:workers');
		waitUntil(analyzeVideo({ videoId }).catch(() => {}));
	} catch {
		analyzeVideo({ videoId }).catch(() => {});
	}

	return summaryData;
});
