import { query, form, command, getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import * as v from 'valibot';
import { syncChannelVideosCommand } from './channel_video.remote.ts';
import { getAllSubscriptions, getChannels } from '$lib/server/youtubeApi.js';

/**
 * 배열을 지정한 크기만큼 잘라서 반환
 */
const chunk = <T,>(items: T[], size: number): T[][] => {
	const result: T[][] = [];
	for (let i = 0; i < items.length; i += size) {
		result.push(items.slice(i, i + size));
	}
	return result;
};

/**
 * Query: 구독 채널 목록 조회
 */
export const getSubscriptions = query(
	v.optional(
		v.object({
			cursor: v.optional(v.string()),
			limit: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(100)), 20),
			sortBy: v.optional(v.picklist(['newest', 'oldest']), 'newest')
		})
	),
	async (
		params?: {
			cursor?: string;
			limit?: number;
			sortBy?: 'newest' | 'oldest';
		}
	) => {
		const { cursor, limit = 20, sortBy = 'newest' } = params || {};
		const { locals } = getRequestEvent();
		const { supabase, safeGetSession } = locals;
		const { session, user } = await safeGetSession();

		if (!session || !user) throw error(401, 'Unauthorized');

		const userId = user.id;
		const ascending = sortBy === 'oldest';

		let query = supabase
			.from('youtube_subscriptions')
			.select(
				`
				id,
				subscribed_at,
				channel:channels (
					channel_id,
					title,
					custom_url,
					thumbnail_url,
					subscriber_count,
					video_count,
					description,
					updated_at
				)
			`
			)
			.eq('user_id', userId)
			.order('subscribed_at', { ascending })
			.limit(limit + 1);

		if (cursor) {
			if (ascending) query = query.gt('subscribed_at', cursor);
			else query = query.lt('subscribed_at', cursor);
		}

		const { data, error: subError } = await query;

		if (subError) throw error(500, subError.message);

		const hasMore = data.length > limit;
		const subscriptions = hasMore ? data.slice(0, limit) : data;
		const nextCursor = hasMore ? subscriptions[subscriptions.length - 1].subscribed_at : null;

		return { subscriptions, nextCursor, hasMore };
	}
);

/**
 * 구독 동기화 공통 로직
 */
