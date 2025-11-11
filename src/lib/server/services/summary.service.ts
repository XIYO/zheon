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
import type { Innertube } from 'youtubei.js';
import { upsertCategory, upsertTag, upsertMetricKey } from '$lib/server/content-analysis';

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
				forty_plus: { type: 'number' as const },
				median_age: { type: 'number' as const },
				adult_ratio: { type: 'number' as const }
			},
			required: ['teens', 'twenties', 'thirties', 'forty_plus', 'median_age', 'adult_ratio']
		},
		plutchik_emotions: {
			type: 'object' as const,
			properties: {
				joy: { type: 'number' as const },
				trust: { type: 'number' as const },
				fear: { type: 'number' as const },
				surprise: { type: 'number' as const },
				sadness: { type: 'number' as const },
				disgust: { type: 'number' as const },
				anger: { type: 'number' as const },
				anticipation: { type: 'number' as const },
				dominant_emotion: { type: 'string' as const },
				entropy: { type: 'number' as const },
				valence_mean: { type: 'number' as const },
				arousal_mean: { type: 'number' as const }
			},
			required: [
				'joy',
				'trust',
				'fear',
				'surprise',
				'sadness',
				'disgust',
				'anger',
				'anticipation',
				'dominant_emotion',
				'entropy',
				'valence_mean',
				'arousal_mean'
			]
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
		},
		representative_comments: {
			type: 'object' as const,
			properties: {
				age_groups: {
					type: 'object' as const,
					properties: {
						teens: { type: 'string' as const },
						twenties: { type: 'string' as const },
						thirties: { type: 'string' as const },
						forty_plus: { type: 'string' as const }
					},
					required: ['teens', 'twenties', 'thirties', 'forty_plus']
				},
				emotions: {
					type: 'object' as const,
					properties: {
						joy: { type: 'string' as const },
						trust: { type: 'string' as const },
						fear: { type: 'string' as const },
						surprise: { type: 'string' as const },
						sadness: { type: 'string' as const },
						disgust: { type: 'string' as const },
						anger: { type: 'string' as const },
						anticipation: { type: 'string' as const }
					},
					required: ['joy', 'trust', 'fear', 'surprise', 'sadness', 'disgust', 'anger', 'anticipation']
				}
			},
			required: ['age_groups', 'emotions']
		},
		categories: {
			type: 'array' as const,
			items: {
				type: 'object' as const,
				properties: {
					slug: { type: 'string' as const },
					name: { type: 'string' as const },
					name_ko: { type: 'string' as const },
					description: { type: 'string' as const },
					parent_slug: { type: 'string' as const }
				},
				required: ['slug', 'name', 'name_ko']
			}
		},
		tags: {
			type: 'array' as const,
			items: {
				type: 'object' as const,
				properties: {
					slug: { type: 'string' as const },
					name: { type: 'string' as const },
					name_ko: { type: 'string' as const },
					description: { type: 'string' as const },
					weight: { type: 'number' as const }
				},
				required: ['slug', 'name', 'name_ko', 'weight']
			}
		},
		metric_keys: {
			type: 'array' as const,
			items: {
				type: 'object' as const,
				properties: {
					slug: { type: 'string' as const },
					name: { type: 'string' as const },
					name_ko: { type: 'string' as const },
					description: { type: 'string' as const }
				},
				required: ['slug', 'name', 'name_ko', 'description']
			}
		},
		metrics: {
			type: 'array' as const,
			items: {
				type: 'object' as const,
				properties: {
					key: { type: 'string' as const },
					score: { type: 'number' as const },
					reasoning: { type: 'string' as const }
				},
				required: ['key', 'score', 'reasoning']
			}
		}
	},
	required: [
		'summary',
		'content_quality',
		'sentiment',
		'community',
		'age_groups',
		'plutchik_emotions',
		'insights',
		'representative_comments',
		'categories',
		'tags',
		'metric_keys',
		'metrics'
	]
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
		category: v.pipe(v.string(), v.minLength(1), v.maxLength(50)),
		target_audience: v.pipe(v.string(), v.minLength(1), v.maxLength(100))
	}),
	sentiment: v.pipe(
		v.object({
			positive_ratio: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
			neutral_ratio: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
			negative_ratio: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
			overall_score: v.pipe(v.number(), v.minValue(-100), v.maxValue(100), v.integer()),
			intensity: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer())
		}),
		v.check(
			(obj) => obj.positive_ratio + obj.neutral_ratio + obj.negative_ratio === 100,
			'sentiment 비율의 합은 100이어야 합니다'
		)
	),
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
	age_groups: v.pipe(
		v.object({
			teens: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
			twenties: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
			thirties: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
			forty_plus: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
			median_age: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
			adult_ratio: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer())
		}),
		v.check(
			(obj) => obj.teens + obj.twenties + obj.thirties + obj.forty_plus === 100,
			'age_groups 비율의 합은 100이어야 합니다'
		)
	),
	plutchik_emotions: v.pipe(
		v.object({
			joy: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
			trust: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
			fear: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
			surprise: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
			sadness: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
			disgust: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
			anger: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
			anticipation: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
			dominant_emotion: v.pipe(
				v.string(),
				v.picklist(['joy', 'trust', 'fear', 'surprise', 'sadness', 'disgust', 'anger', 'anticipation'])
			),
			entropy: v.pipe(v.number(), v.minValue(0), v.maxValue(10)),
			valence_mean: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
			arousal_mean: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer())
		}),
		v.check(
			(obj) => obj.joy + obj.trust + obj.fear + obj.surprise + obj.sadness + obj.disgust + obj.anger + obj.anticipation === 100,
			'plutchik_emotions 비율의 합은 100이어야 합니다'
		)
	),
	insights: v.object({
		content_summary: v.pipe(v.string(), v.minLength(1), v.maxLength(1000)),
		audience_reaction: v.pipe(v.string(), v.minLength(1), v.maxLength(1000)),
		key_insights: v.pipe(
			v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(500))),
			v.minLength(1),
			v.maxLength(10)
		),
		recommendations: v.pipe(
			v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(500))),
			v.minLength(0),
			v.maxLength(10)
		)
	}),
	representative_comments: v.pipe(
		v.object({
			age_groups: v.object({
				teens: v.pipe(v.string(), v.maxLength(1000)),
				twenties: v.pipe(v.string(), v.maxLength(1000)),
				thirties: v.pipe(v.string(), v.maxLength(1000)),
				forty_plus: v.pipe(v.string(), v.maxLength(1000))
			}),
			emotions: v.object({
				joy: v.pipe(v.string(), v.maxLength(1000)),
				trust: v.pipe(v.string(), v.maxLength(1000)),
				fear: v.pipe(v.string(), v.maxLength(1000)),
				surprise: v.pipe(v.string(), v.maxLength(1000)),
				sadness: v.pipe(v.string(), v.maxLength(1000)),
				disgust: v.pipe(v.string(), v.maxLength(1000)),
				anger: v.pipe(v.string(), v.maxLength(1000)),
				anticipation: v.pipe(v.string(), v.maxLength(1000))
			})
		}),
		v.check((obj) => {
			const allComments = [
				...Object.values(obj.age_groups),
				...Object.values(obj.emotions)
			];
			for (const comment of allComments) {
				if (comment === '-') continue;
				const hasEnglishWords = /[a-zA-Z]{3,}/.test(comment);
				if (hasEnglishWords) return false;
			}
			return true;
		}, '대표 댓글에 영어 단어가 포함되어 있습니다. 반드시 한국어로 번역해야 합니다.')
	),
	categories: v.pipe(
		v.array(
			v.object({
				slug: v.pipe(
					v.string(),
					v.minLength(1),
					v.maxLength(50),
					v.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug는 소문자, 숫자, 하이픈만 허용 (예: web-development)')
				),
				name: v.pipe(
					v.string(),
					v.minLength(1),
					v.maxLength(50),
					v.regex(/^[a-z][a-z0-9_]*$/, 'name은 소문자로 시작, 소문자/숫자/언더스코어만 허용')
				),
				name_ko: v.pipe(v.string(), v.minLength(1), v.maxLength(50)),
				description: v.optional(v.pipe(v.string(), v.maxLength(500))),
				parent_slug: v.optional(
					v.pipe(
						v.string(),
						v.minLength(1),
						v.maxLength(50),
						v.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'parent_slug는 소문자, 숫자, 하이픈만 허용')
					)
				)
			})
		),
		v.minLength(3),
		v.maxLength(20)
	),
	tags: v.pipe(
		v.array(
			v.object({
				slug: v.pipe(
					v.string(),
					v.minLength(1),
					v.maxLength(50),
					v.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug는 소문자, 숫자, 하이픈만 허용 (예: machine-learning)')
				),
				name: v.pipe(
					v.string(),
					v.minLength(1),
					v.maxLength(50),
					v.regex(/^[a-z][a-z0-9_]*$/, 'name은 소문자로 시작, 소문자/숫자/언더스코어만 허용')
				),
				name_ko: v.pipe(v.string(), v.minLength(1), v.maxLength(50)),
				description: v.optional(v.pipe(v.string(), v.maxLength(500))),
				weight: v.pipe(v.number(), v.minValue(0.1), v.maxValue(1))
			})
		),
		v.minLength(5),
		v.maxLength(15)
	),
	metric_keys: v.pipe(
		v.array(
			v.object({
				slug: v.pipe(
					v.string(),
					v.minLength(1),
					v.maxLength(50),
					v.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug는 kebab-case만 허용 (소문자+숫자+하이픈, 예: beginner-friendliness, video-quality)')
				),
				name: v.pipe(v.string(), v.minLength(1), v.maxLength(50)),
				name_ko: v.pipe(v.string(), v.minLength(1), v.maxLength(50)),
				description: v.pipe(v.string(), v.minLength(1), v.maxLength(500))
			})
		),
		v.length(6)
	),
	metrics: v.pipe(
		v.array(
			v.object({
				key: v.pipe(
					v.string(),
					v.minLength(1),
					v.maxLength(50),
					v.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'key는 kebab-case만 허용 (소문자+숫자+하이픈, 예: video-quality)')
				),
				score: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
				reasoning: v.pipe(v.string(), v.minLength(1), v.maxLength(500))
			})
		),
		v.length(6)
	)
});

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

			const segments = (transcriptData.data as TranscriptData)?.segments || [];
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
				`[summary] 2단계: AI 분석 - 자막 ${transcript.length}자, 댓글 ${comments.length}개`
			);

			const analysis = await this.performAIAnalysis(transcript, comments, geminiApiKey, videoId);

			console.log(`[summary] 3단계: DB 저장`);
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


	private async performAIAnalysis(
		transcript: string,
		comments: string[],
		geminiApiKey: string,
		videoId: string
	) {
		console.log(`[summary] 마스터 데이터 조회 중 videoId=${videoId}`);

		const [{ data: categories }, { data: tags }, { data: metricKeys }] = await Promise.all([
			this.supabase
				.from('categories')
				.select('slug, name, name_ko, description, depth, path')
				.order('depth', { ascending: true }),
			this.supabase.from('tags').select('slug, name, name_ko').limit(100),
			this.supabase.from('content_metric_keys').select('slug, name_ko, description, category_hint')
		]);

		const categoryList = (categories || [])
			.map((c) => `${'  '.repeat(c.depth)}- ${c.slug} (${c.name_ko})`)
			.join('\n');
		const tagList = (tags || []).map((t) => `- ${t.slug} (${t.name} / ${t.name_ko})`).join('\n');
		const metricList = (metricKeys || [])
			.map((m) => `- ${m.slug} (${m.name_ko}): ${m.description}`)
			.join('\n');

		const commentsText = comments.slice(0, 100).join('\n');

		const prompt = `당신은 YouTube 영상 분석 전문가입니다. 자막과 댓글을 깊이 있게 분석하여 영상의 핵심 내용과 시청자 반응을 파악하세요.

**전역 규칙 (모든 응답에 적용):**
1. **언어**: 모든 텍스트 응답은 한국어로 작성 (summary, insights, representative_comments 등)
2. **숫자**: 모든 숫자 값은 정수로 작성, 소수점 사용 금지 (예: 90, 90.5 금지)
3. **번역**: 영어 댓글은 자연스러운 한국어로 번역하여 제공
4. **길이 제한 (엄격):**
   - slug/name: 최대 50자
   - name_ko: 최대 50자
   - 댓글: 최대 1000자
   - 인사이트 항목: 최대 500자
   - description/reasoning: 최대 500자
5. **필수 형식 (정규식 검증됨):**
   - slug (카테고리/태그): 소문자+숫자+하이픈 (예: web-development)
   - name/slug (지표): 소문자로 시작+언더스코어 (예: editing_speed)
   - weight: 0.1 이상 1.0 이하

[자막 원문]
${transcript}

[댓글 상위 30개]
${commentsText}

다음 항목들을 분석하세요:

1. summary (영상 요약, 500자 내외, 한국어로 작성):
   - 영상이 전달하고자 하는 핵심 메시지를 명확히 요약
   - 주요 논점, 주장, 결론을 포함
   - 영상의 흐름과 구조를 반영
   - 시청자가 이 요약만 읽어도 영상의 본질을 이해할 수 있도록 작성
   - 단순 내용 나열이 아닌, 맥락과 의미를 담은 요약
   - **영어 자막이더라도 반드시 한국어로 요약 작성**

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
   **필수 검증: positive_ratio + neutral_ratio + negative_ratio = 정확히 100**
   - positive_ratio: 긍정 비율 (0-100, 정수)
   - neutral_ratio: 중립 비율 (0-100, 정수)
   - negative_ratio: 부정 비율 (0-100, 정수)
   - 합이 100이 아니면 시스템 에러 발생
   - overall_score: 전체 감정 점수 (-100 ~ 100, 정수)
   - intensity: 감정 강도 (0-100, 정수)

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
   **필수 검증: teens + twenties + thirties + forty_plus = 정확히 100**
   - teens: 10대 비율 (0-100, 정수)
   - twenties: 20대 비율 (0-100, 정수)
   - thirties: 30대 비율 (0-100, 정수)
   - forty_plus: 40대 이상 비율 (0-100, 정수)
   - 합이 100이 아니면 시스템 에러 발생
   - median_age: 중앙값 나이 (0-100, 정수)
   - adult_ratio: 성인 비율 (0-100, 정수, 20대 이상)

6. plutchik_emotions (Plutchik 8가지 기본 감정 + VAD, 댓글 기반):
   **!!!!! 필수 검증: 8가지 감정 비율의 합 = 정확히 100 (99나 101 아님, 반드시 100) !!!!!**

   **합계 계산 필수 단계:**
   1. 먼저 각 감정 비율을 정수로 할당
   2. 8개 값을 모두 더해서 합계 확인
   3. 합계가 100이 아니면 값들을 조정하여 정확히 100으로 맞춤
   4. 조정 후 다시 합계 확인하여 100인지 검증

   **감정 비율 (모두 정수, 합계 = 100):**
   - joy: 기쁨 (0-100, 정수)
   - trust: 신뢰 (0-100, 정수)
   - fear: 공포 (0-100, 정수)
   - surprise: 놀람 (0-100, 정수)
   - sadness: 슬픔 (0-100, 정수)
   - disgust: 혐오 (0-100, 정수)
   - anger: 분노 (0-100, 정수)
   - anticipation: 기대 (0-100, 정수)

   **검증 공식: joy + trust + fear + surprise + sadness + disgust + anger + anticipation = 100**
   - 합이 99 이하 또는 101 이상이면 시스템 에러 발생
   - 반드시 정확히 100이어야 함

   **기타 필드:**
   - dominant_emotion: 지배 감정 (8개 중 가장 높은 값, 예: "joy")
   - entropy: 감정 분포 엔트로피 (0-10, 소수점 허용)
   - valence_mean: 감정가 평균 (0-100, 정수)
   - arousal_mean: 각성 평균 (0-100, 정수)

7. insights (심층 인사이트, 모두 한국어로 작성):
   - content_summary: 영상 콘텐츠 핵심 정리 (1000자 이내, 주요 논점과 결론, 한국어)
   - audience_reaction: 시청자 반응 종합 (1000자 이내, 댓글 분석을 통한 수용도 파악, 한국어)
   - key_insights: 핵심 인사이트 배열 (1-10개, 영상에서 발견한 중요한 통찰, 한국어)
   - recommendations: 개선 제안 배열 (0-10개, 크리에이터를 위한 구체적 조언, 한국어)

8. representative_comments (대표 댓글 추출):
   **절대 규칙 (시스템 검증됨):**

   **!!!!! 최우선 규칙: 모든 댓글 한국어 번역 !!!!!**
   **!!!!! CRITICAL: ALL COMMENTS MUST BE IN KOREAN !!!!!**

   **언어 처리 (최우선 규칙 - 검증 실패시 전체 응답 거부됨):**
   1. **한국어 댓글**: 이모지 포함하여 원문 그대로 복사
   2. **영어/외국어 댓글**: 100% 반드시 한국어로 번역
      - 영어 그대로 반환 = 시스템 에러 = 전체 분석 실패
      - 모든 영어 단어를 한국어로 번역해야 함
      - 3글자 이상 영어 단어가 1개라도 있으면 검증 실패
   3. **번역 필수 예시**:
      - 원문: "This is amazing!" → 반환: "정말 놀랍네요!" (O)
      - 원문: "This is amazing!" → 반환: "This is amazing!" (X 시스템 에러)
      - 원문: "I did not know golden retrievers could be very scary" → 반환: "골든 리트리버가 이렇게 무서울 수 있는지 몰랐어요" (O)
      - 원문: "I did not know golden retrievers could be very scary" → 반환: "golden retrievers가 무서울 줄 몰랐어요" (X 시스템 에러)
      - 원문: "LMAO 😂😂😂" → 반환: "완전 웃기네 😂😂😂" (O)
      - 원문: "😂😂😂😂" → 반환: "😂😂😂😂" (O, 이모지만 있으면 그대로 가능)
   4. **검증 규칙**: 정규식 /[a-zA-Z]{3,}/로 3글자 이상 영어 단어 감지
      - 감지되면 즉시 전체 응답 거부
      - 이모지/숫자/기호는 허용

   **번역 체크리스트 (12개 댓글 모두 확인):**
   - [ ] age_groups.teens: 영어 없음
   - [ ] age_groups.twenties: 영어 없음
   - [ ] age_groups.thirties: 영어 없음
   - [ ] age_groups.forty_plus: 영어 없음
   - [ ] emotions.joy: 영어 없음
   - [ ] emotions.trust: 영어 없음
   - [ ] emotions.fear: 영어 없음
   - [ ] emotions.surprise: 영어 없음
   - [ ] emotions.sadness: 영어 없음
   - [ ] emotions.disgust: 영어 없음
   - [ ] emotions.anger: 영어 없음
   - [ ] emotions.anticipation: 영어 없음

   **선택 규칙:**
   1. **광고/홍보 댓글 제외**: URL, 상품 홍보, 채널 홍보 금지
   2. **중복 사용 금지**: 같은 댓글을 여러 카테고리에 사용 금지
   3. **실제 사용자 반응**: 영상에 대한 순수한 의견/반응/질문만 선택
   4. **다양성 확보**: 최대한 다른 댓글 선택

   - age_groups: 각 연령대 대표 댓글 1개씩 (무조건 한국어로 번역)
     * teens, twenties, thirties, forty_plus

   - emotions: 각 감정 대표 댓글 1개씩 (무조건 한국어로 번역)
     * joy, trust, fear, surprise, sadness, disgust, anger, anticipation

   주의사항:
   - 댓글은 반드시 위 [댓글 상위 30개] 목록에서 선택
   - 적합한 댓글이 없으면 "-" 문자열만 반환
   - **다시 한번 강조: 영어 댓글을 영어 그대로 반환하면 전체 분석이 실패하고 처음부터 다시 해야 함**
   - **모든 댓글을 한국어로 번역했는지 응답 전에 반드시 재확인**

9. categories (최소 3개, depth 최소 2):
   **필수 규칙:**
   1. **배열 순서**: 반드시 부모 → 자식 순서로 배열에 배치 (루트가 먼저)
   2. **parent_slug 검증**: parent_slug는 다음 중 하나만 가능
      - 아래 [기존 카테고리]에 있는 slug
      - 같은 응답 배열의 앞부분에 정의한 카테고리의 slug
   3. **parent_slug 형식**: 바로 위 부모의 slug만 입력, 경로 아님
   4. **필수 필드**: slug, name, name_ko (description은 선택)
   5. **slug 형식**: 소문자 + 숫자 + 하이픈만 (예: "web-development", "ai-ml")
   6. **name 형식**: 소문자로 시작, 언더스코어 허용 (예: "web_development", "technology")

   올바른 예시:
   첫 번째: slug: "technology", name: "technology", name_ko: "기술"
   두 번째: slug: "programming", name: "programming", name_ko: "프로그래밍", parent_slug: "technology"
   세 번째: slug: "web-development", name: "web_development", name_ko: "웹 개발", parent_slug: "programming"

   [기존 카테고리]
${categoryList || '(없음)'}

10. tags (최소 5개):
    **필수 규칙:**
    1. **필수 필드**: slug, name, name_ko, weight (description은 선택)
    2. **slug 형식**: 소문자 + 숫자 + 하이픈만 (예: "machine-learning", "web-dev")
    3. **name 형식**: 소문자로 시작, 언더스코어 허용 (예: "machine_learning", "web_dev")
    4. **weight**: 중요도 0.1~1.0 (가장 중요한 태그가 1.0에 가깝게)

    참고 (기존 태그, 새로 만들어도 됨):
${tagList || '(없음)'}

11. metric_keys (정확히 6개):
    **!!!!! 중요: slug는 URL용 kebab-case, name은 디스플레이용 자연스러운 영문 표현 !!!!!**

    **필수 규칙:**
    1. **필수 필드**: slug, name, name_ko, description
    2. **필드 형식:**
       - **slug**: kebab-case, URL/ID용 (소문자 + 숫자 + 하이픈)
         * 올바른 예: "video-quality", "editing-speed", "audio-clarity", "beginner-friendliness"
         * 잘못된 예: "video_quality" (언더스코어), "VideoQuality" (대문자), "1video" (숫자로 시작)
       - **name**: 자연스러운 영문 표현, 디스플레이용 (공백/대문자 허용)
         * 올바른 예: "Video Quality", "Editing Speed", "Audio Clarity", "Beginner Friendliness"
         * 잘못된 예: "video_quality" (언더스코어), "VIDEO QUALITY" (전체 대문자)
       - **name_ko**: 한글 디스플레이 (예: "영상 품질", "편집 속도", "음질", "초보자 친화성")
       - **description**: 영문 설명 (1-500자)
    3. **균형 잡힌 선택**: 강점 2개, 보통 2개, 약점 2개
    4. **일관성**: slug와 name은 같은 의미를 표현 (video-quality ↔ Video Quality)

    참고 (기존 지표, 새로 만들어도 됨):
${metricList || '(없음)'}

12. metrics (정확히 6개):
    **!!!!! 중요: key 필드는 위 metric_keys의 slug와 정확히 일치해야 함 (kebab-case) !!!!!**

    **필수 규칙:**
    1. **key**: 위에서 정의한 metric_keys의 slug 필드와 정확히 일치 (kebab-case)
       - 예: metric_keys에서 slug가 "video-quality"면 metrics의 key도 "video-quality"
       - name(Video Quality)이 아니라 slug(video-quality) 사용
       - 6개 모두 metric_keys에서 정의한 slug 사용
    2. **score**: 0-100 정수
    3. **reasoning**: 점수 근거, 한국어 작성 (1-500자)
    4. **균형**: 강점 2개(70-100), 보통 2개(40-69), 약점 2개(0-39)
    5. **객관적 측정**: 주관적 의견이 아닌 콘텐츠 특성만 평가

JSON 스키마에 맞춰 응답하세요.`;

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
					// @ts-expect-error Node.js fetch agent support
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
		const model = google('gemini-2.5-flash-lite'); // 모델 바꾸지마세요.

		console.log('[summary] AI 분석 시작');

		const result = await generateObject({
			model,
			schema: jsonSchema(VideoAnalysisSchema),
			schemaName: 'VideoAnalysis',
			schemaDescription:
				'Comprehensive video analysis with quality, sentiment, and community metrics',
			temperature: 0.1,
			maxRetries: 3,
			prompt
		});

		const rawAnalysis = result.object as Record<string, unknown>;
		const validationResult = v.safeParse(VideoAnalysisValidationSchema, rawAnalysis);

		if (!validationResult.success) {
			const errors = validationResult.issues.map((i) => `${i.path?.join('.')}: ${i.message}`).join('\n');
			console.error('[summary] AI 검증 실패:', errors);
			throw new Error(`AI 응답 검증 실패:\n${errors}`);
		}

		console.log('[summary] AI 검증 성공');
		return validationResult.output;
	}

	private async saveSummary(
		videoId: string,
		transcript: string,
		totalComments: number,
		analysis: v.InferOutput<typeof VideoAnalysisValidationSchema>
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

	private async analyzeContent(videoId: string, analysis: v.InferOutput<typeof VideoAnalysisValidationSchema>) {
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
