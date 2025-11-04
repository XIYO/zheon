import { command, form, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { getYouTubeClient } from '$lib/server/youtube-proxy.js';

const CollectCommentsInputSchema = v.object({
	videoId: v.pipe(v.string(), v.minLength(1)),
	maxComments: v.optional(v.number(), 100)
});

export const collectComments = command(
	CollectCommentsInputSchema,
	async (input) => {
		try {
			const { videoId, maxComments = 100 } = v.parse(CollectCommentsInputSchema, input);
			const { locals } = getRequestEvent();
			const { supabase } = locals;

			console.log(`[comments] 증분 수집 시작 videoId=${videoId} max=${maxComments}`);

			// 1단계: 최근 댓글 ID 3개 조회
			const { data: recentComments } = await supabase
				.from('comments')
				.select('comment_id')
				.eq('video_id', videoId)
				.order('updated_at', { ascending: false })
				.limit(3);

			const recentIds = new Set(recentComments?.map(c => c.comment_id) || []);
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
				const comments = commentsData.contents.map(thread => thread.comment);

				console.log(`[comments] 배치 ${batchCount}: ${comments.length}개 수집`);

				// 4단계: 중복 체크
				const hasDuplicate = comments.some(c => recentIds.has(c.comment_id));

				if (hasDuplicate) {
					console.log(`[comments] 중복 발견! 수집 중단 (총 ${totalCollected}개)`);
					stoppedByDuplicate = true;
					break;
				}

				// 5단계: 저장
				const rows = comments.map(comment => ({
					comment_id: comment.comment_id,
					video_id: videoId,
					data: comment
				}));

				console.log(`[comments] 저장할 rows 개수: ${rows.length}`);
				console.log(`[comments] 저장할 rows 샘플:`, JSON.stringify(rows[0], null, 2));

				const { error: insertError } = await supabase.from('comments').insert(rows);

				if (insertError) {
					console.error(`[comments] 저장 실패 - 전체 에러:`, JSON.stringify(insertError, null, 2));
					console.error(`[comments] 저장 실패 - code:`, insertError.code);
					console.error(`[comments] 저장 실패 - message:`, insertError.message);
					console.error(`[comments] 저장 실패 - details:`, insertError.details);
					console.error(`[comments] 저장 실패 - hint:`, insertError.hint);
					throw error(500, `댓글 저장 실패: ${insertError.message || insertError.code || JSON.stringify(insertError)}`);
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
	}
);

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

export const loadVideoInsight = command(
	v.object({
		videoId: v.pipe(v.string(), v.minLength(1))
	}),
	async (input) => {
		try {
			const { videoId } = v.parse(v.object({ videoId: v.string() }), input);
			const { locals } = getRequestEvent();
			const { supabase } = locals;

			const { data: video, error: fetchError } = await supabase
				.from('videos')
				.select('video_insight, last_analyzed_at')
				.eq('video_id', videoId)
				.single();

			if (fetchError && fetchError.code !== 'PGRST116') {
				throw error(500, `Failed to fetch insight: ${fetchError.message}`);
			}

			return {
				success: true,
				videoId,
				insight: video?.video_insight || null,
				lastAnalyzedAt: video?.last_analyzed_at || null
			};
		} catch (err) {
			console.error('Load insight error:', err);
			throw error(500, err instanceof Error ? err.message : 'Unknown error');
		}
	}
);

const FetchLiveCommentsSchema = v.object({
	videoId: v.pipe(
		v.string('videoId를 입력하세요'),
		v.transform((s) => s.trim()),
		v.minLength(1, 'videoId를 입력하세요')
	),
	sortBy: v.optional(v.picklist(['top', 'newest']), 'top'),
	limit: v.optional(
		v.union([
			v.number(),
			v.pipe(
				v.string(),
				v.transform((value) => {
					const parsed = Number.parseInt(value, 10);
					return Number.isFinite(parsed) ? parsed : 1000;
				})
			)
		]),
		1000
	)
});

function formatComments(comments) {
	return comments
		.map((comment, idx) => {
			const headerParts = [];
			if (comment.author?.name) headerParts.push(comment.author.name);
			if (comment.publishedTime) headerParts.push(comment.publishedTime);
			headerParts.push(`👍 ${comment.likeCount ?? 0}`);
			return `${idx + 1}. ${headerParts.join(' · ')}\n${comment.text}`;
		})
		.join('\n\n');
}

export const fetchLiveComments = form(FetchLiveCommentsSchema, async ({ videoId, sortBy = 'top', limit = 1000 }) => {
	const safeLimit = Math.min(Math.max(Number(limit) || 1000, 1), 1000);
	console.log(`[comments] live fetch start videoId=${videoId} sortBy=${sortBy} limit=${safeLimit}`);
	try {
		const yt = await getYouTubeClient();
		const sortParam = sortBy === 'newest' ? 'NEWEST_FIRST' : 'TOP_COMMENTS';
		const data = await yt.getComments(videoId, sortParam);
		const items = data?.contents || [];
		const comments = items.slice(0, safeLimit).map((comment, idx) => {
			const rawComment = comment.comment ?? comment?.comment_renderer ?? comment;
			const commentId = comment.comment_id ?? rawComment?.comment_id ?? rawComment?.id ?? rawComment?.commentId;
			if (!commentId) {
				console.warn('[comments] comment without id', Object.keys(comment), rawComment?.id);
			}
			const commentData = rawComment;

		if (idx === 0) {
			console.log('[comments] sample raw comment data:'  , JSON.stringify(commentData, null, 2));
		}
			return {
				id: commentId,
				author: {
					name: commentData?.author?.name,
					channelId: commentData?.author?.id,
					thumbnail: commentData?.author?.best_thumbnail?.url
				},
				text: commentData?.content?.text ?? '',
				publishedTime: commentData?.published?.text,
			publishedTimestamp: commentData?.published?.timestamp || commentData?.timestamp,
				likeCount: commentData?.vote_count ?? 0,
				isPinned: commentData?.is_pinned ?? false,
				replyCount: comment.reply_count || 0
			};
		});

		const formatted = formatComments(comments);
		console.log(`[comments] live fetch success videoId=${videoId} count=${comments.length}`);
		return {
			success: true,
			videoId,
			sortBy,
			limit: safeLimit,
			total: comments.length,
			comments,
			formatted
		};
	} catch (err) {
		console.error(`[comments] live fetch error videoId=${videoId}`, err);
		throw error(500, err instanceof Error ? err.message : '알 수 없는 오류');
	}
});

const FetchTranscriptSchema = v.object({
	videoId: v.pipe(
		v.string('videoId를 입력하세요'),
		v.transform((s) => s.trim()),
		v.minLength(1, 'videoId를 입력하세요')
	),
	limit: v.optional(
		v.union([
			v.number(),
			v.pipe(
				v.string(),
				v.transform((value) => {
					const parsed = Number.parseInt(value, 10);
					return Number.isFinite(parsed) ? parsed : 100;
				})
			)
		]),
		100
	)
});

export const fetchTranscript = form(FetchTranscriptSchema, async ({ videoId, limit = 100 }) => {
	const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 1000);
	console.log(`[transcript] fetch start videoId=${videoId} limit=${safeLimit}`);

	const { locals } = getRequestEvent();
	const { supabase } = locals;

	try {
		const { data: existing, error: checkError } = await supabase
			.from('transcripts')
			.select('id')
			.eq('video_id', videoId)
			.maybeSingle();

		if (checkError) {
			throw error(500, `자막 확인 실패: ${checkError.message}`);
		}

		if (existing) {
			console.log(`[transcript] already exists videoId=${videoId}`);
			return {
				success: true,
				videoId,
				status: 'exists',
				message: '이미 수집된 자막입니다'
			};
		}

		const yt = await getYouTubeClient();
		const video = await yt.getBasicInfo(videoId);
		const transcriptData = await video.getTranscript();

		if (!transcriptData || !transcriptData.content) {
			console.log(`[transcript] no transcript available videoId=${videoId}`);
			return {
				success: false,
				videoId,
				status: 'no_transcript',
				message: '자막을 사용할 수 없습니다'
			};
		}

		const { error: insertError } = await supabase
			.from('transcripts')
			.insert({
				video_id: videoId,
				data: transcriptData
			});

		if (insertError) {
			throw error(500, `자막 저장 실패: ${insertError.message}`);
		}

		console.log(`[transcript] fetch success videoId=${videoId} segments=${transcriptData.content.length}`);

		return {
			success: true,
			videoId,
			status: 'created',
			segmentCount: transcriptData.content.length,
			message: '자막 수집 완료'
		};
	} catch (err) {
		console.error(`[transcript] fetch error videoId=${videoId}`, err);
		throw error(500, err instanceof Error ? err.message : '알 수 없는 오류');
	}
});
