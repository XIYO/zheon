import { command } from '$app/server';
import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { jsonSchema } from 'ai';
import { valibotSchema } from '@ai-sdk/valibot';
import { env } from '$env/dynamic/private';

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

export const analyzeAndSummarizeVideo = command(
	v.object({
		videoId: v.pipe(v.string(), v.minLength(1)),
		transcript: v.pipe(v.string(), v.minLength(1)),
		comments: v.array(v.string())
	}),
	async ({ videoId, transcript, comments }) => {
		const geminiApiKey = env.GEMINI_API_KEY;
		if (!geminiApiKey) throw error(500, 'GEMINI_API_KEY가 설정되지 않았습니다');

		try {
			console.log(
				`[AI] 통합 분석 시작 videoId=${videoId}, 자막=${transcript.length}자, 댓글=${comments.length}개`
			);

			const commentsText = comments
				.slice(0, 100)
				.map((c, i) => `${i + 1}. ${c}`)
				.join('\n');

			const prompt = `Analyze this YouTube video comprehensively based on the transcript and top 100 comments.

[TRANSCRIPT]
${transcript}

[COMMENTS (Top 100)]
${commentsText}

Provide:
1. Summary: 200-1000 character summary of the video content in Korean
2. Content Quality: Educational value, entertainment, accuracy, clarity, depth (all 0-100), category, target audience
3. Sentiment: Positive/neutral/negative ratios (must sum to 100), overall score (-100 to 100, negative=부정적, 0=중립, positive=긍정적), intensity (0-100)
4. Community: Politeness, rudeness, kindness, toxicity, constructive, self-centered, off-topic scores (all 0-100), overall score (-100 to 100, negative=부정적 커뮤니티, positive=긍정적 커뮤니티)
5. Age Groups: Estimated viewer age distribution (teens, 20s, 30s, 40+, must sum to 100)
6. Insights: Content summary, audience reaction, key insights, recommendations

Respond with valid JSON matching the specified schema.`;

			const google = createGoogleGenerativeAI({ apiKey: geminiApiKey });
			const model = google('gemini-2.0-flash-exp');

			let analysis;
			let lastError;
			const maxRetries = 3;

			for (let attempt = 1; attempt <= maxRetries; attempt++) {
				try {
					console.log(`[AI] 분석 시도 ${attempt}/${maxRetries}`);

					const result = await generateObject({
						model,
						schema: jsonSchema(VideoAnalysisSchema),
						schemaName: 'VideoAnalysis',
						schemaDescription: 'Comprehensive video analysis with quality, sentiment, and community metrics',
						temperature: 0.3,
						prompt:
							attempt === 1
								? prompt
								: `${prompt}\n\nIMPORTANT: Previous attempt failed validation. Ensure ALL numeric values are within specified ranges:\n- content_quality scores: 0-100\n- sentiment ratios: 0-100 (must sum to 100)\n- sentiment overall_score: -100 to 100\n- community scores: 0-100\n- community overall_score: -100 to 100\n- age_groups: 0-100 (must sum to 100)`
					});

					const rawAnalysis = result.object as any;

					const validationResult = v.safeParse(VideoAnalysisValidationSchema, rawAnalysis);

					if (validationResult.success) {
						console.log(`[AI] 검증 성공 (시도 ${attempt}/${maxRetries})`);
						analysis = validationResult.output;
						break;
					} else {
						lastError = new Error(
							`Validation failed: ${validationResult.issues.map((i) => `${i.path?.join('.')}: ${i.message}`).join(', ')}`
						);
						console.warn(`[AI] 검증 실패 (시도 ${attempt}/${maxRetries}):`, lastError.message);

						if (attempt === maxRetries) {
							console.warn('[AI] 최대 재시도 횟수 도달, 원본 데이터 사용');
							analysis = rawAnalysis;
						}
					}
				} catch (err) {
					lastError = err;
					console.error(`[AI] 생성 실패 (시도 ${attempt}/${maxRetries}):`, err);

					if (attempt === maxRetries) {
						throw err;
					}
				}
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

			console.log(`[AI] 통합 분석 완료 videoId=${videoId}`);

			return {
				success: true,
				videoId,
				summary: analysis.summary,
				content_quality: analysis.content_quality,
				sentiment: analysis.sentiment,
				community: analysis.community,
				age_groups: analysis.age_groups,
				insights: analysis.insights,
				total_comments_analyzed: Math.min(comments.length, 100)
			};
		} catch (err) {
			console.error('[AI] 통합 분석 실패:', err);
			const errorMessage = err instanceof Error ? err.message : String(err);

			if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
				throw error(429, 'API 할당량 초과. 나중에 다시 시도해주세요.');
			}

			throw error(500, `영상 분석 실패: ${errorMessage}`);
		}
	}
);

export const analyzeVideoQuality = command(
	v.object({
		videoId: v.pipe(v.string(), v.minLength(1)),
		transcript: v.optional(v.string()),
		comments: v.optional(v.array(v.string()))
	}),
	async () => {
		throw error(501, 'analyzeVideoQuality is not implemented yet');
	}
);
