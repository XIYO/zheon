import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database.types';
import * as v from 'valibot';
import { jsonSchema } from 'ai';
import { generateObject, type LanguageModel } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';
import { logger } from '$lib/logger';

type AIProvider = 'gemini' | 'openai';

type CommentData = { content?: { text?: string }; text?: string };

const AgeSchema = {
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
};

const AgeValidation = v.object({
	teens: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
	twenties: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
	thirties: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
	forty_plus: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
	median_age: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
	adult_ratio: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer())
});

const EmotionsSchema = {
	type: 'object' as const,
	properties: {
		emotions: {
			type: 'object' as const,
			properties: {
				joy: { type: 'number' as const },
				trust: { type: 'number' as const },
				fear: { type: 'number' as const },
				surprise: { type: 'number' as const },
				sadness: { type: 'number' as const },
				disgust: { type: 'number' as const },
				anger: { type: 'number' as const },
				anticipation: { type: 'number' as const }
			},
			required: ['joy', 'trust', 'fear', 'surprise', 'sadness', 'disgust', 'anger', 'anticipation']
		},
		vad: {
			type: 'object' as const,
			properties: {
				valence_mean: { type: 'number' as const },
				arousal_mean: { type: 'number' as const }
			},
			required: ['valence_mean', 'arousal_mean']
		},
		dominant_emotion: { type: 'string' as const },
		entropy: { type: 'number' as const }
	},
	required: ['emotions', 'vad', 'dominant_emotion', 'entropy']
};

const EmotionsValidation = v.object({
	emotions: v.object({
		joy: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
		trust: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
		fear: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
		surprise: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
		sadness: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
		disgust: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
		anger: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
		anticipation: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer())
	}),
	vad: v.object({
		valence_mean: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
		arousal_mean: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer())
	}),
	dominant_emotion: v.pipe(
		v.string(),
		v.check((s) =>
			['joy', 'trust', 'fear', 'surprise', 'sadness', 'disgust', 'anger', 'anticipation'].includes(
				s
			)
		)
	),
	entropy: v.pipe(v.number(), v.minValue(0))
});

export interface CommunityKeys {
	videoId: string;
}

export interface CommunityLLMConfig {
	geminiApiKey?: string;
	openaiApiKey?: string;
	geminiModel?: string;
	openaiModel?: string;
}

export interface AnalyzeCommunityOptions {
	maxBatches?: number;
	force?: boolean;
}

export class CommunityMetricsService {
	private availableProviders: AIProvider[] = [];

	constructor(private supabase: SupabaseClient<Database>) {}

	async analyze(
		keys: CommunityKeys,
		llmConfig: CommunityLLMConfig,
		options: AnalyzeCommunityOptions
	) {
		const { videoId } = keys;
		const { geminiApiKey, openaiApiKey, geminiModel, openaiModel } = llmConfig;
		const { maxBatches = 5 } = options;

		this.availableProviders = [];
		if (geminiApiKey) this.availableProviders.push('gemini');
		if (openaiApiKey) this.availableProviders.push('openai');

		if (this.availableProviders.length === 0) {
			throw error(500, 'AI API 키가 설정되지 않았습니다 (GEMINI_API_KEY 또는 OPENAI_API_KEY 필요)');
		}

		// 1) 댓글 로드(최대 N*20개)
		const { data: commentRecords, error: commentError } = await this.supabase
			.from('comments')
			.select('data')
			.eq('video_id', videoId)
			.order('updated_at', { ascending: false })
			.limit(maxBatches * 20);

		if (commentError) throw error(500, `댓글 조회 실패: ${commentError.message}`);
		const comments = (commentRecords || [])
			.map((r) => (r.data as CommentData)?.content?.text || (r.data as CommentData)?.text || '')
			.filter((t) => t.length > 0);

		if (comments.length === 0) throw error(400, '분석 가능한 댓글이 없습니다');

		const commentsText = comments
			.slice(0, 200)
			.map((c, i) => `${i + 1}. ${c}`)
			.join('\n');

		// 2) Fallback 로직으로 분석 시도
		const errors: Array<{ provider: AIProvider; error: unknown }> = [];

		for (const provider of this.availableProviders) {
			logger.info(`[Community] ${provider} provider로 분석 시도`);

			for (let attempt = 1; attempt <= 2; attempt++) {
				try {
					logger.info(`[Community] ${provider} 시도 ${attempt}/2`);
					const result = await this.performAnalysis(
						videoId,
						commentsText,
						comments.length,
						maxBatches,
						provider,
						{ geminiApiKey, openaiApiKey },
						{ geminiModel, openaiModel }
					);
					return result;
				} catch (err) {
					logger.error(`[Community] ${provider} 시도 ${attempt}/2 실패:`, err);
					errors.push({ provider, error: err });

					if (attempt === 2) {
						logger.warn(`[Community] ${provider} 모든 재시도 실패, 다음 provider로 이동`);
						break;
					}
				}
			}
		}

		const errorMessages = errors
			.map(({ provider, error: err }) => `${provider}: ${err instanceof Error ? err.message : String(err)}`)
			.join('\n');
		throw error(500, `모든 AI providers 실패:\n${errorMessages}`);
	}

