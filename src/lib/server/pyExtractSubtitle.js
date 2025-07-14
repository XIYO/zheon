/**
 * 유튜브 자막을 Python 서버에서 추출
 * @param {string} youtubeUrl - 자막을 추출할 유튜브 URL
 * @param {string} [lang] - 언어 코드 (옵션)
 * @returns {Promise<string|null>} - 추출된 자막 텍스트 또는 null
 */
export async function extractSubtitle(youtubeUrl, lang) {
	if (!youtubeUrl) return null;
	
	let endpoint = `https://extractor.xiyo.dev/extract-text?url=${encodeURIComponent(youtubeUrl)}`;
	if (lang) {
		endpoint += `&lang=${encodeURIComponent(lang)}`;
	}
	
	try {
		const res = await fetch(endpoint);
		
		if (!res.ok) {
			const errorData = await res.json().catch(() => null);
			console.error('Subtitle extraction failed:', {
				status: res.status,
				statusText: res.statusText,
				error: errorData
			});
			return null;
		}
		
		const data = await res.json();
		return data.transcript || null;
	} catch (e) {
		console.error('Failed to extract subtitle:', e);
		return null;
	}
}
