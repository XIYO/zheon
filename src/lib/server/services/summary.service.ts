import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database.types';
import { error } from '@sveltejs/kit';
import { TranscriptionService } from './youtube/transcription.service';
import { CommentService } from './youtube/comment.service';
import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { jsonSchema } from 'ai';
import * as v from 'valibot';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { env } from '$env/dynamic/private';
import { getYouTubeClient } from '$lib/server/youtube-proxy';

const VideoAnalysisSchema = {
	type: 'object' as const,
	properties: {
		summary: { type: 'string' as const },
		content_quality: {
			type: 'object' as const,
			properties: {
				educational_value: { type: 'number' as const },
				entertainment_value: { type: 'number' as const },
				information_accuracy: { type: 'number' as const },
				clarity: { type: 'number' as const },
				depth: { type: 'number' as const },
				overall_score: { type: 'number' as const },
				category: { type: 'string' as const },
				target_audience: { type: 'string' as const }
			},
			required: [
				'educational_value',
				'entertainment_value',
				'information_accuracy',
				'clarity',
				'depth',
				'overall_score',
				'category',
				'target_audience'
			]
		},
		sentiment: {
			type: 'object' as const,
			properties: {
				positive_ratio: { type: 'number' as const },
				neutral_ratio: { type: 'number' as const },
				negative_ratio: { type: 'number' as const },
				overall_score: { type: 'number' as const },
				intensity: { type: 'number' as const }
			},
			required: ['positive_ratio', 'neutral_ratio', 'negative_ratio', 'overall_score', 'intensity']
		},
		community: {
			type: 'object' as const,
			properties: {
				politeness: { type: 'number' as const },
				rudeness: { type: 'number' as const },
				kindness: { type: 'number' as const },
				toxicity: { type: 'number' as const },
				constructive: { type: 'number' as const },
				self_centered: { type: 'number' as const },
				off_topic: { type: 'number' as const },
				overall_score: { type: 'number' as const }
			},
			required: [
				'politeness',
				'rudeness',
				'kindness',
				'toxicity',
				'constructive',
				'self_centered',
				'off_topic',
				'overall_score'
			]
		},
		age_groups: {
			type: 'object' as const,
			properties: {
				teens: { type: 'number' as const },
				twenties: { type: 'number' as const },
				thirties: { type: 'number' as const },
				forty_plus: { type: 'number' as const }
			},
			required: ['teens', 'twenties', 'thirties', 'forty_plus']
		},
		insights: {
			type: 'object' as const,
			properties: {
				content_summary: { type: 'string' as const },
				audience_reaction: { type: 'string' as const },
				key_insights: { type: 'array' as const, items: { type: 'string' as const } },
				recommendations: { type: 'array' as const, items: { type: 'string' as const } }
			},
			required: ['content_summary', 'audience_reaction', 'key_insights', 'recommendations']
		}
	},
	required: ['summary', 'content_quality', 'sentiment', 'community', 'age_groups', 'insights']
};

const VideoAnalysisValidationSchema = v.object({
	summary: v.pipe(v.string(), v.minLength(1), v.maxLength(1000)),
	content_quality: v.object({
		educational_value: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
		entertainment_value: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
		information_accuracy: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
		clarity: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
		depth: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
		overall_score: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
		category: v.pipe(v.string(), v.minLength(1)),
		target_audience: v.pipe(v.string(), v.minLength(1))
	}),
	sentiment: v.object({
		positive_ratio: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
		neutral_ratio: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
		negative_ratio: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
		overall_score: v.pipe(v.number(), v.minValue(-100), v.maxValue(100), v.integer()),
		intensity: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer())
	}),
	community: v.object({
		politeness: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
		rudeness: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
		kindness: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
		toxicity: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
		constructive: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
		self_centered: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
		off_topic: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
		overall_score: v.pipe(v.number(), v.minValue(-100), v.maxValue(100), v.integer())
	}),
	age_groups: v.object({
		teens: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
		twenties: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
		thirties: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
		forty_plus: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer())
	}),
	insights: v.object({
		content_summary: v.pipe(v.string(), v.minLength(1), v.maxLength(1000)),
		audience_reaction: v.pipe(v.string(), v.minLength(1), v.maxLength(1000)),
		key_insights: v.pipe(v.array(v.string()), v.minLength(1), v.maxLength(10)),
		recommendations: v.pipe(v.array(v.string()), v.minLength(0), v.maxLength(10))
	})
});

