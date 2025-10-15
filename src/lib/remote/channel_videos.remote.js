import { query, command, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import { error } from '@sveltejs/kit';

/**
 * Query: 채널 비디오 목록 조회 (Cursor 기반 무한 스크롤)
 * - 최신 영상이 앞으로 정렬 (published_at desc)
 * - Cursor 기반 페이지네이션
 */
export const getChannelVideos = query(
	v.object({
		channelId: v.string(),
		cursor: v.optional(v.string()),
		limit: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(100)), 20),
		sortBy: v.optional(v.picklist(['newest', 'oldest', 'popular']), 'newest'),
		search: v.optional(v.string())
	}),
	async ({ channelId, cursor, limit, sortBy, search }) => {
		if (!channelId) throw error(400, 'channelId is required');

		const { locals } = getRequestEvent();
		const { supabase } = locals;

		// 쿼리 빌더 시작
		let query = supabase
			.from('channel_videos')
			.select('*')
			.eq('channel_id', channelId);

		// 검색 필터
		if (search) query = query.ilike('title', `%${search}%`);

		// Cursor 기반 페이지네이션
		if (cursor) {
			switch (sortBy) {
				case 'oldest':
					query = query.gt('published_at', cursor);
					break;
				case 'popular':
					query = query.lt('view_count', cursor);
					break;
				case 'newest':
				default:
					query = query.lt('published_at', cursor);
					break;
			}
		}

		// 정렬
		switch (sortBy) {
			case 'oldest':
				query = query.order('published_at', { ascending: true });
				break;
			case 'popular':
				query = query.order('view_count', { ascending: false, nullsFirst: false });
				break;
			case 'newest':
			default:
				query = query.order('published_at', { ascending: false });
				break;
		}

		query = query.limit(limit);

		const { data: videos, error: dbError } = await query;

		if (dbError) throw error(500, dbError.message);

		// 다음 cursor = 마지막 항목의 정렬 기준 값
		let nextCursor = null;
		if (videos && videos.length > 0) {
			const lastVideo = videos[videos.length - 1];
			switch (sortBy) {
				case 'oldest':
				case 'newest':
					nextCursor = lastVideo.published_at;
					break;
				case 'popular':
					nextCursor = lastVideo.view_count;
					break;
			}
		}

		return {
			videos,
			nextCursor,
			hasMore: videos ? videos.length === limit : false
		};
	}
);

/**
 * Command: 채널 비디오 데이터 업서트
 * - 주어진 비디오 배열을 DB에 upsert
 */
export const upsertChannelVideos = command(
	v.object({
		videos: v.array(
			v.object({
				channel_id: v.string(),
				video_id: v.string(),
				title: v.optional(v.string()),
				thumbnail_url: v.optional(v.string()),
				duration: v.optional(v.string()),
				view_count: v.optional(v.string()),
				published_at: v.optional(v.string()),
				video_data: v.optional(v.any()),
				updated_at: v.optional(v.string())
			})
		)
	}),
	async ({ videos }) => {
		if (!videos || videos.length === 0) return { success: true, count: 0 };

		const { locals } = getRequestEvent();
		const { adminSupabase } = locals;

		const { error: upsertError } = await adminSupabase
			.from('channel_videos')
			.upsert(videos, { onConflict: 'video_id' });

		if (upsertError) throw error(500, upsertError.message);

		return { success: true, count: videos.length };
	}
);
