import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '$lib/types/database.types';
import { getYouTubeClient } from '$lib/server/youtube-proxy';
import { error } from '@sveltejs/kit';

export interface CollectCommentsOptions {
	maxBatches?: number;
}

export class CommentService {
	constructor(private _supabase: SupabaseClient<Database>) {}

	async collectComments(videoId: string, { maxBatches = 1 }: CollectCommentsOptions = {}) {
		console.log(
			`[comments] 수집 시작 videoId=${videoId} maxBatches=${maxBatches} (약 ${maxBatches * 20}개)`
		);

		const yt = await getYouTubeClient();
		let commentsData = await yt.getComments(videoId, 'NEWEST_FIRST');

		console.log(`[comments] 1단계: continuation 토큰 수집 중...`);
		const batches = [commentsData];
		let batchIndex = 1;

		while (commentsData.has_continuation && batchIndex < maxBatches) {
			commentsData = await commentsData.getContinuation();
			batches.push(commentsData);
			batchIndex++;
		}

		console.log(`[comments] 2단계: ${batches.length}개 배치 처리 시작`);

		const batchPromises = batches.map((batch, index) =>
			(async () => {
				const comments = batch.contents
					.map((thread) => thread.comment)
					.filter((comment): comment is NonNullable<typeof comment> => comment !== null);
				console.log(`[comments] 배치 ${index + 1}: ${comments.length}개 수집`);
				return comments;
			})()
		);

		const batchResults = await Promise.all(batchPromises);

		const allComments: Database['zheon']['Tables']['comments']['Insert'][] = batchResults
			.flat()
			.map((comment) => ({
				comment_id: comment.comment_id,
				video_id: videoId,
				data: comment as unknown as Json
			}));

		if (allComments.length > 0) {
			const { error: insertError } = await this._supabase
				.from('comments')
				.upsert(allComments, { onConflict: 'comment_id' });

			if (insertError && insertError.code !== '23505') {
				console.error(`[comments] 저장 실패:`, insertError);
				throw error(500, `댓글 저장 실패: ${insertError.message}`);
			}
		}

		console.log(`[comments] 수집 완료: ${batches.length}배치, 총 ${allComments.length}개`);

		return {
			success: true,
			videoId,
			collected: allComments.length,
			batches: batches.length
		};
	}

	async getCommentsFromDB(videoId: string) {
		console.log(`[comments] DB 조회 시작 videoId=${videoId}`);

		const { data: comments, error: fetchError } = await this._supabase
			.from('comments')
			.select('comment_id, data, updated_at')
			.eq('video_id', videoId)
			.order('updated_at', { ascending: false });

		if (fetchError) {
			throw error(500, `댓글 조회 실패: ${fetchError.message}`);
		}

		console.log(`[comments] DB 조회 완료 ${comments?.length || 0}개`);

		return {
			success: true,
			videoId,
			count: comments?.length || 0,
			comments: comments || []
		};
	}
}
