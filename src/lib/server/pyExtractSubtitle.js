import { EXTRACT_API_URL } from '$env/static/private';

// 글로벌 요청 제한을 위한 간단한 레이트 리미터
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1초

/**
 * 지수 백오프로 대기하는 함수
 * @param {number} attempt - 시도 횟수 (0부터 시작)
 * @returns {Promise<void>}
 */
function delay(attempt) {
	const baseDelay = 1000; // 1초
	const maxDelay = 30000; // 최대 30초
	const delayTime = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
	return new Promise(resolve => setTimeout(resolve, delayTime));
}

/**
 * 유튜브 자막을 Python 서버에서 추출 (재시도 로직 포함)
 * @param {string} youtubeUrl - 자막을 추출할 유튜브 URL
 * @param {string} [lang] - 언어 코드 (옵션)
 * @param {number} [maxRetries=3] - 최대 재시도 횟수
 * @returns {Promise<{success: boolean, data: string|null, error?: {type: string, message: string}}>} - 추출 결과
 */
export async function extractSubtitle(youtubeUrl, lang, maxRetries = 3) {
	if (!youtubeUrl) {
		return {
			success: false,
			data: null,
			error: { type: 'INVALID_URL', message: 'YouTube URL이 제공되지 않았습니다.' }
		};
	}

	const url = new URL(EXTRACT_API_URL);
	url.searchParams.set('url', youtubeUrl);

	if (lang) {
		url.searchParams.set('lang', lang);
	}

	const endpoint = url.toString();

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			const res = await fetch(endpoint, {
				headers: {
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
					'Accept': 'application/json',
				},
				timeout: 30000 // 30초 타임아웃
			});

			if (res.ok) {
				const data = await res.json();
				return {
					success: true,
					data: data.transcript || null
				};
			}

			// Rate Limit 에러 처리
			if (res.status === 429) {
				const errorData = await res.json().catch(() => null);
				
				if (attempt < maxRetries) {
					console.warn(`Rate limit hit, retrying in ${Math.pow(2, attempt + 1)} seconds... (attempt ${attempt + 1}/${maxRetries})`);
					await delay(attempt + 1);
					continue;
				} else {
					console.error('Rate limit exceeded after all retries:', {
						status: res.status,
						statusText: res.statusText,
						error: errorData
					});
					return {
						success: false,
						data: null,
						error: {
							type: 'RATE_LIMIT',
							message: 'YouTube에서 일시적으로 요청을 제한하고 있습니다. 잠시 후 다시 시도해주세요.'
						}
					};
				}
			}

			// 기타 HTTP 에러
			const errorData = await res.json().catch(() => null);
			console.error('Subtitle extraction failed:', {
				status: res.status,
				statusText: res.statusText,
				error: errorData
			});

			return {
				success: false,
				data: null,
				error: {
					type: 'API_ERROR',
					message: `서버 오류가 발생했습니다. (${res.status})`
				}
			};

		} catch (e) {
			if (attempt < maxRetries && (e.name === 'TypeError' || e.code === 'ECONNRESET')) {
				console.warn(`Network error, retrying... (attempt ${attempt + 1}/${maxRetries}):`, e.message);
				await delay(attempt);
				continue;
			}

			console.error('Failed to extract subtitle:', e);
			return {
				success: false,
				data: null,
				error: {
					type: 'NETWORK_ERROR',
					message: '네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.'
				}
			};
		}
	}

	return {
		success: false,
		data: null,
		error: {
			type: 'MAX_RETRIES_EXCEEDED',
			message: '최대 재시도 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.'
		}
	};
}
