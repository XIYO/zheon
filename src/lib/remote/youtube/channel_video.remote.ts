import { query, command, form, getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import * as v from 'valibot';
import {
	getChannelVideos as getChannelVideosFromAPI,
	getChannels
} from '$lib/server/youtubeApi.js';
import { getYouTubeThumbnail } from '$lib/utils/youtube.js';
import type { Database } from '$lib/types/database.types';

/**
 * 배열을 지정한 크기만큼 잘라서 반환
 */
const chunk = <T>(items: T[], size: number): T[][] => {
	const result: T[][] = [];
	for (let i = 0; i < items.length; i += size) {
		result.push(items.slice(i, i + size));
	}
	return result;
};

/**
 * Query: 채널 비디오 목록 조회
 */
export const getChannelVideos = query(
	v.object({
		channelId: v.string(),
		cursor: v.optional(v.string()),
		limit: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(100)), 20),
		sortBy: v.optional(v.picklist(['newest', 'oldest']), 'newest'),
		search: v.optional(v.string())
	}),
	async ({
		channelId,
		cursor,
		limit,
		sortBy,
		search
	}: {
		channelId: string;
		cursor?: string;
		limit: number;
		sortBy: 'newest' | 'oldest';
		search?: string;
	}) => {
		if (!channelId) throw error(400, 'channelId is required');

		const { locals } = getRequestEvent();
		const { supabase } = locals;

		let queryBuilder = supabase.from('videos').select('*').eq('channel_id', channelId);

		if (search) queryBuilder = queryBuilder.ilike('title', `%${search}%`);

		if (cursor) {
			if (sortBy === 'oldest') {
				queryBuilder = queryBuilder.gt('published_at', cursor);
			} else {
				queryBuilder = queryBuilder.lt('published_at', cursor);
			}
		}

		queryBuilder = queryBuilder.order('published_at', {
			ascending: sortBy === 'oldest',
			nullsFirst: false
		});

		queryBuilder = queryBuilder.limit(limit);

		const { data: videos, error: dbError } = await queryBuilder;

		if (dbError) throw error(500, dbError.message);

		let nextCursor: string | null = null;
		if (videos && videos.length > 0) {
			const lastVideo = videos[videos.length - 1];
			nextCursor = lastVideo.published_at;
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
 */
export const upsertChannelVideos = command(
	v.object({
		videos: v.array(
			v.object({
				channel_id: v.string(),
				video_id: v.string(),
				title: v.string(),
				description: v.optional(v.string()),
				published_at: v.optional(v.string()),
				channel_title: v.optional(v.string()),
				thumbnail_url: v.optional(v.string()),
				thumbnail_width: v.optional(v.number()),
				thumbnail_height: v.optional(v.number()),
				playlist_id: v.optional(v.string()),
				position: v.optional(v.number()),
				video_data: v.optional(v.any())
			})
		)
	}),
	async ({ videos }) => {
		if (!videos || videos.length === 0) return { success: true, count: 0 };

		const { locals } = getRequestEvent();
		const { adminSupabase } = locals;

		const { error: upsertError } = await adminSupabase
			.from('videos')
			.upsert(videos, { onConflict: 'channel_id,video_id' });

		if (upsertError) throw error(500, upsertError.message);

		return { success: true, count: videos.length };
	}
);

/**
 * 채널 비디오 목록 동기화 공통 로직
 */
async function performChannelVideosSync(channelId: string) {
	const { locals } = getRequestEvent();
	const { adminSupabase: supabase } = locals;

	const { error: updateStartError } = await supabase
		.from('channels')
		.update({ video_sync_status: 'processing' })
		.eq('channel_id', channelId);

	if (updateStartError) throw error(500, updateStartError.message);

	try {
		const { data: latestVideo } = await supabase
			.from('videos')
			.select('video_id')
			.eq('channel_id', channelId)
			.order('published_at', { ascending: false })
			.limit(1)
			.single();

		const latestVideoId = latestVideo?.video_id;

		const { data: channel } = await supabase
			.from('channels')
			.select('uploads_playlist_id')
			.eq('channel_id', channelId)
			.single();

		let uploadsPlaylistId = channel?.uploads_playlist_id;

		if (!uploadsPlaylistId) {
			const channels = await getChannels(channelId);
			if (channels.length === 0) {
				throw error(404, '채널을 찾을 수 없습니다');
			}

			const channelData = channels[0];
			uploadsPlaylistId = channelData.uploads_playlist_id;

			const upsertData: {
				channel_id: string;
				title?: string;
				description?: string | null;
				custom_url?: string | null;
				published_at?: string | null;
				thumbnail_url?: string | null;
				thumbnail_width?: number | null;
				thumbnail_height?: number | null;
				view_count?: number | null;
				subscriber_count?: string | null;
				video_count?: number | null;
				uploads_playlist_id?: string | null;
				channel_data?: any;
				updated_at?: string;
			} = {
				channel_id: channelData.channel_id,
				updated_at: new Date().toISOString()
			};

			if (channelData.title) upsertData.title = channelData.title;
			if (channelData.description !== undefined) upsertData.description = channelData.description;
			if (channelData.custom_url !== undefined) upsertData.custom_url = channelData.custom_url;
			if (channelData.published_at !== undefined)
				upsertData.published_at = channelData.published_at;
			if (channelData.thumbnail_url !== undefined)
				upsertData.thumbnail_url = channelData.thumbnail_url;
			if (channelData.thumbnail_width !== undefined)
				upsertData.thumbnail_width = channelData.thumbnail_width;
			if (channelData.thumbnail_height !== undefined)
				upsertData.thumbnail_height = channelData.thumbnail_height;
			if (channelData.view_count !== undefined) upsertData.view_count = channelData.view_count;
			if (channelData.subscriber_count !== undefined)
				upsertData.subscriber_count = String(channelData.subscriber_count);
			if (channelData.video_count !== undefined) upsertData.video_count = channelData.video_count;
			if (channelData.uploads_playlist_id !== undefined)
				upsertData.uploads_playlist_id = channelData.uploads_playlist_id;
			if (channelData.channel_data !== undefined)
				upsertData.channel_data = channelData.channel_data;

			await supabase.from('channels').upsert(upsertData as any, { onConflict: 'channel_id' });
		}

		const result = await getChannelVideosFromAPI(channelId, {
			maxPages: 10,
			latestVideoId
		});

		if (result.videos.length > 0) {
			for (const videoChunk of chunk(result.videos, 100)) {
				const { error: videosError } = await supabase
					.from('videos')
					.upsert(videoChunk as Database['public']['Tables']['videos']['Insert'][], {
						onConflict: 'channel_id,video_id'
					});

				if (videosError) throw error(500, videosError.message);
			}
		}

		const { error: updateCompleteError } = await supabase
			.from('channels')
			.update({
				video_sync_status: 'completed',
				video_synced_at: new Date().toISOString()
			})
			.eq('channel_id', channelId);

		if (updateCompleteError) throw error(500, updateCompleteError.message);

		return {
			success: true,
			message: latestVideoId
				? `${result.videos.length}개의 새 영상이 동기화되었습니다`
				: '동기화가 완료되었습니다',
			videosCount: result.videos.length,
			isIncremental: !!latestVideoId
		};
	} catch (err) {
		await supabase
			.from('channels')
			.update({ video_sync_status: 'failed' })
			.eq('channel_id', channelId);

		const errorMessage = err instanceof Error ? err.message : String(err);
		const enhancedError = new Error(`[채널: ${channelId}] ${errorMessage}`);
		throw enhancedError;
	}
}

/**
 * Form: 채널 비디오 목록 동기화
 */
export const syncChannelVideos = form(
	v.object({
		channelId: v.string()
	}),
	async ({ channelId }: { channelId: string }, invalid: (_message: string) => void) => {
		if (!channelId) {
			invalid('채널 ID가 필요합니다');
			return;
		}

		const { locals } = getRequestEvent();
		const { supabase } = locals;

		const { data: channel, error: channelError } = await supabase
			.from('channels')
			.select('video_sync_status')
			.eq('channel_id', channelId)
			.single();

		if (channelError && channelError.code !== 'PGRST116') {
			throw error(500, channelError.message);
		}

		if (channel?.video_sync_status === 'processing') {
			invalid('이미 동기화가 진행 중입니다');
			return;
		}

		return await performChannelVideosSync(channelId);
	}
);

/**
 * Command: 채널 비디오 목록 동기화
 */
export const syncChannelVideosCommand = command(v.string(), async (channelId: string) => {
	if (!channelId) throw error(400, 'channelId is required');

	return await performChannelVideosSync(channelId);
});

/**
 * Command: 영상 정보 가져오기 및 저장
 */
export const getVideoInfo = command(
	v.object({
		videoId: v.string()
	}),
	async ({ videoId }: { videoId: string }) => {
		const { locals } = getRequestEvent();
		const { supabase } = locals;

		const { data: existing } = await supabase
			.from('videos')
			.select('video_id, title, thumbnail_url, channel_id, channel_title, published_at')
			.eq('video_id', videoId)
			.single();

		if (existing && existing.title) {
			return {
				video_id: existing.video_id,
				title: existing.title,
				thumbnail_url: existing.thumbnail_url || getYouTubeThumbnail(videoId, 'maxresdefault'),
				channel_id: existing.channel_id,
				channel_title: existing.channel_title,
				published_at: existing.published_at
			};
		}

		const { youtube } = locals;
		const videoInfo = await youtube.getBasicInfo(videoId);

		const title = videoInfo.basic_info.title || '제목 없음';
		const channelId = videoInfo.basic_info.channel_id;
		if (!channelId) throw error(400, '채널 ID를 찾을 수 없습니다');

		const channelTitle = videoInfo.basic_info.channel?.name || videoInfo.basic_info.author;
		const thumbnailUrl =
			videoInfo.basic_info.thumbnail?.at(0)?.url || getYouTubeThumbnail(videoId, 'maxresdefault');
		const startTimestamp = videoInfo.basic_info.start_timestamp;
		const publishedAt =
			startTimestamp && typeof startTimestamp === 'number'
				? new Date(startTimestamp * 1000).toISOString()
				: new Date().toISOString();

		const videoData = {
			video_id: videoId,
			channel_id: channelId,
			title,
			channel_title: channelTitle,
			thumbnail_url: thumbnailUrl,
			published_at: publishedAt
		};

		await supabase.from('videos').upsert(videoData, {
			onConflict: 'channel_id,video_id'
		});

		return videoData;
	}
);
