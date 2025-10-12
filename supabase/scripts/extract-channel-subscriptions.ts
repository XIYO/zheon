/**
 * Extract channel subscriptions (featured channels) from a YouTube channel
 * Usage: deno run --allow-net --allow-env supabase/scripts/extract-channel-subscriptions.ts
 */

import { Innertube } from 'npm:youtubei.js@latest';

/**
 * UUID v4 생성 (Deno 네이티브)
 */
function generateUUID(): string {
	return crypto.randomUUID();
}

/**
 * SOCKS5 프록시를 통한 커스텀 fetch 함수
 */
function createProxyFetch() {
	return async (input: RequestInfo | URL, init?: RequestInit) => {
		const username = generateUUID();
		const password = generateUUID();
		const proxyUrl = `socks5://${username}:${password}@xiyo.dev:19050`;

		console.log(`[Proxy] Using SOCKS5: ${proxyUrl.replace(/:[^:@]+@/, ':****@')}`);

		const client = Deno.createHttpClient({
			proxy: { url: proxyUrl }
		});

		try {
			const response = await fetch(input, {
				...init,
				client
			});
			return response;
		} finally {
			client.close();
		}
	};
}

/**
 * 채널의 구독 목록(Featured Channels) 가져오기
 */
async function extractChannelSubscriptions(channelHandle: string) {
	try {
		console.log(`\n🔍 Fetching channel: ${channelHandle}\n`);

		// SOCKS5 프록시를 통한 Innertube 클라이언트 생성
		const proxyFetch = createProxyFetch();
		const yt = await Innertube.create({
			fetch: proxyFetch as any
		});

		console.log(`📺 Getting channel info...`);
		const channel = await yt.getChannel(channelHandle);

		if (!channel) {
			console.error('❌ Channel not found');
			return;
		}

		console.log(`✅ Channel: ${channel.metadata.title}`);
		console.log(`   ID: ${channel.metadata.external_id}`);
		console.log(`   Description: ${channel.metadata.description?.substring(0, 100)}...`);

		// 채널 객체의 사용 가능한 메서드 확인
		console.log(`\n📋 Available methods on channel object:`);
		const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(channel))
			.filter(name => typeof (channel as any)[name] === 'function');
		console.log(methods.join(', '));

		// getChannels() 메서드 시도
		console.log(`\n🔍 Trying to get channels...`);
		try {
			if (typeof (channel as any).getChannels === 'function') {
				const channelsResult = await (channel as any).getChannels();
				console.log(`\n✅ getChannels() succeeded!`);
				console.log(`Type: ${channelsResult.constructor.name}`);

				// 구조 확인
				if (channelsResult.channels) {
					console.log(`\n📺 Found ${channelsResult.channels.length} channels:`);
					channelsResult.channels.slice(0, 20).forEach((ch: any, idx: number) => {
						console.log(`${idx + 1}. ${ch.author?.name || 'Unknown'}`);
						console.log(`   ID: ${ch.author?.id || 'N/A'}`);
						console.log(`   Handle: ${ch.author?.url || 'N/A'}`);
					});
				} else {
					console.log(`\n🔍 Full response structure:`);
					console.log(JSON.stringify(channelsResult, null, 2).substring(0, 2000));
				}
			} else {
				console.log(`❌ getChannels() method not found`);
			}
		} catch (err) {
			console.log(`❌ getChannels() failed: ${err}`);
		}

	} catch (error) {
		console.error('❌ Error:', error);
	}
}

// Run
const channelHandle = Deno.args[0] || '@bunnyxiyo';
await extractChannelSubscriptions(channelHandle);
