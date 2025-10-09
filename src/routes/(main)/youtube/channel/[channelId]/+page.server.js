export async function load({ params, locals: { supabase, safeGetSession } }) {
	const { channelId } = params;
	const { session } = await safeGetSession();

	if (!session) {
		return {
			channel: null,
			videos: []
		};
	}

	try {
		const providerToken = session.provider_token;

		if (!providerToken) {
			console.warn('No Google OAuth token found for user');
			return {
				channel: null,
				videos: []
			};
		}

		// 채널 정보 가져오기
		const channelResponse = await fetch(
			`https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&id=${channelId}`,
			{
				headers: {
					Authorization: `Bearer ${providerToken}`
				}
			}
		);

		if (!channelResponse.ok) {
			console.error('YouTube Channel API error:', channelResponse.status, await channelResponse.text());
			return {
				channel: null,
				videos: []
			};
		}

		const channelData = await channelResponse.json();
		const channel = channelData.items?.[0];

		// 채널의 최신 영상 가져오기
		const videosResponse = await fetch(
			`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&type=video&maxResults=30`,
			{
				headers: {
					Authorization: `Bearer ${providerToken}`
				}
			}
		);

		if (!videosResponse.ok) {
			console.error('YouTube Search API error:', videosResponse.status, await videosResponse.text());
			return {
				channel: channel?.snippet || null,
				videos: []
			};
		}

		const videosData = await videosResponse.json();

		return {
			channel: channel?.snippet || null,
			videos: videosData.items || []
		};
	} catch (err) {
		console.error('Error fetching YouTube channel data:', err);
		return {
			channel: null,
			videos: []
		};
	}
}
