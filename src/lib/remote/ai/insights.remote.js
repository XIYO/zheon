import { command, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { calculateTrendDirection } from '$lib/server/sentimentAnalysis.js';

const BuildInsightInputSchema = v.object({
	videoId: v.pipe(v.string(), v.minLength(1)),
	emotionScore: v.object({
		emotion_score: v.pipe(v.number(), v.minValue(0), v.maxValue(100)),
		distribution: v.object({
			positive: v.pipe(v.number(), v.minValue(0), v.maxValue(100)),
			neutral: v.pipe(v.number(), v.minValue(0), v.maxValue(100)),
			negative: v.pipe(v.number(), v.minValue(0), v.maxValue(100))
		}),
		total_comments: v.pipe(v.number(), v.minValue(0)),
		daily_change: v.optional(v.number()),
		previous_score: v.optional(v.number())
	})
});

function getOverallTrustLevel(emotionScore) {
	if (emotionScore >= 70) return 'high';
	if (emotionScore >= 40) return 'medium';
	return 'low';
}

function generateTrendInsight(emotionScore, dailyChange, direction) {
	const parts = [];

	if (direction === 'improving') {
		parts.push('커뮤니티 감정이 개선 중');
	} else if (direction === 'declining') {
		parts.push('커뮤니티 감정이 하락 중');
	} else {
		parts.push('커뮤니티 감정이 안정적');
	}

	if (dailyChange !== undefined) {
		const changeStr = dailyChange > 0 ? `+${dailyChange}` : `${dailyChange}`;
		parts.push(`(어제 대비 ${changeStr}%)`);
	}

	parts.push(`현재 긍정도: ${emotionScore}%`);

	return parts.join(' ');
}

function generateCombinedRecommendation(emotionScore, trustLevel) {
	const parts = [];

	if (trustLevel === 'high') {
		parts.push('이 영상은 신뢰도가 높습니다.');
	} else if (trustLevel === 'medium') {
		parts.push('이 영상은 신뢰할 만합니다. 추가 검증을 권장합니다.');
	} else {
		parts.push('이 영상의 신뢰도가 낮습니다. 주의가 필요합니다.');
	}

	if (emotionScore >= 70) {
		parts.push(`커뮤니티 반응이 매우 긍정적(${Math.round(emotionScore)}%)입니다.`);
	} else if (emotionScore >= 40) {
		parts.push(`커뮤니티 반응이 혼합되어 있습니다(${Math.round(emotionScore)}%).`);
	} else {
		parts.push(`커뮤니티 반응이 부정적입니다(${Math.round(emotionScore)}%).`);
	}

	return parts.join(' ');
}

function calculateDataFreshness(analyzedAt) {
	const now = new Date();
	const analyzed = new Date(analyzedAt);
	const diffMs = now.getTime() - analyzed.getTime();
	const hours = Math.floor(diffMs / (1000 * 60 * 60));
	return hours;
}

export const buildInsight = command(
	BuildInsightInputSchema,
	async (input) => {
		try {
			const { videoId, emotionScore } = v.parse(
				BuildInsightInputSchema,
				input
			);
			const { locals } = getRequestEvent();
			const { supabase } = locals;

			console.log(`Building insight for ${videoId}`);

			const now = new Date().toISOString();
			const trendScores = [emotionScore.emotion_score];
			const trendDirection = calculateTrendDirection(trendScores);

			const commentAnalysis = {
				metadata: {
					total_comments_analyzed: emotionScore.total_comments,
					analyzed_at: now,
					data_freshness_hours: 0
				},
				current_emotion: {
					community_emotion_score: emotionScore.emotion_score,
					distribution: {
						positive: Math.round(
							(emotionScore.distribution.positive / 100) * emotionScore.total_comments
						),
						neutral: Math.round(
							(emotionScore.distribution.neutral / 100) * emotionScore.total_comments
						),
						negative: Math.round(
							(emotionScore.distribution.negative / 100) * emotionScore.total_comments
						)
					},
					percentage: emotionScore.distribution
				},
				trend: {
					daily_change: emotionScore.daily_change,
					previous_score: emotionScore.previous_score,
					trend_7_days: trendScores,
					trend_direction: trendDirection,
					insights: generateTrendInsight(
						emotionScore.emotion_score,
						emotionScore.daily_change,
						trendDirection
					)
				}
			};

			const trustLevel = getOverallTrustLevel(emotionScore.emotion_score);
			const combined_credibility = {
				overall_trust_level: trustLevel,
				comment_trend: commentAnalysis.trend.insights,
				recommendation: generateCombinedRecommendation(
					emotionScore.emotion_score,
					trustLevel
				)
			};

			const insight = {
				video_id: videoId,
				comment_analysis: commentAnalysis,
				combined_credibility
			};

			const { error: updateError } = await supabase
				.from('channel_videos')
				.update({
					video_insight: insight,
					last_analyzed_at: now
				})
				.eq('video_id', videoId);

			if (updateError) {
				console.warn(`Warning updating insight: ${updateError.message}`);
			}

			return {
				success: true,
				videoId,
				insight,
				timestamp: now
			};
		} catch (err) {
			console.error('Insight build error:', err);
			throw error(500, err instanceof Error ? err.message : 'Unknown error');
		}
	}
);
