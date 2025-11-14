import { Innertube, UniversalCache } from 'youtubei.js';
import { SocksProxyAgent } from 'socks-proxy-agent';

export interface YouTubeProxyOptions {
	socksProxy?: string;
}

export async function createYouTubeClient({
	socksProxy
}: YouTubeProxyOptions = {}): Promise<Innertube> {
	const proxyAgent = socksProxy ? new SocksProxyAgent(socksProxy) : undefined;
	const cache = new UniversalCache(false);

	console.time('[youtube] Innertube.create');

	const innertube = await Innertube.create({
		lang: 'ko',
		location: 'KR',
		retrieve_player: false,
		cache,
		fetch: proxyAgent
			? async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
					return fetch(input, {
						...init,
						// @ts-expect-error Node.js fetch agent support
						agent: proxyAgent
					});
				}
			: undefined
	});

	console.timeEnd('[youtube] Innertube.create');

	return innertube;
}
