/**
 * YouTube 자막 수집 비즈니스 로직
 * Remote Function과 분리하여 테스트 가능하게 설계
 */

import { getYouTubeClient } from '$lib/server/youtube-proxy';

/**
 * YouTube 자막 추출 (순수 함수)
 * @param {string} videoId - YouTube 영상 ID
 * @param {object} options - YouTube 클라이언트 (테스트용 주입 가능)
 */
export async function extractTranscript(videoId, options = {}) {
	const yt = options.youtubeClient || (await getYouTubeClient());

	console.log(`[transcript] YouTube API 호출 시작 videoId=${videoId}`);

	const info = await yt.getInfo(videoId);
	const transcript = await info.getTranscript();

	if (!transcript || !transcript.transcript?.content?.body?.initial_segments) {
		console.log(`[transcript] 자막 없음 videoId=${videoId}`);
		return {
			success: false,
			videoId,
			error: '자막을 사용할 수 없습니다',
			data: null
		};
	}

	const segments = transcript.transcript.content.body.initial_segments;
	const transcriptData = {
		title: info.basic_info?.title,
		duration: info.basic_info?.duration,
		language: transcript.transcript?.content?.body?.language || 'unknown',
		segments: segments.map((segment) => ({
			text: segment.snippet.text,
			offset: parseInt(segment.start_ms),
			duration: parseInt(segment.end_ms) - parseInt(segment.start_ms)
		}))
	};

	console.log(`[transcript] 추출 완료 videoId=${videoId} segments=${segments.length}개`);

	return {
		success: true,
		videoId,
		data: transcriptData
	};
}

/**
 * DB에서 자막 조회
 */
export async function findTranscriptInDB(supabase, videoId) {
	const { data: existing, error: checkError } = await supabase
		.from('transcripts')
		.select('id, data')
		.eq('video_id', videoId)
		.maybeSingle();

	if (checkError) {
		throw new Error(`자막 확인 실패: ${checkError.message}`);
	}

	return existing;
}

/**
 * DB에 자막 저장
 */
export async function saveTranscriptToDB(supabase, videoId, transcriptData) {
	const { error: insertError } = await supabase.from('transcripts').upsert(
		{
			video_id: videoId,
			data: transcriptData
		},
		{
			onConflict: 'video_id'
		}
	);

	if (insertError) {
		throw new Error(`자막 저장 실패: ${insertError.message}`);
	}

	console.log(
		`[transcript] 저장 완료 videoId=${videoId} segments=${transcriptData.segments?.length}개`
	);

	return true;
}
