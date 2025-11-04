import { form, getRequestEvent, query } from '$app/server';
import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { getYouTubeClient } from '$lib/server/youtube-proxy.js';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * 배열을 지정한 크기만큼 잘라서 반환
 */
const chunk = (items, size) => {
	const result = [];
	for (let i = 0; i < items.length; i += size) {
		result.push(items.slice(i, i + size));
	}
	return result;
};

/**
 * Form: YouTube 채널 동기화 요청
 * - URL 파라미터에서 채널 ID 추출
 * - Edge Function 호출
 * - 즉시 응답 반환 (pending 상태)
 */
export const syncChannel = form(async () => {
	const { locals, params } = getRequestEvent();
	const { supabase } = locals;
	const { channelId } = params;

	if (!channelId) throw error(400, { message: '채널 ID가 필요합니다' });

	// Edge Function 호출
	const { error: fnError } = await supabase.functions.invoke('youtube-sync', {
		body: { channelId }
	});

	if (fnError) throw error(500, fnError);

	return { success: true, message: '동기화가 시작되었습니다' };
});

/**
 * YouTube 비디오 상세 정보
 */
export const getVideoInfo = query(v.string(), async (videoId) => {
	if (!videoId) throw error(400, 'videoId is required');

	try {
		const yt = await getYouTubeClient();
		const info = await yt.getBasicInfo(videoId);

		return {
			videoId,
			title: info.basic_info.title,
			description: info.basic_info.short_description,
			duration: info.basic_info.duration,
			viewCount: info.basic_info.view_count,
			likeCount: info.basic_info.like_count,
			isLive: info.basic_info.is_live,
			channel: {
				id: info.basic_info.channel_id,
				name: info.basic_info.channel?.name,
				thumbnail: info.basic_info.channel?.thumbnails?.[0]?.url
			},
			thumbnail: info.basic_info.thumbnail?.[0]?.url,
			publishedDate: info.basic_info.publish_date,
			category: info.basic_info.category
		};
	} catch (err) {
		throw error(500, err.message);
	}
});

/**
 * YouTube 검색
 */
export const searchYoutube = query(
	v.object({
		query: v.string(),
		type: v.optional(v.string()),
		upload_date: v.optional(v.string()),
		duration: v.optional(v.string()),
		sort_by: v.optional(v.string()),
		features: v.optional(v.string())
	}),
	async ({ query, type, upload_date, duration, sort_by, features }) => {
		if (!query) throw error(400, 'query is required');

		const filters = {};
		if (type) filters.type = type;
		if (upload_date) filters.upload_date = upload_date;
		if (duration) filters.duration = duration;
		if (sort_by) filters.sort_by = sort_by;
		if (features) filters.features = features.split(',');

		try {
			const yt = await getYouTubeClient();
			const results = await yt.search(query, filters);

			const items =
				results.results
					?.map((item) => {
						if (item.type === 'Video') {
							return {
								type: 'video',
								videoId: item.id,
								title: item.title?.text,
								thumbnail: item.best_thumbnail?.url,
								duration: item.duration?.text,
								viewCount: item.view_count?.text,
								publishedTime: item.published?.text,
								channel: {
									id: item.author?.id,
									name: item.author?.name,
									thumbnail: item.author?.best_thumbnail?.url
								}
							};
						}

						if (item.type === 'Channel') {
							return {
								type: 'channel',
								channelId: item.id,
								name: item.author?.name,
								thumbnail: item.author?.best_thumbnail?.url,
								subscriberCount: item.subscribers?.text,
								videoCount: item.video_count?.text
							};
						}

						if (item.type === 'Playlist') {
							return {
								type: 'playlist',
								playlistId: item.id,
								title: item.title?.text,
								thumbnail: item.first_videos?.[0]?.thumbnail?.[0]?.url,
								videoCount: item.video_count?.text,
								channel: {
									id: item.author?.id,
									name: item.author?.name
								}
							};
						}

						return null;
					})
					.filter(Boolean) || [];

			return {
				query,
				filters,
				estimatedResults: results.estimated_results,
				items,
				continuation: results.has_continuation ? 'available' : null
			};
		} catch (err) {
			throw error(500, err.message);
		}
	}
);

