/**
 * 유튜브 자막을 Python 서버에서 추출
 * @param {string} youtubeUrl - 자막을 추출할 유튜브 URL
 * @returns {Promise<string|null>} - 추출된 자막 텍스트 또는 null
 */
export async function extractSubtitle(youtubeUrl) {
	if (!youtubeUrl) return null;
	const endpoint = `https://extract-subtitle.xiyo.dev/extract?url=${encodeURIComponent(youtubeUrl)}&only_text=true`;
	try {
		const res = await fetch(endpoint);
		if (!res.ok) return null;
		return await res.text();
	} catch (e) {
		console.error(e);
		return null;
	}
}

