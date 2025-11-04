import { form, getRequestEvent } from '$app/server';
import { SummarySchema } from '$lib/schemas/summary-schema.js';
import { error } from '@sveltejs/kit';
import { extractVideoId, normalizeYouTubeUrl } from '$lib/utils/youtube.js';
import { getVideoInfo, getVideoTranscript } from '$lib/remote/youtube.remote.js';
import { summarizeTranscript, generateTtsAudio } from '$lib/remote/ai.remote.js';
import { analyzeVideo } from '$lib/remote/youtube/analyze.remote.js';

/**
 * Form: 요약 제출
 * - 익명 사용자 포함 모두 가능
 * - Valibot 자동 검증
 * - 전체 플로우: URL → videoId → pending upsert → 메타데이터/자막 → AI 요약
 */
export const createSummary = form(SummarySchema, async ({ url }) => {
	const { locals } = getRequestEvent();
	const { supabase } = locals;

	// 1. YouTube URL에서 videoId 추출
	const videoId = extractVideoId(url);

	// 2. 정규화된 URL 생성
	const normalizedUrl = normalizeYouTubeUrl(videoId);

	// 3. 기존 요약 확인
	const { data: existing, error: selectError } = await supabase
		.from('summaries')
		.select('id')
		.eq('url', normalizedUrl)
		.maybeSingle();

	if (selectError) throw error(500, selectError);

	let summaryId;

	if (existing) {
		// 이미 있으면 updated_at만 최신화 (트리거가 자동 처리)
		const { error: updateError } = await supabase
			.from('summaries')
			.update({ updated_at: new Date().toISOString() })
			.eq('id', existing.id);

		if (updateError) throw error(500, updateError);
		summaryId = existing.id;
	} else {
		// 없으면 새로 생성 (pending 상태)
		const { data: newData, error: insertError } = await supabase
			.from('summaries')
			.insert({ url: normalizedUrl, processing_status: 'pending' })
			.select('id')
			.single();

		if (insertError) throw error(500, insertError);
		summaryId = newData.id;
	}

	// 4. 백그라운드로 메타데이터 + 자막 + AI 요약 처리
	// waitUntil을 사용하여 응답 즉시 반환, 백그라운드에서 계속 실행
	try {
		const { waitUntil } = await import('cloudflare:workers');
		waitUntil(processVideoSummary(summaryId, videoId, normalizedUrl));
	} catch {
		// waitUntil 없으면 그냥 실행
		processVideoSummary(summaryId, videoId, normalizedUrl);
	}
});

/**
 * 비디오 요약 백그라운드 처리
 * - 메타데이터 가져오기
 * - 자막 가져오기
 * - AI 요약 생성
 * - DB 업데이트
 */
async function processVideoSummary(summaryId, videoId, url) {
	const { locals } = getRequestEvent();
	const { adminSupabase } = locals;

	try {
		// processing 상태로 변경
		const { error: statusError } = await adminSupabase
			.from('summaries')
			.update({ processing_status: 'processing' })
			.eq('id', summaryId);

		if (statusError) throw new Error(`상태 업데이트 실패: ${statusError.message}`);

		// 5. 메타데이터 + 자막 병렬로 가져오기
		const [videoInfo, videoTranscript] = await Promise.allSettled([
			getVideoInfo(videoId),
			getVideoTranscript(videoId)
		]);

		// 메타데이터 처리
		const metadata = videoInfo.status === 'fulfilled' ? videoInfo.value : null;
		const transcript =
			videoTranscript.status === 'fulfilled' ? videoTranscript.value : null;

		if (!metadata) {
			throw new Error('비디오 정보를 가져올 수 없습니다');
		}

		// 6. DB 업데이트 (메타데이터 + 자막)
		const transcriptText = transcript?.captions?.map((c) => c.text).join(' ') || '';

		const { error: metadataError } = await adminSupabase
			.from('summaries')
			.update({
				title: metadata.title,
				channel_id: metadata.channel?.id,
				channel_name: metadata.channel?.name,
				duration: metadata.duration,
				transcript: transcriptText,
				thumbnail_url: metadata.thumbnail
			})
			.eq('id', summaryId);

		if (metadataError) throw new Error(`메타데이터 업데이트 실패: ${metadataError.message}`);

		// 7. AI 요약 생성
		let aiResult = null;
		if (transcriptText.length > 0) {
			try {
				aiResult = await summarizeTranscript({
					transcript: transcriptText,
					language: 'ko'
				});
			} catch (aiError) {
				// AI 요약 실패해도 메타데이터는 저장되도록 continue
			}
		}

		// 8. 최종 업데이트 (요약 + 완료 상태)
		const { error: completeError } = await adminSupabase
			.from('summaries')
			.update({
				summary: aiResult?.summary || '요약을 생성할 수 없습니다',
				processing_status: 'completed'
			})
			.eq('id', summaryId);

		if (completeError) throw new Error(`완료 상태 업데이트 실패: ${completeError.message}`);

		// 9. TTS 생성 (백그라운드, 실패해도 무시)
		if (aiResult?.summary) {
			generateTtsAudio({ summaryId }).catch(() => {});
		}

		// 10. 댓글 분석 (백그라운드, 실패해도 무시)
		analyzeVideo({ videoId }).catch((err) => {
			console.warn(`[댓글 분석 실패] videoId: ${videoId}`, err.message);
		});
	} catch (err) {

		// 실패 상태로 변경
		const { error: failError } = await adminSupabase
			.from('summaries')
			.update({
				processing_status: 'failed',
				summary: err.message || '처리 중 오류가 발생했습니다'
			})
			.eq('id', summaryId);

		// failError 무시 - 실패 상태 업데이트도 실패하면 더 이상 할 수 있는 것이 없음
	}
}
