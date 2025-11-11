import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database.types';
import { error } from '@sveltejs/kit';
import { TranscriptionService } from './youtube/transcription.service';
import { CommentService } from './youtube/comment.service';
import type { Innertube } from 'youtubei.js';
import { upsertCategory, upsertTag, upsertMetricKey } from '$lib/server/content-analysis';
import { AIService, type AIAnalysisInput, type AIAnalysisOutput } from './ai.service';

interface TranscriptData {
	segments: Array<{
		text?: string;
		start_ms?: string;
		end_ms?: string;
	}>;
}

interface CommentData {
	content?: { text?: string };
	text?: string;
}

export interface AnalyzeSummaryOptions {
	maxBatches?: number;
	force?: boolean;
	geminiApiKey: string;
}

export class SummaryService {
	private transcriptionService: TranscriptionService;
	private commentService: CommentService;

	constructor(
		private supabase: SupabaseClient<Database>,
		private youtube: Innertube
	) {
		this.transcriptionService = new TranscriptionService(supabase, youtube);
		this.commentService = new CommentService(supabase, youtube);
	}

	async analyzeSummary(videoId: string, options: AnalyzeSummaryOptions): Promise<void> {
		const { maxBatches = 5, force = false, geminiApiKey } = options;

		if (!geminiApiKey) {
			throw error(500, 'GEMINI_API_KEY가 설정되지 않았습니다');
		}

		console.log(`[summary] 분석 시작 videoId=${videoId}`);

		if (!force) {
			const { data: existing } = await this.supabase
				.from('summaries')
				.select('id, analysis_status')
				.eq('video_id', videoId)
				.maybeSingle();

			if (existing?.analysis_status === 'completed') {
				console.log(`[summary] 이미 분석 완료 summaryId=${existing.id}`);
				return;
			}
		}

		console.log(`[summary] 비디오 정보 수집 중 videoId=${videoId}`);
		const video = await this.youtube.getBasicInfo(videoId);
		const title = video.basic_info.title || '';
		const thumbnailUrl =
			video.basic_info.thumbnail?.at(0)?.url || `https://i.ytimg.com/vi/${videoId}/default.jpg`;

		console.log(`[summary] 타이틀 업데이트: "${title}" (${title.length}자)`);

		const { error: updateError } = await this.supabase
			.from('summaries')
			.update({
				title,
				thumbnail_url: thumbnailUrl,
				updated_at: new Date().toISOString()
			})
			.eq('video_id', videoId);

		if (updateError) {
			console.error('[summary] 타이틀 업데이트 실패:', updateError);
			throw error(500, `타이틀 업데이트 실패: ${updateError.message}`);
		}

		console.log(`[summary] 타이틀 업데이트 완료`);

		try {
			console.log(`[summary] 1단계: 자막/댓글 병렬 수집`);
			await Promise.all([
				this.transcriptionService.collectTranscript(videoId, { force }),
				this.commentService.collectComments(videoId, { maxBatches, force })
			]);

			const { data: transcriptData, error: transcriptError } = await this.supabase
				.from('transcripts')
				.select('data')
				.eq('video_id', videoId)
				.single();

			if (transcriptError) {
				throw error(500, `자막 조회 실패: ${transcriptError.message}`);
			}

			const segments = (transcriptData.data as unknown as TranscriptData)?.segments || [];
			if (segments.length === 0) {
				throw error(400, '자막 세그먼트가 없습니다');
			}

			const { data: commentRecords, error: commentError } = await this.supabase
				.from('comments')
				.select('data')
				.eq('video_id', videoId)
				.order('updated_at', { ascending: false })
				.limit(maxBatches * 20);

			if (commentError) {
				throw error(500, `댓글 조회 실패: ${commentError.message}`);
			}

			const comments = commentRecords
				.map((record) => {
					const commentData = record.data as CommentData;
					return commentData?.content?.text || commentData?.text || '';
				})
				.filter((text) => text.length > 0);

			console.log(`[summary] 수집 완료 - 자막: ${segments.length}개, 댓글: ${comments.length}개`);

			const transcript = segments
				.map((seg) => seg.text || '')
				.join(' ')
				.trim();

			console.log(
				`[summary] 2단계: 마스터 데이터 조회 중 videoId=${videoId}`
			);

			const [{ data: categories }, { data: tags }, { data: metricKeys }] = await Promise.all([
				this.supabase
					.from('categories')
					.select('slug, name, name_ko, description, depth, path')
					.order('depth', { ascending: true }),
				this.supabase.from('tags').select('slug, name, name_ko').limit(100),
				this.supabase.from('content_metric_keys').select('slug, name_ko, description, category_hint')
			]);

			console.log(
				`[summary] 3단계: AI 분석 - 자막 ${transcript.length}자, 댓글 ${comments.length}개`
			);

			const aiInput: AIAnalysisInput = {
				transcript,
				comments,
				existingCategories: (categories || []).map((c) => ({
					slug: c.slug,
					name: c.name,
					name_ko: c.name_ko,
					description: c.description || undefined,
					depth: c.depth,
					path: c.path
				})),
				existingTags: (tags || []).map((t) => ({
					slug: t.slug,
					name: t.name,
					name_ko: t.name_ko
				})),
				existingMetricKeys: (metricKeys || []).map((m) => ({
					slug: m.slug,
					name_ko: m.name_ko,
					description: m.description,
					category_hint: m.category_hint || undefined
				}))
			};

			const aiService = AIService.createFromEnv();
			const analysis = await aiService.analyzeVideo(aiInput, { maxRetries: 3 });

			console.log(`[summary] 4단계: DB 저장`);
			await this.saveSummary(videoId, transcript, comments.length, analysis);

			console.log(`[summary] 4단계: 콘텐츠 분석 (카테고리/태그)`);
			await this.analyzeContent(videoId, analysis);

			console.log(`[summary] 분석 완료 videoId=${videoId}`);
		} catch (err) {
			console.error(`[summary] 분석 실패 videoId=${videoId}`, err);

			await this.supabase.from('summaries').upsert(
				{
					video_id: videoId,
					analysis_status: 'failed',
					updated_at: new Date().toISOString()
				},
				{ onConflict: 'video_id' }
			);

			throw err;
		}
	}



