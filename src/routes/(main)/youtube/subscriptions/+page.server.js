import { error } from '@sveltejs/kit';

export async function load({ locals: { supabase, safeGetSession } }) {
	const { session } = await safeGetSession();

	if (!session) {
		return {
			subscriptions: [],
			channels: [],
			lastSync: null,
			totalChannels: 0
		};
	}

	try {
		const userId = session.user.id;

		// 구독 채널 목록 조회 (정규화된 테이블에서)
		const { data: subscriptions, error: subError } = await supabase
			.from('youtube_subscriptions')
			.select(`
				id,
				subscribed_at,
				channel:channels (
					channel_id,
					channel_name,
					channel_handle,
					channel_avatar,
					subscriber_count,
					video_count,
					description,
					updated_at
				)
			`)
			.eq('user_id', userId)
			.order('subscribed_at', { ascending: false });

		if (subError) {
			console.error('Error fetching subscriptions:', subError);
			return {
				subscriptions: [],
				channels: [],
				lastSync: null,
				totalChannels: 0
			};
		}

		// 마지막 동기화 시간 조회
		const { data: lastSyncLog } = await supabase
			.from('sync_logs')
			.select('created_at, channels_synced, api_units_used')
			.eq('user_id', userId)
			.eq('sync_type', 'subscriptions')
			.eq('success', true)
			.order('created_at', { ascending: false })
			.limit(1)
			.single();

		// 채널 데이터 추출 (null 체크)
		const channels = subscriptions
			?.filter(sub => sub.channel !== null)
			.map(sub => ({
				...sub.channel,
				subscribed_at: sub.subscribed_at
			})) || [];

		return {
			subscriptions: subscriptions || [],
			channels,
			lastSync: lastSyncLog?.created_at || null,
			totalChannels: channels.length,
			apiUnitsUsed: lastSyncLog?.api_units_used || 0
		};
	} catch (err) {
		console.error('Error loading subscriptions page:', err);
		return {
			subscriptions: [],
			channels: [],
			lastSync: null,
			totalChannels: 0
		};
	}
}

// 클라이언트 사이드로 이동 - +page.svelte에서 직접 처리