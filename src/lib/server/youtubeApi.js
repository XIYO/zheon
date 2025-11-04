import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * YouTube Data API v3 공통 요청 함수
 */
async function fetchYouTube(endpoint, params, init = {}) {
	const url = new URL(`${YOUTUBE_API_BASE}/${endpoint}`);

	if (params instanceof Map) {
		params.forEach((value, key) => {
			if (value !== undefined && value !== null) {
				url.searchParams.set(key, String(value));
			}
		});
	} else {
		Object.entries(params).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				url.searchParams.set(key, String(value));
			}
		});
	}

	const hasAuthHeader = init.headers?.Authorization;

	if (!hasAuthHeader) {
		const apiKey = env.YOUTUBE_API_KEY;
		if (!apiKey) {
			throw error(500, 'YOUTUBE_API_KEY 환경변수가 설정되지 않았습니다');
		}
		url.searchParams.set('key', apiKey);
	}

	const response = await fetch(url.toString(), {
		...init,
		headers: {
			Accept: 'application/json',
			...(init.headers || {})
		}
	});

	if (!response.ok) {
		const payload = await response.json().catch(() => null);
		const message = payload?.error?.message || response.statusText;

		if (response.status === 403 && message.includes('quotaExceeded')) {
			throw error(503, 'YouTube API 할당량 초과. 내일 다시 시도해주세요.');
		}

		throw error(response.status, `YouTube API 오류: ${message}`);
	}

	return response.json();
}

/**
 * 배열을 지정한 크기로 분할
 */
function chunk(items, size) {
	const result = [];
	for (let i = 0; i < items.length; i += size) {
		result.push(items.slice(i, i + size));
	}
	return result;
}

/**
 * 채널의 uploads playlist ID 가져오기
 */
export async function getChannelUploadsPlaylistId(channelId) {
	const data = await fetchYouTube('channels', {
		part: 'contentDetails',
		id: channelId
	});

	if (!data.items || data.items.length === 0) {
		throw error(404, '채널을 찾을 수 없습니다');
	}

	const uploadsPlaylistId = data.items[0].contentDetails?.relatedPlaylists?.uploads;

	if (!uploadsPlaylistId) {
		throw error(500, 'uploads playlist ID를 찾을 수 없습니다');
	}

	return uploadsPlaylistId;
}

/**
 * 채널 정보 가져오기 (batch 지원)
 */
export async function getChannels(channelIds) {
	const ids = Array.isArray(channelIds) ? channelIds : [channelIds];

	console.log(`[YouTube API] 채널 정보 요청 시작: ${ids.length}개`);

	if (ids.length === 0) return [];

	const allChannels = [];
	const chunks = chunk(ids, 50);

	console.log(`[YouTube API] 채널 정보 ${chunks.length}개 배치로 요청`);

	for (const idChunk of chunks) {
		console.log(`[YouTube API] 채널 배치 요청: ${idChunk.length}개`);
		const data = await fetchYouTube('channels', {
			part: 'snippet,statistics,contentDetails',
			id: idChunk.join(',')
		});

		if (data.items) {
			console.log(`[YouTube API] 채널 배치 응답: ${data.items.length}개`);
			allChannels.push(...data.items);
		} else {
			console.log('[YouTube API] 채널 배치 응답: 0개');
		}
	}

	console.log(`[YouTube API] 채널 정보 요청 완료: 총 ${allChannels.length}개`);

	return allChannels.map((item) => ({
		channel_id: item.id,
		title: item.snippet?.title,
		description: item.snippet?.description,
		custom_url: item.snippet?.customUrl,
		published_at: item.snippet?.publishedAt,
		thumbnail_url: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url,
		thumbnail_width: item.snippet?.thumbnails?.high?.width,
		thumbnail_height: item.snippet?.thumbnails?.high?.height,
		view_count: item.statistics?.viewCount ? item.statistics.viewCount : undefined,
		subscriber_count: item.statistics?.subscriberCount
			? item.statistics.subscriberCount
			: undefined,
		video_count: item.statistics?.videoCount ? parseInt(item.statistics.videoCount) : undefined,
		uploads_playlist_id: item.contentDetails?.relatedPlaylists?.uploads,
		channel_data: item
	}));
}

