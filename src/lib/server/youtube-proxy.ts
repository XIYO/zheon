import { Innertube } from 'youtubei.js';
import { SocksProxyAgent } from 'socks-proxy-agent';

let youtubeInstance: Innertube | null = null;

export async function getYouTube(socksProxy?: string): Promise<Innertube> {
	if (youtubeInstance) {
		return youtubeInstance;
	}

	if (!socksProxy) {
		throw new Error('TOR_SOCKS5_PROXY not configured');
	}

	console.time('[youtube-proxy] Innertube.create');
	const proxyAgent = new SocksProxyAgent(socksProxy);

	youtubeInstance = await Innertube.create({
		lang: 'ko',
		location: 'KR',
		retrieve_player: true,
		fetch: async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
			return fetch(input, {
				...init,
				// @ts-expect-error Node.js fetch agent support
				agent: proxyAgent
			});
		}
	});

	console.timeEnd('[youtube-proxy] Innertube.create');
	return youtubeInstance;
}
