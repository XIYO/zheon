import { query, command, getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import * as v from 'valibot';

/**
 * Query: 채널 정보 조회 (자동 배칭)
 * - 같은 macrotask 내 여러 호출을 자동으로 하나의 쿼리로 배칭
 * - n+1 문제 자동 해결
 */
export const getChannel = query.batch(v.string(), async (channelIds) => {
	const { locals } = getRequestEvent();
	const { supabase } = locals;

	const { data, error: dbError } = await supabase
		.from('channels')
		.select('*')
		.in('channel_id', channelIds);

	if (dbError) throw error(500, dbError.message);

	const lookup = new Map(data.map((ch) => [ch.channel_id, ch]));
	return (channelId) => lookup.get(channelId) ?? null;
});

/**
 * Command: 채널 정보 업서트
 * - 백그라운드에서 비동기 처리
 * - 응답 즉시 반환, 실패해도 프론트에 전달 안됨
 */
export const upsertChannel = command(
	v.object({
		channel_id: v.string(),
		title: v.optional(v.string()),
		custom_url: v.optional(v.string()),
		thumbnail_url: v.optional(v.string()),
		subscriber_count: v.optional(v.string()),
		description: v.optional(v.string()),
		video_count: v.optional(v.number()),
		channel_data: v.optional(v.any())
	}),
	async (channelData) => {
		const { locals } = getRequestEvent();
		const { adminSupabase } = locals;

		const task = async () => {
			const { error: upsertError } = await adminSupabase.from('channels').upsert(
				{
					...channelData,
					updated_at: new Date().toISOString()
				},
				{ onConflict: 'channel_id' }
			);

			if (upsertError) console.error('Channel upsert failed:', upsertError);
		};

		try {
			const { waitUntil } = await import('cloudflare:workers');
			waitUntil(task());
		} catch {
			task();
		}
	}
);

/**
 * Command: 채널 동기화 상태 업데이트
 * - 백그라운드에서 비동기 처리
 */
export const updateChannelStatus = command(
	v.object({
		channel_id: v.string(),
		video_sync_status: v.picklist(['pending', 'processing', 'completed', 'failed']),
		video_synced_at: v.optional(v.string())
	}),
	async ({ channel_id, video_sync_status, video_synced_at }) => {
		const { locals } = getRequestEvent();
		const { adminSupabase } = locals;

		const task = async () => {
			const updateData = { video_sync_status };
			if (video_synced_at) updateData.video_synced_at = video_synced_at;

			const { error: updateError } = await adminSupabase
				.from('channels')
				.update(updateData)
				.eq('channel_id', channel_id);

			if (updateError) console.error('Status update failed:', updateError);
		};

		try {
			const { waitUntil } = await import('cloudflare:workers');
			waitUntil(task());
		} catch {
			task();
		}
	}
);
