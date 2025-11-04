import { command, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { collectTranscript } from './transcription.remote.js';
import { collectComments } from './comments.remote.js';
import { analyzeVideoQuality } from '../ai.remote.js';

const AnalyzeVideoSchema = v.object({
	videoId: v.pipe(v.string(), v.minLength(1))
});

function videoIdToUrl(videoId) {
	return `https://www.youtube.com/watch?v=${videoId}`;
}

export const analyzeVideo = command(
	AnalyzeVideoSchema,
	async (input) => {
		try {
			const { videoId } = v.parse(AnalyzeVideoSchema, input);

			console.log(`[summary] 분석 시작 videoId=${videoId}`);

			console.log(`[summary] 1단계: 자막 및 댓글 병렬 수집`);
			const [transcriptResult, commentsResult] = await Promise.all([
				collectTranscript({ videoId }),
				collectComments({ videoId, maxComments: 100 })
			]);

			console.log(`[summary] 2단계: AI 분석`);

			await analyzeVideoQuality({ videoId });

			console.log(`[summary] 분석 완료`);

			return {
				success: true,
				videoId,
				message: '분석이 완료되었습니다'
			};
		} catch (err) {
			console.error('[summary] 분석 실패:', err);
			throw error(500, err instanceof Error ? err.message : '알 수 없는 오류');
		}
	}
);

export const getSummary = command(
	v.object({
		videoId: v.pipe(v.string(), v.minLength(1))
	}),
	async (input) => {
		try {
			const { videoId } = v.parse(v.object({ videoId: v.string() }), input);
			const { locals } = getRequestEvent();
			const { supabase } = locals;

			console.log(`[summary] 조회 시작 videoId=${videoId}`);

			const url = videoIdToUrl(videoId);

			const { data: summary, error: fetchError } = await supabase
				.from('summaries')
				.select('*')
				.eq('url', url)
				.maybeSingle();

			if (fetchError) {
				throw error(500, `summary 조회 실패: ${fetchError.message}`);
			}

			if (!summary) {
				console.log(`[summary] 결과 없음 videoId=${videoId}`);
				return {
					success: false,
					videoId,
					message: '분석 결과를 찾을 수 없습니다'
				};
			}

			console.log(`[summary] 조회 완료 summaryId=${summary.id}`);

			return {
				success: true,
				videoId,
				summary
			};
		} catch (err) {
			console.error('[summary] 조회 실패:', err);
			throw error(500, err instanceof Error ? err.message : '알 수 없는 오류');
		}
	}
);