/**
 * 플레이리스트 아이템 가져오기
 */
export async function getPlaylistItems(playlistId, options = {}) {
	const { maxResults = 50, pageToken } = options;

	const data = await fetchYouTube('playlistItems', {
		part: 'snippet,contentDetails',
		playlistId,
		maxResults,
		pageToken
	});

	const items = (data.items || []).map((item) => ({
		channel_id: item.snippet?.channelId,
		video_id: item.contentDetails?.videoId,
		title: item.snippet?.title,
		description: item.snippet?.description,
		published_at: item.snippet?.publishedAt,
		channel_title: item.snippet?.channelTitle,
		thumbnail_url: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url,
		thumbnail_width: item.snippet?.thumbnails?.high?.width,
		thumbnail_height: item.snippet?.thumbnails?.high?.height,
		playlist_id: item.snippet?.playlistId,
		position: item.snippet?.position,
		video_data: item
	}));

	return {
		items,
		nextPageToken: data.nextPageToken,
		prevPageToken: data.prevPageToken,
		totalResults: data.pageInfo?.totalResults,
		resultsPerPage: data.pageInfo?.resultsPerPage
	};
}

/**
 * 채널의 모든 비디오 가져오기 (증분 동기화 지원)
 */
export async function getChannelVideos(channelId, options = {}) {
	const { maxPages = 10, latestVideoId } = options;

	const uploadsPlaylistId = await getChannelUploadsPlaylistId(channelId);

	const allVideos = [];
	let pageToken;
	let foundLatest = false;
	let pageCount = 0;

	while (!foundLatest && pageCount < maxPages) {
		const result = await getPlaylistItems(uploadsPlaylistId, {
			maxResults: 50,
			pageToken
		});

		for (const video of result.items) {
			if (latestVideoId && video.video_id === latestVideoId) {
				foundLatest = true;
				break;
			}
			allVideos.push(video);
		}

		if (!result.nextPageToken) break;

		pageToken = result.nextPageToken;
		pageCount++;
	}

	return {
		videos: allVideos,
		isIncremental: !!latestVideoId,
		foundLatest
	};
}

/**
 * 사용자 구독 목록 가져오기
 */
export async function getSubscriptions(accessToken, options = {}) {
	const { maxResults = 50, pageToken } = options;

	console.log('[YouTube API] 구독 목록 요청 시작', { maxResults, pageToken: pageToken || 'none' });

	const data = await fetchYouTube(
		'subscriptions',
		{
			part: 'snippet',
			mine: true,
			maxResults,
			pageToken
		},
		{
			headers: {
				Authorization: `Bearer ${accessToken}`
			}
		}
	);

	console.log('[YouTube API] 구독 목록 응답:', {
		items: data.items?.length || 0,
		nextPageToken: data.nextPageToken || 'none',
		totalResults: data.pageInfo?.totalResults
	});

	const items = (data.items || []).map((item) => ({
		channel_id: item.snippet?.resourceId?.channelId,
		title: item.snippet?.title,
		description: item.snippet?.description,
		published_at: item.snippet?.publishedAt,
		thumbnail_url: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url,
		resource_kind: item.snippet?.resourceId?.kind,
		subscription_data: item
	}));

	return {
		items,
		nextPageToken: data.nextPageToken,
		totalResults: data.pageInfo?.totalResults
	};
}

/**
 * 모든 구독 목록 가져오기 (페이지네이션 자동 처리)
 */
export async function getAllSubscriptions(accessToken) {
	console.log('[YouTube API] 모든 구독 목록 가져오기 시작');
	const allSubscriptions = [];
	let pageToken;
	let pageCount = 0;

	do {
		pageCount++;
		console.log(`[YouTube API] 페이지 ${pageCount} 요청 중...`);
		const result = await getSubscriptions(accessToken, { pageToken });
		allSubscriptions.push(...result.items);
		pageToken = result.nextPageToken;
	} while (pageToken);

	console.log(
		`[YouTube API] 모든 구독 목록 가져오기 완료: 총 ${allSubscriptions.length}개 (${pageCount}페이지)`
	);
	return allSubscriptions;
}
