import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '$lib/types/database.types';
import { error } from '@sveltejs/kit';
import type { Innertube } from 'youtubei.js';

export interface CollectCommentsOptions {
	maxBatches?: number;
	force?: boolean;
}

export class CommentService {
	constructor(
		private supabase: SupabaseClient<Database>,
		private youtube: Innertube
	) {}

	async collectComments(
		videoId: string,
		{ maxBatches = 5, force = false }: CollectCommentsOptions = {}
	): Promise<void> {
		console.log(
			`[comments] 수집 시작 videoId=${videoId} maxBatches=${maxBatches} force=${force} (약 ${maxBatches * 20}개)`
		);

		if (!force) {
			const { data: existing, error: checkError } = await this.supabase
				.from('comments')
				.select('comment_id')
				.eq('video_id', videoId)
				.limit(1)
				.maybeSingle();

			if (checkError) {
				console.error('[comments] 기존 댓글 확인 실패:', checkError);
			}

			if (existing) {
				const { data: existingComments } = await this.supabase
					.from('comments')
					.select('comment_id')
					.eq('video_id', videoId);

				const existingCount = existingComments?.length || 0;
				console.log(`[comments] 이미 존재 videoId=${videoId}, 기존 ${existingCount}개`);
				return;
			}
		}

		let commentsData = await this.youtube.getComments(videoId, 'NEWEST_FIRST');

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

		const commentsMap = new Map<string, Database['public']['Tables']['comments']['Insert']>();

		batchResults.flat().forEach((comment) => {
			if (!commentsMap.has(comment.comment_id)) {
				commentsMap.set(comment.comment_id, {
					comment_id: comment.comment_id,
					video_id: videoId,
					data: comment as unknown as Json
				});
			}
		});

		const allComments = Array.from(commentsMap.values());

		if (allComments.length > 0) {
			const { error: insertError } = await this.supabase
				.from('comments')
				.upsert(allComments, { onConflict: 'comment_id' });

			if (insertError) {
				console.error(`[comments] 저장 실패:`, insertError);
				throw error(500, `댓글 저장 실패: ${insertError.message}`);
			}
		}

		console.log(`[comments] 수집 완료: ${batches.length}배치, 총 ${allComments.length}개`);
	}

	async getCommentsFromDB(videoId: string) {
		console.log(`[comments] DB 조회 시작 videoId=${videoId}`);

		const { data: comments, error: fetchError } = await this.supabase
			.from('comments')
			.select('comment_id, data, updated_at')
			.eq('video_id', videoId)
			.order('updated_at', { ascending: false });

		if (fetchError) {
			throw error(500, `댓글 조회 실패: ${fetchError.message}`);
		}

		console.log(`[comments] DB 조회 완료 ${comments?.length || 0}개`);

		return comments || [];
	}
}
