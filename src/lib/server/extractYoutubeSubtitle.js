import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec);

/**
 * 유튜브 URL 유효성 검사 함수
 * @param {string} url - 검사할 유튜브 URL
 * @returns {boolean} - 유효한 유튜브 URL이면 true, 아니면 false
 */
function isValidYouTubeUrl(url) {
	try {
		const parsedUrl = new URL(url);
		return (
			['www.youtube.com', 'youtube.com', 'youtu.be'].includes(parsedUrl.hostname) &&
			(parsedUrl.searchParams.has('v') || parsedUrl.pathname.length > 1)
		);
	} catch {
		return false;
	}
}

export async function extractSubtitle(youtubeUrl) {
	if (!isValidYouTubeUrl(youtubeUrl)) {
		console.warn('유효하지 않은 유튜브 URL입니다.');
		return null;
	}

	try {
		const { stdout } = await execAsync(
			`yt-dlp --skip-download --write-auto-sub --sub-lang en --sub-format ttml "${youtubeUrl}" -o "%(id)s.%(ext)s"`
		)

		const fs = await import('node:fs/promises')
		const videoId = new URL(youtubeUrl).searchParams.get('v');
		const path = `./${videoId}.en.ttml`;

		const xml = await fs.readFile(path, 'utf-8')

		const text = xml
			.replace(/<\/?[^>]+(>|$)/g, '') // 태그 제거
			.replace(/&amp;/g, '&')
			.replace(/&quot;/g, '"')
			.replace(/&#39;/g, "'")
			.replace(/\s+/g, ' ')
			.trim()

		await fs.unlink(path)

		return text
	} catch (err) {
		return null;
	}
}