/**
 * YouTube 인기 급상승
 */
export const getTrending = query(v.optional(v.any()), async () => {
	try {
		const yt = await getYouTubeClient();
		const trending = await yt.getTrending();

		const videos =
			trending.videos?.map((video) => ({
				type: 'video',
				videoId: video.id,
				title: video.title?.text,
				thumbnail: video.best_thumbnail?.url,
				duration: video.duration?.text,
				viewCount: video.view_count?.text,
				publishedTime: video.published?.text,
				channel: {
					id: video.author?.id,
					name: video.author?.name,
					thumbnail: video.author?.best_thumbnail?.url
				}
			})) || [];

		return {
			videos,
			continuation: trending.has_continuation ? 'available' : null
		};
	} catch (err) {
		throw error(500, err.message);
	}
});

/**
 * YouTube 채널 기본 정보
 */
export const getChannelInfo = query(v.string(), async (channelId) => {
	if (!channelId) throw error(400, 'channelId is required');

	try {
		const yt = await getYouTubeClient();
		const channel = await yt.getChannel(channelId);

		// PageHeader 구조 (신형)
		if (channel.header?.type === 'PageHeader') {
			const content = channel.header.content;
			return {
				channelId: channel.metadata?.external_id,
				name: content?.title?.text?.text,
				handle: content?.metadata?.metadata_rows?.[0]?.metadata_parts?.[0]?.text?.text,
				description: channel.metadata?.description,
				thumbnail: content?.image?.avatar?.image?.[0]?.url,
				banner: content?.banner?.image?.[0]?.url,
				subscriberCount: undefined,
				videoCount: content?.metadata?.metadata_rows?.[1]?.metadata_parts?.[0]?.text?.text,
				links: []
			};
		}

		// C4TabbedHeader 구조 (구형)
		return {
			channelId: channel.header?.channel_id || channel.metadata?.external_id,
			name: channel.header?.author?.name || channel.metadata?.title,
			handle: channel.header?.channel_handle?.text,
			description: channel.metadata?.description,
			thumbnail: channel.header?.author?.best_thumbnail?.url || channel.metadata?.avatar?.[0]?.url,
			banner: channel.header?.banner?.[0]?.url,
			subscriberCount: channel.header?.subscribers?.text,
			videoCount: channel.header?.videos_count?.text,
			links:
				channel.header?.header_links?.primary_links?.map((link) => ({
					title: link.title?.text,
					url: link.endpoint?.metadata?.url
				})) || []
		};
	} catch (err) {
		throw error(500, err.message);
	}
});

/**
 * YouTube 채널 비디오 목록
 */
export const getChannelVideos = query(
	v.object({
		channelId: v.string(),
		filter: v.optional(v.string())
	}),
	async ({ channelId, filter }) => {
		if (!channelId) throw error(400, 'channelId is required');

		try {
			const yt = await getYouTubeClient();
			const channel = await yt.getChannel(channelId);
			let videosChannel = await channel.getVideos();

			if (filter === 'popular') {
				videosChannel = await videosChannel.applyFilter('Popular');
			}

			const items =
				videosChannel.videos?.map((video) => ({
					videoId: video.id,
					title: video.title?.text,
					thumbnail: video.best_thumbnail?.url,
					duration: video.duration?.text,
					viewCount: video.view_count?.text,
					publishedTime: video.published?.text
				})) || [];

			return {
				channelId,
				filter: filter || 'newest',
				videos: items,
				continuation: videosChannel.has_continuation ? 'available' : null
			};
		} catch (err) {
			throw error(500, err.message);
		}
	}
);

/**
 * YouTube 채널 재생목록
 */
