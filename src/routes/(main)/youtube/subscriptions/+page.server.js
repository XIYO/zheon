import { error } from '@sveltejs/kit';

export async function load({ locals: { supabase, safeGetSession } }) {
	const { session } = await safeGetSession();

	if (!session) {
		return {
			subscriptions: []
		};
	}

	try {
		// Supabase session에서 provider token 가져오기
		const providerToken = session.provider_token;

		if (!providerToken) {
			console.warn('No Google OAuth token found for user');
			return {
				subscriptions: []
			};
		}

		let accessToken = providerToken;

		// YouTube API 호출
		const response = await fetch(
			'https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=50',
			{
				headers: {
					Authorization: `Bearer ${accessToken}`
				}
			}
		);

		if (!response.ok) {
			console.error('YouTube API error:', response.status, await response.text());
			return {
				subscriptions: []
			};
		}

		const data = await response.json();

		return {
			subscriptions: data.items || []
		};
	} catch (err) {
		console.error('Error fetching YouTube subscriptions:', err);
		return {
			subscriptions: []
		};
	}
}
