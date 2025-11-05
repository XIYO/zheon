import { env } from '$env/dynamic/private';
import { Innertube } from 'youtubei.js/cf-worker';

type FetchInput = Request | string | URL;
type FetchInit = RequestInit;

function createProxyFetch(proxyUrl: string) {
	return async (input: FetchInput, init?: FetchInit): Promise<Response> => {
		let targetUrl: string;
		let proxyInit: FetchInit;

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
			targetUrl = typeof input === 'string' ? input : input.href || String(input);
			proxyInit = init ? { ...init } : {};
		}

		const newHeaders = new Headers(proxyInit.headers);
		newHeaders.append('target-url', targetUrl);
		proxyInit.headers = newHeaders;

		return fetch(proxyUrl, proxyInit);
	};
}

async function createYouTubeClient() {
	const proxyUrl = env.HTTP_PROXY_URL;
	if (!proxyUrl) {
		throw new Error('HTTP_PROXY_URL not configured');
	}

	return await Innertube.create({
		fetch: createProxyFetch(proxyUrl)
	});
}

let ytPromise: Promise<any>;

export async function getYouTubeClient() {
	if (!ytPromise) {
		ytPromise = createYouTubeClient();
	}
	return await ytPromise;
}