async function performSubscriptionsSync() {
	const { locals } = getRequestEvent();
	const { supabase, safeGetSession } = locals;
	const { session, user } = await safeGetSession();

	if (!session || !user) throw error(401, '로그인이 필요합니다');

	const userId = user.id;

	const { data: profile, error: profileError } = await supabase
		.from('profiles')
		.select('youtube_subscription_sync_status')
		.eq('id', userId)
		.single();

	if (profileError) throw error(500, profileError.message);

	if (profile?.youtube_subscription_sync_status === 'processing') {
		return {
			success: true,
			message: '동기화가 이미 진행 중입니다',
			channelsSynced: 0,
			subscriptionsSynced: 0,
			alreadyInProgress: true
		};
	}

	const { error: updateStartError } = await supabase
		.from('profiles')
		.update({ youtube_subscription_sync_status: 'processing' })
		.eq('id', userId);

	if (updateStartError) throw error(500, updateStartError.message);

	try {
		let accessToken = session.provider_token;

		console.log('[동기화] 시작 - 사용자:', userId);
		console.log('[동기화] provider_token 존재:', !!accessToken);
		console.log('[동기화] provider_refresh_token 존재:', !!session.provider_refresh_token);

		if (!accessToken) {
			console.log('[동기화] provider_token 없음, 세션 refresh 시도...');
			const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

			if (refreshError) {
				console.error('[동기화] refresh 실패:', refreshError);
				throw error(401, 'Google 인증 토큰이 없습니다. 다시 로그인해주세요.');
			}

			console.log('[동기화] refresh 응답:', {
				hasSession: !!refreshData.session,
				hasProviderToken: !!refreshData.session?.provider_token,
				hasProviderRefreshToken: !!refreshData.session?.provider_refresh_token
			});

			if (!refreshData.session?.provider_token) {
				console.error('[동기화] refresh 후에도 provider_token 없음 - 재로그인 필요');
				throw error(401, 'Google 인증 토큰이 없습니다. 로그아웃 후 다시 로그인해주세요.');
			}

			accessToken = refreshData.session.provider_token;
			console.log('[동기화] 세션 refresh 완료, provider_token 획득');
		}

		console.log('[동기화] OAuth 토큰 확인 완료, 구독 목록 가져오는 중...');
		const subscriptions = await getAllSubscriptions(accessToken);
		console.log(`[동기화] 구독 목록 가져오기 완료: ${subscriptions.length}개`);

		if (subscriptions.length === 0) {
			console.log('[동기화] 구독 채널 없음, 기존 데이터 삭제 중...');
			await supabase.from('youtube_subscriptions').delete().eq('user_id', userId);

			await supabase
				.from('profiles')
				.update({
					youtube_subscription_sync_status: 'completed',
					youtube_subscription_synced_at: new Date().toISOString()
				})
				.eq('id', userId);

			console.log('[동기화] 완료: 구독 채널 없음');
			return {
				success: true,
				message: '동기화할 구독 채널이 없습니다',
				channelsSynced: 0,
				subscriptionsSynced: 0
			};
		}

		const uniqueChannelIds = [...new Set(subscriptions.map((s) => s.channel_id).filter(Boolean))];
		console.log(`[동기화] 고유 채널 ID ${uniqueChannelIds.length}개 추출 완료`);

		console.log('[동기화] 채널 정보 가져오는 중...');
		const channels = await getChannels(uniqueChannelIds);
		console.log(`[동기화] 채널 정보 가져오기 완료: ${channels.length}개`);

		const now = new Date().toISOString();

		const { adminSupabase } = locals;
		if (channels.length > 0) {
			console.log(`[동기화] 채널 정보 DB 저장 중... (${channels.length}개)`);
			for (const rowsChunk of chunk(channels, 100)) {
				const { error: channelError } = await adminSupabase.from('channels').upsert(
					rowsChunk.map((ch) => ({
						...ch,
						updated_at: now
					})),
					{ onConflict: 'channel_id' }
				);

				if (channelError) {
					console.error('[동기화] 채널 저장 실패:', channelError);
					throw error(500, channelError.message);
				}
			}
			console.log('[동기화] 채널 정보 DB 저장 완료');
		}

		console.log('[동기화] 기존 구독 데이터 삭제 중...');
		const { error: deleteError } = await supabase
			.from('youtube_subscriptions')
			.delete()
			.eq('user_id', userId);

		if (deleteError) {
			console.error('[동기화] 기존 구독 삭제 실패:', deleteError);
			throw error(500, deleteError.message);
		}
		console.log('[동기화] 기존 구독 데이터 삭제 완료');

		const subscriptionRows = subscriptions.map((sub) => ({
			user_id: userId,
			channel_id: sub.channel_id,
			title: sub.title,
			description: sub.description,
			published_at: sub.published_at,
			thumbnail_url: sub.thumbnail_url,
			resource_kind: sub.resource_kind,
			subscription_data: sub.subscription_data,
			subscribed_at: sub.published_at || now,
			updated_at: now
		}));

		console.log(`[동기화] 새 구독 데이터 저장 중... (${subscriptionRows.length}개)`);
		for (const rowsChunk of chunk(subscriptionRows, 100)) {
			const { error: insertError } = await supabase.from('youtube_subscriptions').insert(rowsChunk);

			if (insertError) {
				console.error('[동기화] 구독 저장 실패:', insertError);
				throw error(500, insertError.message);
			}
		}
		console.log('[동기화] 새 구독 데이터 저장 완료');

		const CONCURRENCY = 10;
		const startTime = Date.now();
		const syncResults = [];

		console.log(
			`[동기화] 총 ${channels.length}개 채널 비디오 동기화 시작 (동시 처리: ${CONCURRENCY}개)`
		);

		for (let i = 0; i < channels.length; i += CONCURRENCY) {
			const batch = channels.slice(i, i + CONCURRENCY);
			const batchStartTime = Date.now();

			console.log(
				`[동기화] 배치 ${Math.floor(i / CONCURRENCY) + 1}/${Math.ceil(channels.length / CONCURRENCY)} 시작 (${batch.length}개 채널)`
			);

			const batchResults = await Promise.allSettled(
				batch.map((channel) =>
					syncChannelVideosCommand(channel.channel_id).then(
						(result) => ({ channelId: channel.channel_id, result }),
						(err) => Promise.reject({ channelId: channel.channel_id, error: err })
					)
				)
			);

			syncResults.push(...batchResults);

			const batchTime = Date.now() - batchStartTime;
			const succeeded = batchResults.filter((r) => r.status === 'fulfilled').length;
			const failed = batchResults.filter((r) => r.status === 'rejected').length;
			console.log(
				`[동기화] 배치 완료: 성공 ${succeeded}개, 실패 ${failed}개, 소요시간 ${batchTime}ms`
			);

			if (failed > 0) {
				const failedChannels = batchResults
					.filter((r) => r.status === 'rejected')
					.map((r) => {
						const channelId = r.reason?.channelId || 'unknown';
						const error = r.reason?.error;
						console.error(`[동기화] 채널 ${channelId} 실패:`, error?.message || error);
						return channelId;
					});
				console.error(`[동기화] 실패한 채널 ID:`, failedChannels);
			}
		}

		const totalTime = Date.now() - startTime;
		const successes = syncResults.filter((r) => r.status === 'fulfilled');
		const failures = syncResults.filter((r) => r.status === 'rejected');

		console.log(
			`[동기화] 전체 완료: 성공 ${successes.length}개, 실패 ${failures.length}개, 총 소요시간 ${totalTime}ms`
		);

		await supabase
			.from('profiles')
			.update({
				youtube_subscription_sync_status: 'completed',
				youtube_subscription_synced_at: new Date().toISOString()
			})
			.eq('id', userId);

		return {
			success: true,
			message: 'YouTube 구독 동기화를 완료했습니다',
			channelsSynced: channels.length,
			subscriptionsSynced: subscriptionRows.length,
			videoSyncResults: {
				total: channels.length,
				succeeded: successes.length,
				failed: failures.length,
				totalTimeMs: totalTime,
				concurrency: CONCURRENCY,
				errors: failures.map((f) => ({
					channelId: f.reason?.channelId || 'unknown',
					message: f.reason?.error?.message || f.reason?.message || String(f.reason),
					errorType: f.reason?.error?.name || 'UnknownError'
				})),
				failedChannelIds: failures.map((f) => f.reason?.channelId).filter(Boolean)
			}
		};
	} catch (err) {
		await supabase
			.from('profiles')
			.update({ youtube_subscription_sync_status: 'failed' })
			.eq('id', userId);

		throw err;
	}
}

/**
 * Form: 구독 동기화
 */
export const syncSubscriptions = form(
	v.object({}),
	async (
		_data: Record<string, unknown>,
		invalid: (message: string) => void
	) => {
		const { locals } = getRequestEvent();
		const { supabase, safeGetSession } = locals;
		const { session, user } = await safeGetSession();

		if (!session || !user) throw error(401, '로그인이 필요합니다');

		const userId = user.id;

		const { data: profile, error: profileError } = await supabase
			.from('profiles')
			.select('youtube_subscription_sync_status')
			.eq('id', userId)
			.single();

		if (profileError) throw error(500, profileError.message);

		if (['processing', 'pending'].includes(profile?.youtube_subscription_sync_status)) {
			invalid('이미 동기화가 진행 중입니다');
			return;
		}

		return await performSubscriptionsSync();
	}
);

/**
 * Command: 구독 동기화
 */
export const syncSubscriptionsCommand = command(
	async () => {
		return await performSubscriptionsSync();
	}
);
