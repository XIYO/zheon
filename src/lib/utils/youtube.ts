import { v5 as uuidv5 } from 'uuid';

const YOUTUBE_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

export function extractVideoId(url: string | null): string | null {
	if (!url) return null;

	const patterns = [
		/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
		/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
		/youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
	];

	for (const pattern of patterns) {
		const match = url.match(pattern);
		if (match) return match[1];
	}

	return null;
}

export function getYouTubeThumbnail(
	videoId: string | null,
	quality: string = 'maxresdefault'
): string | null {
	if (!videoId) return null;
	return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

export function normalizeYouTubeUrl(videoId: string | null): string {
	if (!videoId) return '';
	return `https://www.youtube.com/watch?v=${videoId}`;
}

export function generateYouTubeUuid(url: string): string {
	const videoId = extractVideoId(url);
	const normalizedUrl = normalizeYouTubeUrl(videoId);
	return uuidv5(normalizedUrl, YOUTUBE_NAMESPACE);
}