	private async saveSummary(
		videoId: string,
		transcript: string,
		totalComments: number,
		analysis: AIAnalysisOutput
	): Promise<void> {
		const { error: upsertError } = await this.supabase
			.from('summaries')
			.upsert(
				{
					video_id: videoId,
					transcript,
					summary: analysis.summary,
					processing_status: 'completed',
					analysis_status: 'completed',
					analyzed_at: new Date().toISOString(),
					analysis_model: 'gemini-2.0-flash'
				},
				{ onConflict: 'video_id' }
			);

		if (upsertError) {
			console.error('[summary] DB 저장 실패:', upsertError);
			throw error(500, `요약 저장 실패: ${upsertError.message}`);
		}

		const now = new Date().toISOString();
		const { error: communityError } = await this.supabase
			.from('content_community_metrics')
			.upsert(
				{
					video_id: videoId,
					comments_analyzed: totalComments,

					age_teens: analysis.age_groups.teens,
					age_20s: analysis.age_groups.twenties,
					age_30s: analysis.age_groups.thirties,
					age_40plus: analysis.age_groups.forty_plus,
					age_median: analysis.age_groups.median_age,
					age_adult_ratio: analysis.age_groups.adult_ratio,

					emotion_joy: analysis.plutchik_emotions.joy,
					emotion_trust: analysis.plutchik_emotions.trust,
					emotion_fear: analysis.plutchik_emotions.fear,
					emotion_surprise: analysis.plutchik_emotions.surprise,
					emotion_sadness: analysis.plutchik_emotions.sadness,
					emotion_disgust: analysis.plutchik_emotions.disgust,
					emotion_anger: analysis.plutchik_emotions.anger,
					emotion_anticipation: analysis.plutchik_emotions.anticipation,
					emotion_dominant: analysis.plutchik_emotions.dominant_emotion,
					emotion_entropy: analysis.plutchik_emotions.entropy,
					valence_mean: analysis.plutchik_emotions.valence_mean,
					arousal_mean: analysis.plutchik_emotions.arousal_mean,

					representative_comments: analysis.representative_comments,

					framework_version: 'v1.0',
					analysis_model: 'gemini-2.0-flash',
					analyzed_at: now,
					updated_at: now
				},
				{ onConflict: 'video_id' }
			);

		if (communityError) {
			console.error('[summary] 커뮤니티 메트릭 저장 실패:', communityError);
		}

		console.log(`[summary] DB 저장 완료 videoId=${videoId}`);
	}

	async getSummaryFromDB(videoId: string) {
		console.log(`[summary] DB 조회 videoId=${videoId}`);

		const { data, error: fetchError } = await this.supabase
			.from('summaries')
			.select('*')
			.eq('video_id', videoId)
			.maybeSingle();

		if (fetchError) {
			throw error(500, `요약 조회 실패: ${fetchError.message}`);
		}

		console.log(`[summary] DB 조회 완료 summaryId=${data?.id || 'null'}`);

		return data;
	}

