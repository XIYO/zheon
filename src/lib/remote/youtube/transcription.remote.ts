import { command, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { TranscriptionService } from '$lib/server/services/youtube/transcription.service';
import { CollectTranscriptInputSchema } from './transcription.schema';

export const collectTranscript = command(CollectTranscriptInputSchema, async (input) => {
	try {
		const { videoId, force } = v.parse(CollectTranscriptInputSchema, input);
		const { locals } = getRequestEvent();
		const { adminSupabase } = locals;

		const service = new TranscriptionService(adminSupabase);
		return await service.collectTranscript(videoId, { force });
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
			const { adminSupabase } = locals;

			const service = new TranscriptionService(adminSupabase);
			return await service.getTranscriptFromDB(videoId);
		} catch (err) {
			console.error('[transcript] DB 조회 실패:', err);
			throw error(500, err instanceof Error ? err.message : '알 수 없는 오류');
		}
	}
);
