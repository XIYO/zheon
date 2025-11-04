import { form, command, getRequestEvent, query } from '$app/server';
import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { getYouTubeClient } from '$lib/server/youtube-proxy.js';
import { upsertChannel } from '$lib/remote/youtube/channel.remote.js';

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
 * 사용자 YouTube 구독 채널 동기화 공통 로직
 * - Google OAuth 토큰으로 API 호출
 * - 채널/구독 테이블 갱신
 */
async function performSubscriptionsSync() {
	const { locals } = getRequestEvent();
	const { supabase, safeGetSession } = locals;
	const { session, user } = await safeGetSession();

	if (!session) throw error(401, '로그인이 필요합니다');

	const userId = user.id;

	// 1. 현재 동기화 상태 확인
	const { data: profile, error: profileError } = await supabase
		.from('profiles')
		.select('youtube_subscription_sync_status')
		.eq('id', userId)
		.single();

	if (profileError) throw error(500, profileError.message);

	// 이미 동기화 진행 중이면 조용히 리턴 (다른 탭에서 진행 중)
	if (profile?.youtube_subscription_sync_status === 'processing') {
		return {
			success: true,
			message: '동기화가 이미 진행 중입니다',
			channelsSynced: 0,
			subscriptionsSynced: 0,
			alreadyInProgress: true
		};
	}

	// 2. 동기화 시작: processing 상태로 변경
	const { error: updateStartError } = await supabase
		.from('profiles')
		.update({ youtube_subscription_sync_status: 'processing' })
		.eq('id', userId);

	if (updateStartError) throw error(500, updateStartError.message);

	try {
	const refreshToken = session.provider_refresh_token;
	let accessToken = session.provider_token;

	const ensureToken = async () => {
		if (accessToken) return accessToken;

		if (!refreshToken) {
			throw error(401, 'Google 인증 토큰이 없습니다');
		}

		const { data, error: refreshError } = await supabase.auth.refreshSession({
			refresh_token: refreshToken
		});

		if (refreshError || !data?.session?.provider_token) {
			throw error(401, refreshError?.message || 'Google 토큰을 갱신할 수 없습니다');
		}

		accessToken = data.session.provider_token;
		return accessToken;
	};

	const fetchYoutube = async (endpoint, params, init) => {
		const token = await ensureToken();
		const url = new URL(`${YOUTUBE_API_BASE}/${endpoint}`);
		params?.forEach((value, key) => {
			if (value) url.searchParams.set(key, value);
		});

		const response = await fetch(url.toString(), {
			...init,
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/json',
				...(init?.headers || {})
			}
		});

		if (response.status === 401 && refreshToken) {
			accessToken = undefined;
			const retriedToken = await ensureToken();
			return fetchYoutube(endpoint, params, {
				...init,
				headers: {
					...(init?.headers || {}),
					Authorization: `Bearer ${retriedToken}`
				}
			});
		}

		if (!response.ok) {
			const payload = await response.json().catch(() => null);
			const message = payload?.error?.message || response.statusText;
			throw error(response.status, `YouTube API 오류: ${message}`);
		}

		return response.json();
	};

	// 1. 구독 목록 불러오기 (페이지네이션 처리)
	const subscriptions = [];
	let pageToken;

	do {
		const params = new Map([
			['part', 'snippet,contentDetails'],
			['mine', 'true'],
			['maxResults', '50'],
			['pageToken', pageToken]
		]);

		const data = await fetchYoutube('subscriptions', params);
		if (Array.isArray(data?.items)) {
			subscriptions.push(...data.items);
		}

		pageToken = data?.nextPageToken;
	} while (pageToken);

	if (subscriptions.length === 0) {
		await supabase.from('youtube_subscriptions').delete().eq('user_id', userId);
		return {
			success: true,
			message: '동기화할 구독 채널이 없습니다',
			channelsSynced: 0,
			subscriptionsSynced: 0
		};
	}

	const subscriptionChannels = subscriptions
		.map((item) => item?.snippet?.resourceId?.channelId)
		.filter(Boolean);

	const uniqueChannelIds = [...new Set(subscriptionChannels)];
	const channelDetails = new Map();

	// 2. 채널 상세 정보 조회 (최대 50개씩)
	for (const idChunk of chunk(uniqueChannelIds, 50)) {
		const params = new Map([
			['part', 'snippet,statistics,brandingSettings'],
			['id', idChunk.join(',')]
		]);

		const data = await fetchYoutube('channels', params);
		for (const item of data?.items || []) {
			const channelId = item?.id;
			if (!channelId) continue;

			const snippet = item.snippet || {};
			const thumbnails = snippet.thumbnails || {};
			const statistics = item.statistics || {};
			const branding = item.brandingSettings?.channel || {};

			const avatar = thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url;
			const handle = branding.handle || (snippet.customUrl ? `@${snippet.customUrl.replace(/^@/, '')}` : undefined);
			const description = branding.description || snippet.description;
			const subscriberCount = statistics.subscriberCount;
			const videoCount = statistics.videoCount ? Number(statistics.videoCount) : undefined;

			channelDetails.set(channelId, {
				channel_id: channelId,
				title: snippet.title || channelId,
				thumbnail_url: avatar,
				custom_url: handle,
				subscriber_count: subscriberCount,
				description,
				video_count: videoCount,
				channel_data: item
			});
		}
	}

	const now = new Date().toISOString();

	const subscriptionRows = uniqueChannelIds.map((channelId) => ({
		user_id: userId,
		channel_id: channelId,
		subscribed_at:
			subscriptions.find((item) => item?.snippet?.resourceId?.channelId === channelId)?.snippet
				?.publishedAt || now,
		updated_at: now
	}));

	const channelRows = Array.from(channelDetails.values());

	// 3. DB 업데이트 (채널 정보 upsert → 사용자 구독 갱신)
	if (channelRows.length > 0) {
		for (const channel of channelRows) {
			upsertChannel(channel);
		}
	}

	const { error: deleteError } = await supabase
		.from('youtube_subscriptions')
		.delete()
		.eq('user_id', userId);

	if (deleteError) throw error(500, deleteError.message);

	for (const rowsChunk of chunk(subscriptionRows, 100)) {
		const { error: insertError } = await supabase
			.from('youtube_subscriptions')
			.insert(rowsChunk);

		if (insertError) throw error(500, insertError.message);
	}

		// 3. 동기화 완료: completed 상태로 변경
		await supabase
			.from('profiles')
			.update({
				youtube_subscription_sync_status: 'completed',
				youtube_subscription_synced_at: new Date().toISOString()
			})
			.eq('id', userId);

		return {
			success: true,
			message: 'YouTube 구독 동기화를 완료했습니다',
			channelsSynced: channelRows.length,
			subscriptionsSynced: subscriptionRows.length
		};
	} catch (err) {
		// 4. 동기화 실패: failed 상태로 변경
		await supabase
			.from('profiles')
			.update({ youtube_subscription_sync_status: 'failed' })
			.eq('id', userId);

		throw err;
	}
}

