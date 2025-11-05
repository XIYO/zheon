import { command, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { getYouTubeClient } from '$lib/server/youtube-proxy';
import { CollectTranscriptInputSchema } from './transcription.schema';

export const collectTranscript = command(CollectTranscriptInputSchema, async (input) => {
	try {
		const { videoId } = v.parse(CollectTranscriptInputSchema, input);
		const { locals } = getRequestEvent();
		const { adminSupabase } = locals;

		console.log(`[transcript] 수집 시작 videoId=${videoId}`);

		const { data: existing, error: checkError } = await adminSupabase
			.schema('zheon')
			.from('transcripts')
			.select('id, data')
			.eq('video_id', videoId)
			.maybeSingle();

		if (checkError) {
			throw error(500, `자막 확인 실패: ${checkError.message}`);
		}

		if (existing) {
			console.log(`[transcript] 이미 존재 videoId=${videoId}`);
			return {
				success: true,
				videoId,
				status: 'exists',
				data: existing.data,
				message: '이미 수집된 자막입니다'
			};
		}

		const yt = await getYouTubeClient();
		const info = await yt.getInfo(videoId);
		const transcript = await info.getTranscript();

		if (!transcript || !transcript.transcript?.content?.body?.initial_segments) {
			console.log(`[transcript] 자막 없음 videoId=${videoId}`);
			return {
				success: false,
				videoId,
				status: 'no_transcript',
				message: '자막을 사용할 수 없습니다'
			};
		}

		const segments = transcript.transcript.content.body.initial_segments;
		const transcriptData = {
			title: info.basic_info?.title,
			duration: info.basic_info?.duration,
			segments: segments.map((segment: any) => ({
				start_ms: parseInt(segment.start_ms),
				end_ms: parseInt(segment.end_ms),
				text: segment.snippet.text
			}))
		};

		const { error: insertError } = await adminSupabase.schema('zheon').from('transcripts').insert({
			video_id: videoId,
			data: transcriptData
		});

		if (insertError) {
			console.error(`[transcript] 저장 실패:`, insertError);
			throw error(500, `자막 저장 실패: ${insertError.message}`);
		}

		console.log(`[transcript] 저장 완료 videoId=${videoId} segments=${segments.length}개`);

		return {
			success: true,
			videoId,
			status: 'created',
			data: transcriptData,
			message: `자막 수집 완료 (${segments.length}개 세그먼트)`
		};
	} catch (err) {
		console.error('[transcript] 수집 실패:', err);
		throw error(500, err instanceof Error ? err.message : '알 수 없는 오류');
	}
});

export const getTranscriptFromDB = command(
	v.object({
		videoId: v.pipe(v.string(), v.minLength(1))
	}),
	async (input) => {
		try {
			const { videoId } = v.parse(v.object({ videoId: v.string() }), input);
			const { locals } = getRequestEvent();
			const { supabase } = locals;

			console.log(`[transcript] DB 조회 시작 videoId=${videoId}`);

			const { data: transcript, error: fetchError } = await supabase
				.schema('zheon')
				.from('transcripts')
				.select('id, video_id, data, updated_at')
				.eq('video_id', videoId)
				.maybeSingle();

			if (fetchError) {
				throw error(500, `자막 조회 실패: ${fetchError.message}`);
			}

			if (!transcript) {
				console.log(`[transcript] 자막 없음 videoId=${videoId}`);
				return {
					success: false,
					videoId,
					message: '저장된 자막이 없습니다'
				};
			}

			const segments = (transcript.data as any)?.segments || [];
			console.log(`[transcript] DB 조회 완료 videoId=${videoId} segments=${segments.length}개`);

			return {
				success: true,
				videoId,
				transcript,
				segmentCount: segments.length
			};
		} catch (err) {
			console.error('[transcript] DB 조회 실패:', err);
			throw error(500, err instanceof Error ? err.message : '알 수 없는 오류');
		}
	}
);
