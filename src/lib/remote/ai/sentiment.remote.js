import { command, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import {
	loadUnanalyzedComments,
	loadAllAnalyzedComments,
	storeAnalysisResults,
	storeSentimentHistory,
	calculateDistribution,
	getPreviousEmotionScore
} from '$lib/server/commentCollection.js';
import {
	createBatches,
	callGeminiAPI,
	calculateTrendDirection,
	detectSuspiciousComments
} from '$lib/server/sentimentAnalysis.js';

const AnalyzeSentimentInputSchema = v.object({
	videoId: v.pipe(v.string(), v.minLength(1))
});

const EmotionScoreSchema = v.object({
	emotion_score: v.pipe(v.number(), v.minValue(0), v.maxValue(100)),
	distribution: v.object({
		positive: v.pipe(v.number(), v.minValue(0), v.maxValue(100)),
		neutral: v.pipe(v.number(), v.minValue(0), v.maxValue(100)),
		negative: v.pipe(v.number(), v.minValue(0), v.maxValue(100))
	}),
	total_comments: v.pipe(v.number(), v.minValue(0)),
	daily_change: v.optional(v.number()),
	previous_score: v.optional(v.number())
});

export const analyzeSentiment = command(
	v.object({
		videoId: v.pipe(v.string(), v.minLength(1))
	}),
	async (input) => {
		try {
			const { videoId } = v.parse(AnalyzeSentimentInputSchema, input);
			const { locals } = getRequestEvent();
			const { supabase } = locals;

			console.log(`Analyzing sentiment for ${videoId}`);

			const unanalyzedComments = await loadUnanalyzedComments(supabase, videoId);

			if (unanalyzedComments.length === 0) {
				console.log('No unanalyzed comments');
				const allComments = await loadAllAnalyzedComments(supabase, videoId);
				if (allComments.length === 0) {
					throw error(404, 'No comments found');
				}
			} else {
				const batches = createBatches(unanalyzedComments, 100);
				const allResults = [];

				for (const batch of batches) {
					const results = await callGeminiAPI(batch);
					allResults.push(...results);
				}

				await storeAnalysisResults(supabase, allResults);
				console.log(`Stored ${allResults.length} results`);
			}

			const allAnalyzedComments = await loadAllAnalyzedComments(supabase, videoId);
			const distribution = calculateDistribution(allAnalyzedComments);
			const previousScore = await getPreviousEmotionScore(supabase, videoId);

			const emotionScore = {
				emotion_score: Math.round(distribution.positive * 100) / 100,
				distribution: {
					positive: Math.round(distribution.positive * 100) / 100,
					neutral: Math.round(distribution.neutral * 100) / 100,
					negative: Math.round(distribution.negative * 100) / 100
				},
				total_comments: allAnalyzedComments.length,
				daily_change:
					previousScore !== null
						? Math.round((distribution.positive - previousScore) * 100) / 100
						: undefined,
				previous_score: previousScore
			};

			await storeSentimentHistory(supabase, videoId, emotionScore);

			const suspiciousComments = detectSuspiciousComments(allAnalyzedComments);

			return {
				success: true,
				videoId,
				emotionScore,
				suspiciousComments: suspiciousComments.slice(0, 10),
				timestamp: new Date().toISOString()
			};
		} catch (err) {
			console.error('Sentiment analysis error:', err);
			throw error(500, err instanceof Error ? err.message : 'Unknown error');
		}
	}
);
