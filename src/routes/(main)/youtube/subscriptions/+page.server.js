import { error } from '@sveltejs/kit';

export async function load({ locals: { supabase, safeGetSession } }) {
	const { session } = await safeGetSession();

	if (!session) {
		return {
			subscriptions: [],
			cached: false
		};
	}

	try {
		const userId = session.user.id;

		// 캐시 확인
		const { data: cachedData } = await supabase
			.from('youtube_subscriptions')
			.select('subscriptions_data, expires_at')
			.eq('user_id', userId)
			.single();

		// 캐시가 유효한지 확인
		const now = new Date();
		const isValid = cachedData && new Date(cachedData.expires_at) > now;

		if (isValid) {
			console.log('✅ Cache hit: subscriptions');
			return {
				subscriptions: cachedData.subscriptions_data || [],
				cached: true
			};
		}

		console.log('❌ Cache miss: subscriptions');

		// Supabase session에서 provider token 가져오기
		const providerToken = session.provider_token;

		if (!providerToken) {
			console.warn('No Google OAuth token found for user');
			return {
				subscriptions: [],
				cached: false
			};
		}

		// YouTube API 호출
		const response = await fetch(
			'https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=50',
			{
				headers: {
					Authorization: `Bearer ${providerToken}`
				}
			}
		);

		if (!response.ok) {
			console.error('YouTube API error:', response.status, await response.text());
			return {
				subscriptions: [],
				cached: false
			};
		}

		const data = await response.json();
		const subscriptions = data.items || [];

		// 캐시 저장 (1시간 TTL)
		const expiresAt = new Date();
		expiresAt.setHours(expiresAt.getHours() + 1);

		await supabase
			.from('youtube_subscriptions')
			.upsert({
				user_id: userId,
				subscriptions_data: subscriptions,
				cached_at: now.toISOString(),
				expires_at: expiresAt.toISOString(),
				updated_at: now.toISOString()
			});

		console.log('💾 Cached subscriptions for user:', userId);

		return {
			subscriptions,
			cached: false
		};
	} catch (err) {
		console.error('Error fetching YouTube subscriptions:', err);
		return {
			subscriptions: [],
			cached: false
		};
	}
}