export interface AnalyzeSummaryOptions {
	maxBatches?: number;
	force?: boolean;
	geminiApiKey: string;
}

export class SummaryService {
	private transcriptionService: TranscriptionService;
	private commentService: CommentService;

	constructor(private supabase: SupabaseClient<Database>) {
		this.transcriptionService = new TranscriptionService(supabase);
		this.commentService = new CommentService(supabase);
	}

	async analyzeSummary(videoId: string, options: AnalyzeSummaryOptions): Promise<void> {
		const { maxBatches = 5, force = false, geminiApiKey } = options;

		if (!geminiApiKey) {
			throw error(500, 'GEMINI_API_KEY가 설정되지 않았습니다');
		}

		console.log(`[summary] 분석 시작 videoId=${videoId}`);

		const url = `https://www.youtube.com/watch?v=${videoId}`;

		const yt = await getYouTubeClient();
		const video = await yt.getBasicInfo(videoId);
		const title = video.basic_info.title || '';
		const thumbnailUrl =
			video.basic_info.thumbnail?.at(0)?.url || `https://i.ytimg.com/vi/${videoId}/default.jpg`;

		await this.supabase
			.from('summaries')
			.update({
				title,
				thumbnail_url: thumbnailUrl,
				updated_at: new Date().toISOString()
			})
			.eq('url', url);

		if (!force) {
			const { data: existing } = await this.supabase
				.from('summaries')
				.select('id, analysis_status')
				.eq('url', url)
				.maybeSingle();

			if (existing?.analysis_status === 'completed') {
				console.log(`[summary] 이미 분석 완료 summaryId=${existing.id}`);
				return;
			}
		}

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

			const segments = (transcriptData.data as any)?.segments || [];
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
					const commentData = record.data as any;
					return commentData?.content?.text || commentData?.text || '';
				})
				.filter((text) => text.length > 0);

			console.log(`[summary] 수집 완료 - 자막: ${segments.length}개, 댓글: ${comments.length}개`);

			const transcript = segments
				.map((seg: any) => seg.text || '')
				.join(' ')
				.trim();

			console.log(
				`[summary] 2단계: AI 분석 - 자막 ${transcript.length}자, 댓글 ${comments.length}개`
			);

			const analysis = await this.performAIAnalysis(transcript, comments, geminiApiKey);

			console.log(`[summary] 3단계: DB 저장`);
			await this.saveSummary(videoId, url, transcript, comments.length, analysis);

			console.log(`[summary] 분석 완료 videoId=${videoId}`);
		} catch (err) {
			console.error(`[summary] 분석 실패 videoId=${videoId}`, err);

			await this.supabase.from('summaries').upsert(
				{
					url,
					analysis_status: 'failed',
					updated_at: new Date().toISOString()
				},
				{ onConflict: 'url' }
			);

			throw err;
		}
	}

	private async performAIAnalysis(transcript: string, comments: string[], geminiApiKey: string) {
		const commentsText = comments
			.slice(0, 100)
			.map((c, i) => `${i + 1}. ${c}`)
			.join('\n');

		const prompt = `당신은 YouTube 영상 분석 전문가입니다. 자막과 댓글을 깊이 있게 분석하여 영상의 핵심 내용과 시청자 반응을 파악하세요.

[자막 원문]
${transcript}

[댓글 상위 100개]
${commentsText}

다음 항목들을 분석하세요:

1. summary (영상 요약, 500자 내외):
   - 영상이 전달하고자 하는 핵심 메시지를 명확히 요약
   - 주요 논점, 주장, 결론을 포함
   - 영상의 흐름과 구조를 반영
   - 시청자가 이 요약만 읽어도 영상의 본질을 이해할 수 있도록 작성
   - 단순 내용 나열이 아닌, 맥락과 의미를 담은 요약

2. content_quality (콘텐츠 품질 평가, 각 0-100):
   - educational_value: 교육적 가치, 학습 효과
   - entertainment_value: 재미, 흥미, 몰입도
   - information_accuracy: 정보의 정확성, 신뢰성
   - clarity: 설명의 명확성, 이해 용이성
   - depth: 내용의 깊이, 전문성
   - overall_score: 종합 품질 점수
   - category: 콘텐츠 카테고리 (예: 교육, 엔터테인먼트, 뉴스, 리뷰 등)
   - target_audience: 타겟 시청자층 (예: 학생, 직장인, 전문가 등)

3. sentiment (감정 분석, 댓글 기반):
   - positive_ratio: 긍정 비율 (0-100)
   - neutral_ratio: 중립 비율 (0-100)
   - negative_ratio: 부정 비율 (0-100)
   - 위 세 비율의 합은 반드시 100이어야 함
   - overall_score: 전체 감정 점수 (-100 ~ 100)
     * -100: 매우 부정적 (비판, 분노, 실망)
     * 0: 중립적 (객관적 의견, 사실 전달)
     * +100: 매우 긍정적 (칭찬, 감동, 공감)
   - intensity: 감정 강도 (0-100, 감정 표현의 강렬함)

4. community (커뮤니티 분위기, 댓글 기반, 각 0-100):
   - politeness: 예의 바른 표현
   - rudeness: 무례한 표현
   - kindness: 친절하고 배려 있는 태도
   - toxicity: 독성, 공격성
   - constructive: 건설적 의견
   - self_centered: 자기중심적 댓글
   - off_topic: 주제 이탈
   - overall_score: 커뮤니티 전체 점수 (-100 ~ 100)
     * -100: 매우 부정적 커뮤니티 (독성, 공격성)
     * +100: 매우 긍정적 커뮤니티 (건설적, 우호적)

5. age_groups (시청자 연령 추정, 댓글 어투/내용 기반):
   - teens: 10대 비율 (0-100)
   - twenties: 20대 비율 (0-100)
   - thirties: 30대 비율 (0-100)
   - forty_plus: 40대 이상 비율 (0-100)
   - 네 연령대 합은 반드시 100이어야 함

6. insights (심층 인사이트):
   - content_summary: 영상 콘텐츠 핵심 정리 (1000자 이내, 주요 논점과 결론)
   - audience_reaction: 시청자 반응 종합 (1000자 이내, 댓글 분석을 통한 수용도 파악)
   - key_insights: 핵심 인사이트 배열 (1-10개, 영상에서 발견한 중요한 통찰)
   - recommendations: 개선 제안 배열 (0-10개, 크리에이터를 위한 구체적 조언)

JSON 스키마에 정확히 맞춰 응답하세요.`;

		const socksProxy = env.TOR_SOCKS5_PROXY;
		if (!socksProxy) {
			throw new Error('TOR_SOCKS5_PROXY not configured');
		}

		const proxyAgent = new SocksProxyAgent(socksProxy);
		let requestCounter = 0;
		const customFetch = async (url: RequestInfo | URL, options?: RequestInit) => {
			const requestId = ++requestCounter;
			const label = `[AI Proxy #${requestId}] ${url}`;
			console.time(label);
			try {
				const response = await fetch(url, {
					...options,
					// @ts-ignore Node.js fetch agent support
					agent: proxyAgent
				});
				console.timeEnd(label);
				return response;
			} catch (err) {
				console.timeEnd(label);
				console.error('[AI Proxy] 프록시 fetch 실패:', err);
				throw err;
			}
		};
		console.log(`[summary] SOCKS5 프록시 사용: ${socksProxy}`);

		const google = createGoogleGenerativeAI({
			apiKey: geminiApiKey,
			fetch: customFetch
		});
		const model = google('gemini-2.0-flash-exp');

		console.log('[summary] AI 분석 시작');

		const result = await generateObject({
			model,
			schema: jsonSchema(VideoAnalysisSchema),
			schemaName: 'VideoAnalysis',
			schemaDescription:
				'Comprehensive video analysis with quality, sentiment, and community metrics',
			temperature: 0.3,
			maxRetries: 0,
			prompt
		});

		const rawAnalysis = result.object as any;
		const validationResult = v.safeParse(VideoAnalysisValidationSchema, rawAnalysis);

		let analysis;
		if (validationResult.success) {
			console.log('[summary] AI 검증 성공');
			analysis = validationResult.output;
		} else {
			console.warn(
				'[summary] AI 검증 실패:',
				validationResult.issues.map((i) => `${i.path?.join('.')}: ${i.message}`).join(', ')
			);
			console.warn('[summary] 원본 데이터 사용');
			analysis = rawAnalysis;
		}

		const sentimentSum =
			analysis.sentiment.positive_ratio +
			analysis.sentiment.neutral_ratio +
			analysis.sentiment.negative_ratio;
		const ageGroupSum =
			analysis.age_groups.teens +
			analysis.age_groups.twenties +
			analysis.age_groups.thirties +
			analysis.age_groups.forty_plus;

		if (sentimentSum !== 100) {
			const scale = 100 / sentimentSum;
			analysis.sentiment.positive_ratio = Math.round(analysis.sentiment.positive_ratio * scale);
			analysis.sentiment.neutral_ratio = Math.round(analysis.sentiment.neutral_ratio * scale);
			analysis.sentiment.negative_ratio =
				100 - analysis.sentiment.positive_ratio - analysis.sentiment.neutral_ratio;
		}

		if (ageGroupSum !== 100) {
			const scale = 100 / ageGroupSum;
			analysis.age_groups.teens = Math.round(analysis.age_groups.teens * scale);
			analysis.age_groups.twenties = Math.round(analysis.age_groups.twenties * scale);
			analysis.age_groups.thirties = Math.round(analysis.age_groups.thirties * scale);
			analysis.age_groups.forty_plus =
				100 -
				analysis.age_groups.teens -
				analysis.age_groups.twenties -
				analysis.age_groups.thirties;
		}

		return analysis;
	}

	private async saveSummary(
		videoId: string,
		url: string,
		transcript: string,
		totalComments: number,
		analysis: any
	): Promise<void> {
		const { error: upsertError } = await this.supabase.from('summaries').upsert(
			{
				url,
				transcript,
				summary: analysis.summary,
				processing_status: 'completed',

				content_quality_score: analysis.content_quality.overall_score,
				content_educational_value: analysis.content_quality.educational_value,
				content_entertainment_value: analysis.content_quality.entertainment_value,
				content_information_accuracy: analysis.content_quality.information_accuracy,
				content_clarity: analysis.content_quality.clarity,
				content_depth: analysis.content_quality.depth,
				content_category: analysis.content_quality.category,
				content_target_audience: analysis.content_quality.target_audience,

				sentiment_overall_score: analysis.sentiment.overall_score,
				sentiment_positive_ratio: analysis.sentiment.positive_ratio,
				sentiment_neutral_ratio: analysis.sentiment.neutral_ratio,
				sentiment_negative_ratio: analysis.sentiment.negative_ratio,
				sentiment_intensity: analysis.sentiment.intensity,

				community_quality_score: analysis.community.overall_score,
				community_politeness: analysis.community.politeness,
				community_rudeness: analysis.community.rudeness,
				community_kindness: analysis.community.kindness,
				community_toxicity: analysis.community.toxicity,
				community_constructive: analysis.community.constructive,
				community_self_centered: analysis.community.self_centered,
				community_off_topic: analysis.community.off_topic,

				age_group_teens: analysis.age_groups.teens,
				age_group_20s: analysis.age_groups.twenties,
				age_group_30s: analysis.age_groups.thirties,
				age_group_40plus: analysis.age_groups.forty_plus,

				ai_content_summary: analysis.insights.content_summary,
				ai_audience_reaction: analysis.insights.audience_reaction,
				ai_key_insights: analysis.insights.key_insights,
				ai_recommendations: analysis.insights.recommendations,

				total_comments_analyzed: Math.min(totalComments, 100),
				analysis_status: 'completed',
				analyzed_at: new Date().toISOString(),
				analysis_model: 'gemini-2.0-flash-exp'
			},
			{ onConflict: 'url' }
		);

		if (upsertError) {
			console.error('[summary] DB 저장 실패:', upsertError);
			throw error(500, `요약 저장 실패: ${upsertError.message}`);
		}

		console.log(`[summary] DB 저장 완료 videoId=${videoId}`);
	}

	async getSummaryFromDB(videoId: string) {
		console.log(`[summary] DB 조회 videoId=${videoId}`);

		const { data, error: fetchError } = await this.supabase
			.from('summaries')
			.select('*')
			.eq('url', `https://www.youtube.com/watch?v=${videoId}`)
			.maybeSingle();

		if (fetchError) {
			throw error(500, `요약 조회 실패: ${fetchError.message}`);
		}

		console.log(`[summary] DB 조회 완료 summaryId=${data?.id || 'null'}`);

		return data;
	}
}
