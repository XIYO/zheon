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
import { collectComments, loadVideoInsight } from './comments.remote.js';

const AnalyzeVideoInputSchema = v.object({
	videoId: v.pipe(v.string(), v.minLength(1))
});

async function performSentimentAnalysis(videoId) {
	try {
		const { locals } = getRequestEvent();
		const { supabase } = locals;

		console.log(`[분석] 감정 분석 시작: ${videoId}`);

		const unanalyzedComments = await loadUnanalyzedComments(supabase, videoId);

		if (unanalyzedComments.length === 0) {
			console.log(`[분석] 미분석 댓글 없음`);
		} else {
			const batches = createBatches(unanalyzedComments, 100);
			const allResults = [];

			for (let i = 0; i < batches.length; i++) {
				const batch = batches[i];
				console.log(
					`[분석] 배치 ${i + 1}/${batches.length} 처리 중 (${batch.length}개)`
				);
				const results = await callGeminiAPI(batch);
				allResults.push(...results);
			}

			await storeAnalysisResults(supabase, allResults);
			console.log(`[분석] ${allResults.length}개 결과 저장`);
		}

		const allAnalyzedComments = await loadAllAnalyzedComments(supabase, videoId);

		if (allAnalyzedComments.length === 0) {
			throw new Error('분석된 댓글이 없습니다');
		}

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
		console.log(`[분석] 감정도 저장: ${emotionScore.emotion_score}%`);

		return emotionScore;
	} catch (err) {
		console.error(`[분석 오류]`, err);
		throw err;
	}
}

async function buildVideoInsight(videoId, emotionScore) {
	try {
		const { locals } = getRequestEvent();
		const { supabase } = locals;

		console.log(`[인사이트] 생성 시작: ${videoId}`);

		const now = new Date().toISOString();
		const trendScores = [emotionScore.emotion_score];
		const trendDirection = calculateTrendDirection(trendScores);

		function getOverallTrustLevel(score) {
			if (score >= 70) return 'high';
			if (score >= 40) return 'medium';
			return 'low';
		}

		function generateTrendInsight(score, change, direction) {
			const parts = [];
			if (direction === 'improving') parts.push('커뮤니티 감정이 개선 중');
			else if (direction === 'declining') parts.push('커뮤니티 감정이 하락 중');
			else parts.push('커뮤니티 감정이 안정적');

			if (change !== undefined) {
				const changeStr = change > 0 ? `+${change}` : `${change}`;
				parts.push(`(어제 대비 ${changeStr}%)`);
			}
			parts.push(`현재 긍정도: ${score}%`);
			return parts.join(' ');
		}

		function generateRecommendation(score, trustLevel) {
			const parts = [];
			if (trustLevel === 'high') parts.push('이 영상은 신뢰도가 높습니다.');
			else if (trustLevel === 'medium')
				parts.push('이 영상은 신뢰할 만합니다. 추가 검증을 권장합니다.');
			else parts.push('이 영상의 신뢰도가 낮습니다. 주의가 필요합니다.');

			if (score >= 70)
				parts.push(`커뮤니티 반응이 매우 긍정적(${Math.round(score)}%)입니다.`);
			else if (score >= 40)
				parts.push(`커뮤니티 반응이 혼합되어 있습니다(${Math.round(score)}%).`);
			else parts.push(`커뮤니티 반응이 부정적입니다(${Math.round(score)}%).`);

			return parts.join(' ');
		}

		const trustLevel = getOverallTrustLevel(emotionScore.emotion_score);
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

		const insight = {
			video_id: videoId,
			comment_analysis: commentAnalysis,
			combined_credibility: {
				overall_trust_level: trustLevel,
				comment_trend: commentAnalysis.trend.insights,
				recommendation: generateRecommendation(emotionScore.emotion_score, trustLevel)
			}
		};

		const { error: updateError } = await supabase
			.from('channel_videos')
			.update({
				video_insight: insight,
				last_analyzed_at: now
			})
			.eq('video_id', videoId);

		if (updateError) {
			console.warn(`[인사이트 경고] ${updateError.message}`);
		}

		console.log(`[인사이트] 저장 완료`);
		return insight;
	} catch (err) {
		console.error(`[인사이트 오류]`, err);
		throw err;
	}
}

export const analyzeVideo = command(
	AnalyzeVideoInputSchema,
	async (input) => {
		try {
			const { videoId } = v.parse(AnalyzeVideoInputSchema, input);
			const { locals } = getRequestEvent();
			const { supabase } = locals;

			console.log(`\n=== 영상 분석 시작: ${videoId} ===`);

			const comments = await collectComments({ videoId });
			console.log(`[수집] ${comments.count}개 댓글 로드`);

			const emotionScore = await performSentimentAnalysis(videoId);
			const insight = await buildVideoInsight(videoId, emotionScore);

			const suspiciousComments = detectSuspiciousComments(
				await loadAllAnalyzedComments(supabase, videoId)
			);

			console.log(`=== 분석 완료 ===\n`);

			return {
				success: true,
				videoId,
				emotionScore,
				insight,
				suspiciousComments: suspiciousComments.slice(0, 10),
				commentsAnalyzed: comments.count,
				timestamp: new Date().toISOString()
			};
		} catch (err) {
			console.error(`[분석 실패]`, err);
			throw error(500, err instanceof Error ? err.message : 'Unknown error');
		}
	}
);
