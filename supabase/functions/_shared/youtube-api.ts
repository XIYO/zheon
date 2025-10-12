/**
 * YouTube Data API v3 클라이언트
 *
 * 공식 YouTube Data API를 사용하여 채널 정보 및 영상 목록 가져오기
 */

export interface ChannelInfo {
	success: boolean;
	channel?: {
		id: string;
		name: string;
		description: string;
		thumbnail: string;
		subscriberCount?: string;
	};
	videos?: Array<{
		id: string;
		title: string;
		thumbnail: string;
		publishedAt: string;
		url: string;
	}>;
	error?: string;
}

/**
 * 핸들(@username)을 채널 ID로 변환
 */
async function resolveHandleToChannelId(
	handle: string,
	apiKey: string
): Promise<string | null> {
	const url = new URL("https://www.googleapis.com/youtube/v3/search");
	url.searchParams.set("part", "snippet");
	url.searchParams.set("q", handle);
	url.searchParams.set("type", "channel");
	url.searchParams.set("maxResults", "1");
	url.searchParams.set("key", apiKey);

	const response = await fetch(url.toString());
	if (!response.ok) {
		throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
	}

	const data = await response.json();
	if (data.items && data.items.length > 0) {
		return data.items[0].snippet.channelId;
	}

	return null;
}

/**
 * 채널 정보 가져오기
 */
async function getChannelDetails(channelId: string, apiKey: string) {
	const url = new URL("https://www.googleapis.com/youtube/v3/channels");
	url.searchParams.set("part", "snippet,contentDetails,statistics");
	url.searchParams.set("id", channelId);
	url.searchParams.set("key", apiKey);

	const response = await fetch(url.toString());
	if (!response.ok) {
		throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
	}

	const data = await response.json();
	if (!data.items || data.items.length === 0) {
		throw new Error("Channel not found");
	}

	const channel = data.items[0];
	return {
		id: channel.id,
		name: channel.snippet.title,
		description: channel.snippet.description,
		thumbnail:
			channel.snippet.thumbnails?.high?.url ||
			channel.snippet.thumbnails?.default?.url ||
			"",
		subscriberCount: channel.statistics?.subscriberCount
			? parseInt(channel.statistics.subscriberCount).toLocaleString()
			: undefined,
		uploadsPlaylistId: channel.contentDetails?.relatedPlaylists?.uploads,
	};
}

/**
 * 채널의 최신 영상 목록 가져오기
 */
async function getChannelVideos(
	uploadsPlaylistId: string,
	maxVideos: number,
	apiKey: string
) {
	const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
	url.searchParams.set("part", "snippet");
	url.searchParams.set("playlistId", uploadsPlaylistId);
	url.searchParams.set("maxResults", Math.min(maxVideos, 50).toString());
	url.searchParams.set("key", apiKey);

	const response = await fetch(url.toString());
	if (!response.ok) {
		throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
	}

	const data = await response.json();
	if (!data.items) {
		return [];
	}

	return data.items.map((item: any) => ({
		id: item.snippet.resourceId.videoId,
		title: item.snippet.title,
		thumbnail:
			item.snippet.thumbnails?.high?.url ||
			item.snippet.thumbnails?.default?.url ||
			"",
		publishedAt: item.snippet.publishedAt,
		url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
	}));
}

/**
 * 채널 ID 또는 핸들로 채널 정보 및 영상 목록 가져오기
 * @param channelIdOrHandle - 채널 ID (UCxxx) 또는 핸들 (@username)
 * @param maxVideos - 최대 영상 개수 (기본 30)
 */
export async function getChannelInfo(
	channelIdOrHandle: string,
	maxVideos: number = 30
): Promise<ChannelInfo> {
	const apiKey = Deno.env.get("YOUTUBE_API_KEY");
	if (!apiKey) {
		return {
			success: false,
			error: "YOUTUBE_API_KEY environment variable is not set",
		};
	}

	try {
		console.log(`[YouTube API] Fetching: ${channelIdOrHandle}`);

		let channelId = channelIdOrHandle;

		// 핸들인 경우 채널 ID로 변환
		if (channelIdOrHandle.startsWith("@")) {
			console.log(`[YouTube API] Resolving handle to channel ID...`);
			const resolvedId = await resolveHandleToChannelId(channelIdOrHandle, apiKey);
			if (!resolvedId) {
				return {
					success: false,
					error: "Could not resolve channel handle to ID",
				};
			}
			channelId = resolvedId;
			console.log(`[YouTube API] Resolved to ID: ${channelId}`);
		}

		// 채널 정보 가져오기
		console.log(`[YouTube API] Getting channel details...`);
		const channelDetails = await getChannelDetails(channelId, apiKey);

		// 영상 목록 가져오기
		console.log(`[YouTube API] Fetching videos...`);
		const videos = channelDetails.uploadsPlaylistId
			? await getChannelVideos(channelDetails.uploadsPlaylistId, maxVideos, apiKey)
			: [];

		console.log(`[YouTube API] ✅ Success: ${videos.length} videos`);

		return {
			success: true,
			channel: {
				id: channelDetails.id,
				name: channelDetails.name,
				description: channelDetails.description,
				thumbnail: channelDetails.thumbnail,
				subscriberCount: channelDetails.subscriberCount,
			},
			videos,
		};
	} catch (error) {
		console.error("[YouTube API] ❌ Error:", error);

		const errorMessage = error instanceof Error ? error.message : String(error);

		return {
			success: false,
			error: errorMessage,
		};
	}
}
