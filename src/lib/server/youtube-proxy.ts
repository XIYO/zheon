import { env } from '$env/dynamic/private';
import { Innertube } from 'youtubei.js/cf-worker';
import { SocksProxyAgent } from 'socks-proxy-agent';

type FetchInput = Request | string | URL;
type FetchInit = RequestInit;

function createSocks5Fetch(socksProxy: string) {
	const proxyAgent = new SocksProxyAgent(socksProxy);

	return async (input: FetchInput, init?: FetchInit): Promise<Response> => {
		return fetch(input, {
			...init,
			// @ts-ignore Node.js fetch agent support
			agent: proxyAgent
		});
	};
}

let ytClient: Innertube | null = null;

export async function getYouTubeClient(): Promise<Innertube> {
	if (!ytClient) {
		const socksProxy = env.TOR_SOCKS5_PROXY;

		if (!socksProxy) {
			throw new Error('TOR_SOCKS5_PROXY not configured');
		}

		ytClient = await Innertube.create({
			fetch: createSocks5Fetch(socksProxy)
		});

		console.log(`[YouTube] SOCKS5 프록시 사용: ${socksProxy}`);
	}
	return ytClient;
}
