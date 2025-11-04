import { command } from '$app/server';
import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { valibotSchema } from '@ai-sdk/valibot';
import { env } from '$env/dynamic/private';

const VideoAnalysisWithSummarySchema = valibotSchema(
	v.object({
		summary: v.pipe(v.string(), v.minLength(100), v.maxLength(1000)),
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
			overall_score: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
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
			overall_score: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer())
		}),
		age_groups: v.object({
			teens: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
			twenties: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
			thirties: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
			forty_plus: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer())
		}),
		insights: v.object({
			content_summary: v.pipe(v.string(), v.minLength(50), v.maxLength(500)),
			audience_reaction: v.pipe(v.string(), v.minLength(50), v.maxLength(500)),
			key_insights: v.pipe(v.array(v.string()), v.minLength(1), v.maxLength(10)),
			recommendations: v.pipe(v.array(v.string()), v.minLength(0), v.maxLength(10))
		})
	})
);

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
2. Content Quality: Educational value, entertainment, accuracy, clarity, depth, category, target audience
3. Sentiment: Positive/neutral/negative ratios (must sum to 100), overall score, intensity
4. Community: Politeness, rudeness, kindness, toxicity, constructive, self-centered, off-topic scores
5. Age Groups: Estimated viewer age distribution (teens, 20s, 30s, 40+, must sum to 100)
6. Insights: Content summary, audience reaction, key insights, recommendations

Respond with valid JSON matching the specified schema.`;

			const google = createGoogleGenerativeAI({ apiKey: geminiApiKey });
			const model = google('gemini-2.0-flash-exp');

			const result = await generateObject({
				model,
				schema: VideoAnalysisWithSummarySchema,
				temperature: 0.3,
				prompt
			});

			const analysis = result.object;

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