/**
 * Form: 사용자 YouTube 구독 채널 동기화 (HTML form 제출용)
 */
export const syncSubscriptions = form(v.object({}), async (data, invalid) => {
	const { locals } = getRequestEvent();
	const { supabase, safeGetSession } = locals;
	const { session, user } = await safeGetSession();

	if (!session) throw error(401, '로그인이 필요합니다');

	const userId = user.id;

	// 동기화 상태 체크
	const { data: profile, error: profileError } = await supabase
		.from('profiles')
		.select('youtube_subscription_sync_status')
		.eq('id', userId)
		.single();

	if (profileError) throw error(500, profileError.message);

	// 이미 동기화 중이면 validation 에러
	if (['processing', 'pending'].includes(profile?.youtube_subscription_sync_status)) {
		invalid('이미 동기화가 진행 중입니다');
		return;
	}

	return await performSubscriptionsSync();
});

/**
 * Command: 사용자 YouTube 구독 채널 동기화 (프로그래매틱 호출용)
 */
export const syncSubscriptionsCommand = command(async () => {
	return await performSubscriptionsSync();
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
 * YouTube 비디오 자막
 */
export const getVideoTranscript = query(v.string(), async (videoId) => {
	if (!videoId) throw error(400, 'videoId is required');

	try {
		const yt = await getYouTubeClient();
		const info = await yt.getInfo(videoId);
		const transcript = await info.getTranscript();

		const segments = transcript?.transcript?.content?.body?.initial_segments || [];
		const captions = segments.map((segment) => ({
			start: parseInt(segment.start_ms) / 1000,
			end: parseInt(segment.end_ms) / 1000,
			text: segment.snippet.text
		}));

		return {
			videoId,
			title: info.basic_info.title,
			duration: info.basic_info.duration,
			captions
		};
	} catch (err) {
		throw error(500, err.message);
	}
});

/**
 * YouTube 비디오 댓글
 */
export const getVideoComments = query(
	v.object({
		videoId: v.string(),
		sortBy: v.optional(v.picklist(['top', 'newest']), 'top'),
		continuation: v.optional(v.string())
	}),
	async ({ videoId, sortBy = 'top', continuation }) => {
		if (!videoId) throw error(400, 'videoId is required');

		try {
			const yt = await getYouTubeClient();
			const sortByParam = sortBy === 'newest' ? 'NEWEST_FIRST' : 'TOP_COMMENTS';
			const commentsData = await yt.getComments(videoId, sortByParam);

			const comments =
				commentsData.contents?.map((comment) => {
					const commentData = comment.comment;
					return {
						id: comment.comment_id,
						author: {
							name: commentData?.author?.name,
							channelId: commentData?.author?.id,
							thumbnail: commentData?.author?.best_thumbnail?.url
						},
						text: commentData?.content?.text,
						publishedTime: commentData?.published?.text,
						likeCount: commentData?.vote_count,
						isLiked: commentData?.is_liked,
						isPinned: commentData?.is_pinned,
						replyCount: comment.reply_count || 0
					};
				}) || [];

			return {
				videoId,
				sortBy,
				comments,
				continuation: commentsData.has_continuation ? 'available' : null
			};
		} catch (err) {
			throw error(500, err.message);
		}
	}
);

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

/**
 * YouTube 구독 목록 조회 (커서 기반 페이지네이션)
 * - 유저의 구독 채널 목록과 동기화 정보를 가져옴
 */
export const getSubscriptions = query(
	v.optional(v.object({
		cursor: v.optional(v.string()),
		limit: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(100)), 20),
		sortBy: v.optional(v.picklist(['newest', 'oldest']), 'newest')
	})),
	async (params = {}) => {
		const { cursor, limit = 20, sortBy = 'newest' } = params;
		const { locals } = getRequestEvent();
		const { supabase, safeGetSession } = locals;
		const { session, user } = await safeGetSession();

		if (!session) throw error(401, 'Unauthorized');

		const userId = user.id;
		const ascending = sortBy === 'oldest';

		// 구독 채널 목록 조회 (정규화된 테이블에서)
		let query = supabase
			.from('youtube_subscriptions')
			.select(`
				id,
				subscribed_at,
				channel:channels (
					channel_id,
					title,
					custom_url,
					thumbnail_url,
					subscriber_count,
					video_count,
					description,
					updated_at
				)
			`)
			.eq('user_id', userId)
			.order('subscribed_at', { ascending })
			.limit(limit + 1);

		if (cursor) {
			if (ascending) query = query.gt('subscribed_at', cursor);
			else query = query.lt('subscribed_at', cursor);
		}

		const { data, error: subError } = await query;

		if (subError) throw error(500, subError.message);

		const hasMore = data.length > limit;
		const subscriptions = hasMore ? data.slice(0, limit) : data;
		const nextCursor = hasMore ? subscriptions[subscriptions.length - 1].subscribed_at : null;

		return { subscriptions, nextCursor, hasMore };
	}
);



