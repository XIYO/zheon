import { getChannelInfo } from '../functions/_shared/youtube-channel.ts';

Deno.test('YouTube Channel - Get channel info with YouTube.js', async () => {
	console.log('\n📺 Testing YouTube Channel API with YouTube.js + SOCKS5...\n');

	// Test with channel ID
	const result = await getChannelInfo('UC8butISFwT-Wl7EV0hUK0BQ', 5);

	console.log('\nResult:', JSON.stringify(result, null, 2));

	if (!result.success) {
		console.error('❌ Failed:', result.error);
		throw new Error(result.error);
	}

	console.log('\n✅ Success!');
	console.log(`Channel: ${result.channel?.name}`);
	console.log(`Subscribers: ${result.channel?.subscriberCount}`);
	console.log(`Videos: ${result.videos?.length}`);
});
