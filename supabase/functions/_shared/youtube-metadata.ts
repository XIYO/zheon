/**
 * YouTube 메타데이터 추출 유틸리티
 * oEmbed API를 사용하여 title, channel_name, thumbnail_url 추출
 */

export interface YouTubeMetadata {
	success: boolean;
	title?: string;
	channel_name?: string;
	thumbnail_url?: string;
	error?: string;
}

/**
 * YouTube URL에서 비디오 ID 추출
 */
function extractVideoId(url: string): string | null {
	const patterns = [
		/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
		/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
		/youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
	];

	for (const pattern of patterns) {
		const match = url.match(pattern);
		if (match && match[1]) {
			return match[1];
		}
	}

	return null;
}

/**
 * YouTube oEmbed API를 사용하여 메타데이터 가져오기
 * @param youtubeUrl - YouTube 비디오 URL
 * @returns Promise<YouTubeMetadata>
 */
export async function fetchYouTubeMetadata(
	youtubeUrl: string
): Promise<YouTubeMetadata> {
	try {
		console.log(`[YouTube Metadata] Fetching for: ${youtubeUrl}`);

		// 비디오 ID 추출
		const videoId = extractVideoId(youtubeUrl);
		if (!videoId) {
			return {
				success: false,
				error: 'Invalid YouTube URL'
			};
		}

		// oEmbed API 호출
		const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;

		const response = await fetch(oembedUrl);

		if (!response.ok) {
			console.error(
				`[YouTube Metadata] oEmbed API error: ${response.status}`
			);
			return {
				success: false,
				error: `oEmbed API error: ${response.status}`
			};
		}

		const data = await response.json();

		// maxresdefault 품질로 변경 (hqdefault → maxresdefault)
		const thumbnailUrl = data.thumbnail_url
			? data.thumbnail_url.replace('hqdefault', 'maxresdefault')
			: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

		console.log(`[YouTube Metadata] ✅ Success:`, {
			title: data.title,
			author: data.author_name,
			thumbnail: thumbnailUrl
		});

		return {
			success: true,
			title: data.title,
			channel_name: data.author_name,
			thumbnail_url: thumbnailUrl
		};
	} catch (error) {
		console.error('[YouTube Metadata] ❌ Error:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}
