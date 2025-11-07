import { Innertube } from 'youtubei.js';
import { SocksProxyAgent } from 'socks-proxy-agent';

export async function createYouTube(socksProxy?: string): Promise<Innertube> {
	if (!socksProxy) {
		throw new Error('TOR_SOCKS5_PROXY not configured');
	}

	const proxyAgent = new SocksProxyAgent(socksProxy);

	return await Innertube.create({
		lang: 'ko',
		location: 'KR',
		retrieve_player: true,
		fetch: async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
			return fetch(input, {
				...init,
				// @ts-ignore Node.js fetch agent support
				agent: proxyAgent
			});
		}
	});
}