	private async analyzeContent(videoId: string, analysis: AIAnalysisOutput) {
		try {
			// Depth 검증
			const maxDepth = Math.max(
				...analysis.categories.map((cat) => {
					let depth = 0;
					let current = cat;
					while (current.parent_slug) {
						depth++;
						current = analysis.categories.find((c) => c.slug === current.parent_slug) || current;
						if (depth > 10) break; // 무한 루프 방지
					}
					return depth;
				}),
				0
			);

			if (maxDepth < 2) {
				console.warn(
					`[analyzeContent] 카테고리 depth 부족: 현재=${maxDepth}, 최소=2 (videoId=${videoId})`
				);
			}

			console.time('Upsert categories');
			const categoryIds: string[] = [];

			// depth 계산 함수
			const calculateDepth = (cat: typeof analysis.categories[0]): number => {
				let depth = 0;
				let current = cat;
				const visited = new Set<string>();
				while (current.parent_slug && !visited.has(current.slug)) {
					visited.add(current.slug);
					depth++;
					const parent = analysis.categories?.find((c) => c.slug === current.parent_slug);
					if (!parent) break;
					current = parent;
					if (depth > 10) break;
				}
				return depth;
			};

			// 부모부터 생성하기 위해 depth 순으로 정렬
			const sortedCategories = (analysis.categories || []).sort((a, b) => {
				return calculateDepth(a) - calculateDepth(b);
			});

			for (const cat of sortedCategories) {
				if (!cat.name || !cat.name_ko) {
					console.warn(`[analyzeContent] 카테고리에 name/name_ko 없음: ${cat.slug}`);
					continue;
				}

				let parentSlug = cat.parent_slug;
				if (parentSlug) {
					const currentIndex = sortedCategories.indexOf(cat);
					const parentInResponse = sortedCategories.find((c, idx) => c.slug === parentSlug && idx < currentIndex);
					const parentInDb = parentInResponse ? null : (await this.supabase.from('categories').select('id').eq('slug', parentSlug).maybeSingle()).data;

					if (!parentInResponse && !parentInDb) {
						console.warn(`[analyzeContent] 부모 카테고리 없음: ${parentSlug}, 루트로 생성: ${cat.slug}`);
						parentSlug = undefined;
					}
				}

				const result = await upsertCategory(this.supabase, {
					slug: cat.slug,
					name: cat.name,
					name_ko: cat.name_ko,
					description: cat.description,
					parent_slug: parentSlug
				});
				categoryIds.push(result.id);
			}
			console.timeEnd('Upsert categories');

			console.time('Upsert tags');
			const tagIds: Array<{ id: string; weight: number }> = [];
			for (const tag of analysis.tags || []) {
				if (!tag.name || !tag.name_ko) {
					console.warn(`[analyzeContent] 태그에 name/name_ko 없음: ${tag.slug}`);
					continue;
				}
				const result = await upsertTag(this.supabase, {
					slug: tag.slug,
					name: tag.name,
					name_ko: tag.name_ko,
					description: tag.description
				});
				tagIds.push({ id: result.id, weight: tag.weight });
			}
			console.timeEnd('Upsert tags');

			console.time('Upsert metric keys');
			for (const key of analysis.metric_keys || []) {
				await upsertMetricKey(this.supabase, {
					slug: key.slug,
					name: key.name,
					name_ko: key.name_ko,
					description: key.description
				});
			}
			console.timeEnd('Upsert metric keys');

			await this.supabase.from('video_categories').delete().eq('video_id', videoId);
			if (categoryIds.length > 0) {
				await this.supabase.from('video_categories').insert(
					categoryIds.map((id, i) => ({
						video_id: videoId,
						category_id: id,
						priority: i + 1
					}))
				);
			}

			await this.supabase.from('video_tags').delete().eq('video_id', videoId);
			if (tagIds.length > 0) {
				await this.supabase.from('video_tags').insert(
					tagIds.map(({ id, weight }) => ({
						video_id: videoId,
						tag_id: id,
						weight
					}))
				);
			}

			const metricsObject = (analysis.metrics || []).reduce(
				(acc: Record<string, { score: number; reasoning: string }>, item) => {
					acc[item.key] = { score: item.score, reasoning: item.reasoning };
					return acc;
				},
				{}
			);

			await this.supabase.from('content_metrics').upsert({
				video_id: videoId,
				metrics: metricsObject,
				updated_at: new Date().toISOString()
			});

			console.log(`[analyzeContent] 콘텐츠 분석 완료 videoId=${videoId}`);
		} catch (err) {
			console.error('[analyzeContent] 콘텐츠 분석 실패 (계속 진행):', err);
		}
	}
}
