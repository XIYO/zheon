import { env } from '$env/dynamic/private';
import { Innertube } from 'youtubei.js/cf-worker';

/**
 * YouTube 프록시 fetch 함수
 * TOR 프록시를 통해 YouTube API 요청
 */
function createProxyFetch(proxyUrl) {
	return async (input, init) => {
		let targetUrl;
		let proxyInit;

		if (input instanceof Request) {
			targetUrl = input.url;
			proxyInit = {
				method: input.method,
				headers: input.headers,
				body: input.body,
				redirect: input.redirect,
				signal: input.signal,
				...init
			};
		} else {
			targetUrl = typeof input === 'string' ? input : (input.href || String(input));
			proxyInit = init ? { ...init } : {};
		}

		const newHeaders = new Headers(proxyInit.headers);
		newHeaders.append('target-url', targetUrl);
		proxyInit.headers = newHeaders;

		return fetch(proxyUrl, proxyInit);
	};
}

/**
 * 프록시를 사용하는 Innertube 인스턴스 생성
 */
async function createYouTubeClient() {
	const proxyUrl = env.HEADER_PROXY_URL;
	if (!proxyUrl) {
		throw new Error('HEADER_PROXY_URL not configured');
	}

	return await Innertube.create({
		fetch: createProxyFetch(proxyUrl)
	});
}

let ytPromise;

/**
 * YouTube 클라이언트 싱글톤
 * Race condition 방지를 위해 Promise를 캐시
 */
export async function getYouTubeClient() {
	if (!ytPromise) {
		ytPromise = createYouTubeClient();
	}
	return await ytPromise;
}