	private async performAnalysis(
		videoId: string,
		commentsText: string,
		commentsLength: number,
		maxBatches: number,
		provider: AIProvider,
		keys: { geminiApiKey?: string; openaiApiKey?: string },
		models: { geminiModel?: string; openaiModel?: string }
	) {
		const socksProxy = env.TOR_SOCKS5_PROXY;
		if (!socksProxy) throw new Error('TOR_SOCKS5_PROXY not configured');

		const proxyAgent = new SocksProxyAgent(socksProxy);
		let requestCounter = 0;
		const customFetch = async (url: RequestInfo | URL, options?: RequestInit) => {
			const requestId = ++requestCounter;
			const label = `[AI Proxy #${requestId}] ${url}`;
			const startTime = Date.now();
			try {
				const response = await fetch(url, {
					...options,
					// @ts-expect-error Node.js fetch agent support
					agent: proxyAgent
				});
				logger.info(`${label}: ${Date.now() - startTime}ms`);
				return response;
			} catch (err) {
				logger.error(`${label}: ${Date.now() - startTime}ms (실패)`);
				logger.error('[AI Proxy] 프록시 fetch 실패:', err);
				throw err;
			}
		};

		const model = this.createModel(provider, customFetch, keys, models);

		// 3) Age 추정
		const agePrompt = `당신은 YouTube 커뮤니티 분석가입니다. 아래 댓글 목록을 보고 시청자 연령 분포를 추정하세요.

[댓글 샘플]
${commentsText}

다음 형식의 JSON만 출력하세요(합은 100이 되도록 반올림하되, 마지막 값에서 보정해 일치시켜 주세요):
{
  "teens": 15,
  "twenties": 45,
  "thirties": 25,
  "forty_plus": 15,
  "median_age": 27,
  "adult_ratio": 85
}`;

		const ageResult = await generateObject({
			model,
			schema: jsonSchema(AgeSchema),
			schemaName: 'CommunityAge',
			schemaDescription: 'Age distribution estimation from comments',
			temperature: 0.2,
			maxRetries: 0,
			prompt: agePrompt
		});
		const rawAge = ageResult.object as Record<string, unknown>;
		const ageVal = v.safeParse(AgeValidation, rawAge);
		const age = ageVal.success
			? ageVal.output
			: {
					teens: 0,
					twenties: 0,
					thirties: 0,
					forty_plus: 0,
					median_age: 0,
					adult_ratio: 0
				};

		// 합 100 정규화
		const ageSum = age.teens + age.twenties + age.thirties + age.forty_plus;
		if (ageSum !== 100) {
			const scale = 100 / (ageSum || 1);
			age.teens = Math.round(age.teens * scale);
			age.twenties = Math.round(age.twenties * scale);
			age.thirties = Math.round(age.thirties * scale);
			age.forty_plus = 100 - age.teens - age.twenties - age.thirties;
		}

		// 4) Emotions(Plutchik 8축 + VAD 요약)
		const emoPrompt = `당신은 유튜브 댓글 감정 분석가입니다. 아래 댓글 목록에서 Plutchik 8가지 기본 감정 강도와 VAD(Valence/Arousal) 요약을 산출하세요.

[댓글 샘플]
${commentsText}

요구사항:
- emotions의 8개 값(joy, trust, fear, surprise, sadness, disgust, anger, anticipation)을 각각 독립적인 0-100 강도로 평가
- 합계 제약 없음, 여러 감정이 동시에 높을 수 있음
- 댓글 전체에서 해당 감정이 얼마나 강하게 나타나는지 측정
- dominant_emotion은 8개 중 가장 높은 감정명으로만 표기
- vad 값은 0-100 스케일의 평균값으로 산출
- entropy는 감정 분포의 샤논 엔트로피(ln 기반)를 계산해 소수점 2자리까지 반올림

필수: 영상 컨텍스트 기반 감정 해석
- 댓글 내용을 통해 영상의 주제, 장르, 분위기를 유추
- 댓글의 감정을 영상 맥락에서 해석 (표면적 의미가 아닌 실제 의도 파악)
- 예시: 게임/오락 영상에서 "죽었다", "망했다" → 흥미진진함, 몰입(joy, anticipation), 분노 아님
- 예시: 스포츠 영상에서 "미쳤다", "죽인다" → 감탄, 놀람(surprise, joy), 부정적 감정 아님
- 슬랭, 은어, 과장 표현은 영상 장르와 문화적 맥락에서 해석
- 긍정적 과장 표현(대박, 미쳤다, 죽인다 등)을 부정 감정으로 오해하지 말 것

평가 가이드라인:
- 0-20: 거의 없음
- 21-40: 약간 있음
- 41-60: 보통
- 61-80: 강함
- 81-100: 매우 강함

JSON만 출력:
{
  "emotions": {
    "joy": 65,
    "trust": 50,
    "fear": 15,
    "surprise": 40,
    "sadness": 20,
    "disgust": 10,
    "anger": 25,
    "anticipation": 70
  },
  "vad": { "valence_mean": 58, "arousal_mean": 52 },
  "dominant_emotion": "anticipation",
  "entropy": 2.10
}`;

		const emoResult = await generateObject({
			model,
			schema: jsonSchema(EmotionsSchema),
			schemaName: 'CommunityEmotions',
			schemaDescription: 'Plutchik distribution and VAD summary from comments',
			temperature: 0.2,
			maxRetries: 0,
			prompt: emoPrompt
		});
		const rawEmo = emoResult.object as Record<string, unknown>;
		const emoVal = v.safeParse(EmotionsValidation, rawEmo);
		const emotions = emoVal.success
			? emoVal.output
			: {
					emotions: {
						joy: 0,
						trust: 0,
						fear: 0,
						surprise: 0,
						sadness: 0,
						disgust: 0,
						anger: 0,
						anticipation: 0
					},
					vad: { valence_mean: 50, arousal_mean: 50 },
					dominant_emotion: 'joy',
					entropy: 0
				};

		// 지배 감정 재산출
		const e = emotions.emotions;
		const entries: Array<[string, number]> = [
			['joy', e.joy],
			['trust', e.trust],
			['fear', e.fear],
			['surprise', e.surprise],
			['sadness', e.sadness],
			['disgust', e.disgust],
			['anger', e.anger],
			['anticipation', e.anticipation]
		];
		entries.sort((a, b) => b[1] - a[1]);
		const dominant = entries[0]?.[0] || 'joy';

		// 5) 저장(Upsert)
		const now = new Date().toISOString();
		const modelName = provider === 'gemini' ? models.geminiModel! : models.openaiModel!;
		const { error: upsertError } = await this.supabase.from('content_community_metrics').upsert(
			{
				video_id: videoId,
				comments_analyzed: Math.min(commentsLength, maxBatches * 20),

				age_teens: age.teens,
				age_20s: age.twenties,
				age_30s: age.thirties,
				age_40plus: age.forty_plus,
				age_median: age.median_age,
				age_adult_ratio: age.adult_ratio,

				emotion_joy: e.joy,
				emotion_trust: e.trust,
				emotion_fear: e.fear,
				emotion_surprise: e.surprise,
				emotion_sadness: e.sadness,
				emotion_disgust: e.disgust,
				emotion_anger: e.anger,
				emotion_anticipation: e.anticipation,
				emotion_dominant: dominant,
				emotion_entropy: emotions.entropy,
				valence_mean: emotions.vad.valence_mean,
				arousal_mean: emotions.vad.arousal_mean,

				framework_version: 'v1.0',
				analysis_model: modelName,
				analyzed_at: now,
				updated_at: now
			},
			{ onConflict: 'video_id' }
		);

		if (upsertError) throw error(500, `커뮤니티 지표 저장 실패: ${upsertError.message}`);

		return {
			video_id: videoId,
			comments_analyzed: Math.min(commentsLength, maxBatches * 20),
			age,
			emotions: { ...emotions, dominant_emotion: dominant }
		};
	}

	private createModel(
		provider: AIProvider,
		customFetch: typeof fetch,
		keys: { geminiApiKey?: string; openaiApiKey?: string },
		models: { geminiModel?: string; openaiModel?: string }
	): LanguageModel {
		switch (provider) {
			case 'gemini': {
				if (!keys.geminiApiKey) {
					throw new Error('GEMINI_API_KEY is not available');
				}
				const google = createGoogleGenerativeAI({
					apiKey: keys.geminiApiKey,
					fetch: customFetch
				});
				return google(models.geminiModel!);
			}
			case 'openai': {
				if (!keys.openaiApiKey) {
					throw new Error('OPENAI_API_KEY is not available');
				}
				const openai = createOpenAI({
					apiKey: keys.openaiApiKey,
					fetch: customFetch
				});
				return openai(models.openaiModel!);
			}
		}
	}
}
