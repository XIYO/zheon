import { command, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { CommentService } from '$lib/server/services/youtube/comment.service';
import { CollectCommentsInputSchema } from './comment.schema';
import { logger } from '$lib/logger';

export const collectComments = command(CollectCommentsInputSchema, async (input) => {
	try {
		const { videoId, maxBatches = 5, force = false } = v.parse(CollectCommentsInputSchema, input);
		const { locals } = getRequestEvent();
		const { adminSupabase, youtube } = locals;

		const service = new CommentService(adminSupabase, youtube);
		return await service.collectComments(videoId, { maxBatches, force });
	} catch (err) {
		logger.error('[comments] 수집 실패:', err);
		throw error(500, err instanceof Error ? err.message : '알 수 없는 오류');
	}
});

export const getCommentsFromDB = command(
	v.object({
		videoId: v.pipe(v.string(), v.minLength(1))
	}),
	async (input) => {
		try {
			const { videoId } = v.parse(v.object({ videoId: v.string() }), input);
			const { locals } = getRequestEvent();
			const { adminSupabase, youtube } = locals;

			const service = new CommentService(adminSupabase, youtube);
			return await service.getCommentsFromDB(videoId);
		} catch (err) {
			logger.error('[comments] DB 조회 실패:', err);
			throw error(500, err instanceof Error ? err.message : '알 수 없는 오류');
		}
	}
);
