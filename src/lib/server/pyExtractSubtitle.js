import { EXTRACT_API_URL } from '$env/static/private';

/**
 * 지수 백오프로 대기하는 함수
 * @param {number} attempt - 시도 횟수 (0부터 시작)
 * @returns {Promise<void>}
 */
function delay(attempt) {
	const baseDelay = 1000; // 1초
	const maxDelay = 30000; // 최대 30초
	const delayTime = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
	return new Promise((resolve) => setTimeout(resolve, delayTime));
}

/**
 * 유튜브 자막을 Python 서버에서 추출 (영어 자막 기본)
 * @param {string} youtubeUrl - 자막을 추출할 유튜브 URL
 * @param {number} [maxRetries=3] - 최대 재시도 횟수
 * @returns {Promise<{success: boolean, data: string|null, error?: {type: string, message: string}}>} - 추출 결과
 */
export async function extractSubtitle(youtubeUrl, maxRetries = 3) {
	if (!youtubeUrl) {
		return {
			success: false,
			data: null,
			error: { type: 'INVALID_URL', message: 'YouTube URL이 제공되지 않았습니다.' }
		};
	}

	const url = new URL(EXTRACT_API_URL);
	url.searchParams.set('url', youtubeUrl);
	// 언어 파라미터 제거 - 기본적으로 영어 자막 추출

	const endpoint = url.toString();

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		const startTime = Date.now();
		try {
			console.log(`🚀 [${attempt + 1}/${maxRetries + 1}] Subtitle extraction request:`, {
				url: youtubeUrl,
				lang: 'en (default)',
				endpoint,
				timestamp: new Date().toISOString()
			});

			const res = await fetch(endpoint, {
				headers: {
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
					Accept: 'application/json'
				},
				timeout: 30000 // 30초 타임아웃
			});

			const responseTime = Date.now() - startTime;
			console.log(`📡 [${attempt + 1}/${maxRetries + 1}] Response received:`, {
				status: res.status,
				statusText: res.statusText,
				responseTime: `${responseTime}ms`,
				headers: Object.fromEntries(res.headers.entries()),
				timestamp: new Date().toISOString()
			});

			if (res.ok) {
				const parseStartTime = Date.now();
				const data = await res.json();
				const parseTime = Date.now() - parseStartTime;
				const totalTime = Date.now() - startTime;

				console.log(`✅ [${attempt + 1}/${maxRetries + 1}] Subtitle extraction successful:`, {
					subtitleLength: data.transcript?.length || 0,
					parseTime: `${parseTime}ms`,
					totalTime: `${totalTime}ms`,
					hasTranscript: !!data.transcript,
					timestamp: new Date().toISOString()
				});

				return {
					success: true,
					data: data.transcript || null
				};
			}

			// Rate Limit 에러 처리
			if (res.status === 429) {
				const errorData = await res.json().catch(() => null);

				console.warn(`⚠️ [${attempt + 1}/${maxRetries + 1}] Rate limit hit:`, {
					status: res.status,
					statusText: res.statusText,
					errorData,
					responseTime: `${responseTime}ms`,
					timestamp: new Date().toISOString()
				});

				if (attempt < maxRetries) {
					const delayTime = Math.pow(2, attempt + 1);
					console.log(
						`🔄 Retrying in ${delayTime} seconds... (attempt ${attempt + 2}/${maxRetries + 1})`
					);
					await delay(attempt + 1);
					continue;
				} else {
					console.error(`❌ Rate limit exceeded after all retries (${maxRetries + 1} attempts)`);
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
			console.error(`❌ [${attempt + 1}/${maxRetries + 1}] Subtitle extraction failed:`, {
				status: res.status,
				statusText: res.statusText,
				errorData,
				responseTime: `${responseTime}ms`,
				timestamp: new Date().toISOString()
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
			const errorTime = Date.now() - startTime;
			console.error(`🔥 [${attempt + 1}/${maxRetries + 1}] Network/Parse error:`, {
				error: e.message,
				errorName: e.name,
				errorCode: e.code,
				errorTime: `${errorTime}ms`,
				stack: e.stack?.split('\n').slice(0, 3).join('\n'),
				timestamp: new Date().toISOString()
			});

			if (attempt < maxRetries && (e.name === 'TypeError' || e.code === 'ECONNRESET')) {
				console.log(`🔄 Network error, retrying... (attempt ${attempt + 2}/${maxRetries + 1})`);
				await delay(attempt);
				continue;
			}

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
