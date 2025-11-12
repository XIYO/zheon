import { query, command, form, getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import * as v from 'valibot';
import {
	getChannelVideos as getChannelVideosFromAPI,
	getChannels
} from '$lib/server/youtubeApi.js';
import { getYouTubeThumbnail } from '$lib/utils/youtube.js';

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

		let queryBuilder = supabase.from('channel_videos').select('*').eq('channel_id', channelId);

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
				title: v.optional(v.string()),
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
			.from('channel_videos')
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
			.from('channel_videos')
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

			await supabase.from('channels').upsert(
				{
					...channelData,
					updated_at: new Date().toISOString()
				},
				{ onConflict: 'channel_id' }
			);
		}

		const result = await getChannelVideosFromAPI(channelId, {
			maxPages: 10,
			latestVideoId
		});

		if (result.videos.length > 0) {
			for (const videoChunk of chunk(result.videos, 100)) {
				const { error: videosError } = await supabase
					.from('channel_videos')
					.upsert(videoChunk, { onConflict: 'channel_id,video_id' });

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
	async (
		{ channelId }: { channelId: string },
		invalid: (_key: string, _message: string) => void
	) => {
		if (!channelId) {
			invalid('channelId', '채널 ID가 필요합니다');
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
			.from('channel_videos')
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
		const channelTitle = videoInfo.basic_info.channel?.name || videoInfo.basic_info.author;
		const thumbnailUrl =
			videoInfo.basic_info.thumbnail?.at(0)?.url || getYouTubeThumbnail(videoId, 'maxresdefault');
		const publishedAt = videoInfo.basic_info.start_timestamp
			? new Date(videoInfo.basic_info.start_timestamp * 1000).toISOString()
			: new Date().toISOString();

		const videoData = {
			video_id: videoId,
			channel_id: channelId,
			title,
			channel_title: channelTitle,
			thumbnail_url: thumbnailUrl,
			published_at: publishedAt
		};

		await supabase.from('channel_videos').upsert(videoData, {
			onConflict: 'channel_id,video_id'
		});

		return videoData;
	}
);
