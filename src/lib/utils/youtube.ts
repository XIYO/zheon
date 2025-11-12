export function extractVideoId(url: string): string {
	const patterns = [
		/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
		/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
		/youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
	];

	for (const pattern of patterns) {
		const match = url.match(pattern);
		if (match) return match[1];
	}
}

export function getYouTubeThumbnail(
	videoId: string | null,
	quality: string = 'maxresdefault'
): string | null {
	if (!videoId) return null;
	return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

const THUMBNAIL_QUALITIES = [
	'maxresdefault',
	'sddefault',
	'hqdefault',
	'mqdefault',
	'default'
] as const;

export function getYouTubeThumbnailFallbacks(videoId: string | null): string[] {
	if (!videoId) return [];
	return THUMBNAIL_QUALITIES.map(
		(quality) => `https://img.youtube.com/vi/${videoId}/${quality}.jpg`
	);
}
