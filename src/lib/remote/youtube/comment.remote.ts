import { command, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { getYouTubeClient } from '$lib/server/youtube-proxy.js';
import { CollectCommentsInputSchema } from './comment.schema.ts';

export const collectComments = command(CollectCommentsInputSchema, async (input) => {
	try {
		const { videoId, maxComments = 100 } = v.parse(CollectCommentsInputSchema, input);
		const { locals } = getRequestEvent();
		const { supabase, adminSupabase } = locals;

		console.log(`[comments] 증분 수집 시작 videoId=${videoId} max=${maxComments}`);

		// 1단계: 최근 댓글 ID 3개 조회
		const { data: recentComments } = await supabase
						.from('comments')
			.select('comment_id')
			.eq('video_id', videoId)
			.order('updated_at', { ascending: false })
			.limit(3);

		const recentIds = new Set(recentComments?.map((c) => c.comment_id) || []);
		console.log(`[comments] 기존 최근 댓글 ${recentIds.size}개`);

		// 2단계: YouTube에서 최신순 댓글 수집 시작
		const yt = await getYouTubeClient();
		let commentsData = await yt.getComments(videoId, 'NEWEST_FIRST');

		let totalCollected = 0;
		let batchCount = 0;
		let stoppedByDuplicate = false;

		// 3단계: 반복 수집
		while (commentsData && totalCollected < maxComments) {
			batchCount++;
			const comments = commentsData.contents.map((thread) => thread.comment);

			console.log(`[comments] 배치 ${batchCount}: ${comments.length}개 수집`);

			// 4단계: 중복 체크
			const hasDuplicate = comments.some((c) => recentIds.has(c.comment_id));

			if (hasDuplicate) {
				console.log(`[comments] 중복 발견! 수집 중단 (총 ${totalCollected}개)`);
				stoppedByDuplicate = true;
				break;
			}

			// 5단계: 저장
			const rows = comments.map((comment) => ({
				comment_id: comment.comment_id,
				video_id: videoId,
				data: comment
			}));

			console.log(`[comments] 저장할 rows 개수: ${rows.length}`);
			console.log(`[comments] 저장할 rows 샘플:`, JSON.stringify(rows[0], null, 2));

			const { error: insertError } = await adminSupabase
								.from('comments')
				.insert(rows);

			if (insertError) {
				console.error(`[comments] 저장 실패 - 전체 에러:`, JSON.stringify(insertError, null, 2));
				console.error(`[comments] 저장 실패 - code:`, insertError.code);
				console.error(`[comments] 저장 실패 - message:`, insertError.message);
				console.error(`[comments] 저장 실패 - details:`, insertError.details);
				console.error(`[comments] 저장 실패 - hint:`, insertError.hint);
				throw error(
					500,
					`댓글 저장 실패: ${insertError.message || insertError.code || JSON.stringify(insertError)}`
				);
			}

			totalCollected += comments.length;
			console.log(`[comments] ${comments.length}개 저장 완료 (누적: ${totalCollected})`);

			// 6단계: 다음 배치 확인
			if (totalCollected >= maxComments) {
				console.log(`[comments] 최대 개수 도달 (${maxComments})`);
				break;
			}

			if (!commentsData.has_continuation) {
				console.log(`[comments] 더 이상 댓글 없음`);
				break;
			}

			// 7단계: 다음 배치 가져오기
			commentsData = await commentsData.getContinuation();
		}

		return {
			success: true,
			videoId,
			collected: totalCollected,
			batches: batchCount,
			stoppedByDuplicate,
			message: stoppedByDuplicate
				? `증분 수집 완료 (중복 발견, ${totalCollected}개 추가)`
				: `수집 완료 (${totalCollected}개)`
		};
	} catch (err) {
		console.error('[comments] 수집 실패:', err);
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
			const { supabase } = locals;

			console.log(`[comments] DB 조회 시작 videoId=${videoId}`);

			const { data: comments, error: fetchError } = await supabase
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
		} catch (err) {
			console.error('[comments] DB 조회 실패:', err);
			throw error(500, err instanceof Error ? err.message : '알 수 없는 오류');
		}
	}
);