export const getChannelPlaylists = query(v.string(), async (channelId) => {
	if (!channelId) throw error(400, 'channelId is required');

	try {
		const yt = await getYouTubeClient();
		const channel = await yt.getChannel(channelId);
		const playlistsChannel = await channel.getPlaylists();

		const playlists =
			playlistsChannel.playlists?.map((playlist) => ({
				playlistId: playlist.id,
				title: playlist.title?.text,
				thumbnail: playlist.best_thumbnail?.url,
				videoCount: playlist.video_count?.text,
				firstVideos:
					playlist.first_videos?.map((video) => ({
						videoId: video.id,
						thumbnail: video.thumbnails?.[0]?.url
					})) || []
			})) || [];

		return {
			channelId,
			playlists,
			continuation: playlistsChannel.has_continuation ? 'available' : null
		};
	} catch (err) {
		throw error(500, err.message);
	}
});

/**
 * YouTube 채널 About 정보
 */
export const getChannelAbout = query(v.string(), async (channelId) => {
	if (!channelId) throw error(400, 'channelId is required');

	try {
		const yt = await getYouTubeClient();
		const channel = await yt.getChannel(channelId);
		const about = await channel.getAbout();

		return {
			channelId,
			description: about.description?.text || about.description,
			country: about.country?.text || about.country,
			viewCount: about.view_count?.text || about.view_count,
			joinedDate: about.joined_date?.text || about.joined_date,
			links:
				about.links?.map((link) => ({
					title: link.title?.text || link.title,
					url: link.endpoint?.metadata?.url || link.url
				})) || [],
			email: about.email,
			stats: {
				subscribers: about.subscriber_count?.text || about.subscriber_count,
				videos: about.video_count?.text || about.video_count
			}
		};
	} catch (err) {
		throw error(500, err.message);
	}
});

/**
 * YouTube 재생목록 조회
 */
export const getPlaylist = query(v.string(), async (playlistId) => {
	if (!playlistId) throw error(400, 'playlistId is required');

	try {
		const yt = await getYouTubeClient();
		const playlist = await yt.getPlaylist(playlistId);

		const videos =
			playlist.videos?.map((video) => ({
				type: 'video',
				videoId: video.id,
				title: video.title?.text,
				thumbnail: video.best_thumbnail?.url,
				duration: video.duration?.text,
				viewCount: video.view_count?.text,
				channel: {
					id: video.author?.id,
					name: video.author?.name,
					thumbnail: video.author?.best_thumbnail?.url
				}
			})) || [];

		return {
			playlistId,
			title: playlist.info?.title?.text,
			description: playlist.info?.description?.text,
			videoCount: playlist.info?.total_items,
			viewCount: playlist.info?.views?.text,
			lastUpdated: playlist.info?.last_updated?.text,
			channel: {
				id: playlist.info?.author?.id,
				name: playlist.info?.author?.name,
				thumbnail: playlist.info?.author?.best_thumbnail?.url
			},
			videos,
			continuation: playlist.has_continuation ? 'available' : null
		};
	} catch (err) {
		throw error(500, err.message);
	}
});

/**
 * YouTube URL/핸들 해석
 */
export const resolveYoutubeUrl = query(v.string(), async (url) => {
	if (!url) throw error(400, 'url is required');

	try {
		const yt = await getYouTubeClient();
		const endpoint = await yt.resolveURL(url);

		const resolvedUrl = endpoint.metadata?.url || '';
		const channelId = resolvedUrl.match(/\/channel\/(UC[a-zA-Z0-9_-]+)/)?.[1];
		const videoId = resolvedUrl.match(/\/watch\?v=([a-zA-Z0-9_-]+)/)?.[1];
		const playlistId = resolvedUrl.match(/\/playlist\?list=([a-zA-Z0-9_-]+)/)?.[1];

		return {
			input: url,
			type: endpoint.metadata?.page_type,
			channelId,
			videoId,
			playlistId
		};
	} catch (err) {
		throw error(500, err.message);
	}
});

/**
 * YouTube 검색 자동완성 제안
 */
export const getSearchSuggestions = query(v.string(), async (query) => {
	if (!query) throw error(400, 'query is required');

	try {
		const yt = await getYouTubeClient();
		const suggestions = await yt.getSearchSuggestions(query);

		return {
			query,
			suggestions: suggestions || []
		};
	} catch (err) {
		throw error(500, err.message);
	}
});
