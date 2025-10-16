<script>
	import { page } from '$app/state';
	import { innerHeight } from 'svelte/reactivity/window';
    import { getSubscriptions, syncSubscriptions, syncSubscriptionsCommand } from '$lib/remote/subscription.remote.js';
    import { getProfile } from '$lib/remote/profile.remote.js';
    import ChannelCard from '$lib/components/ChannelCard.svelte';

    let [initialData, profile] = $derived(await Promise.all([
		getSubscriptions(),
		getProfile()
	]));

	// 무한 스크롤 상태
	let subscriptions = $state([]);
	let nextCursor = $state(null);
	let hasMore = $state(false);
	let isLoadingMore = $state(false);
	let sentinel = $state(null);

	// initialData가 변경되면 로컬 상태 동기화
	$effect(() => {
		subscriptions = initialData.subscriptions;
		nextCursor = initialData.nextCursor;
		hasMore = initialData.hasMore;
	});

	let isSubscriptionSyncSubmitting = $state(false);
	let isSync = $derived(isSubscriptionSyncSubmitting || ['pending', 'processing'].includes(profile?.youtube_subscription_sync_status));

	// 더 불러오기 함수
	async function loadMore() {
		if (!hasMore || isLoadingMore) return;

		isLoadingMore = true;
		try {
			const result = await getSubscriptions({ cursor: nextCursor });

			subscriptions = [...subscriptions, ...result.subscriptions];
			nextCursor = result.nextCursor;
			hasMore = result.hasMore;
		} catch (err) {
			console.error('구독 목록 추가 로딩 실패:', err);
		} finally {
			isLoadingMore = false;
		}
	}

	const enhanceSyncSubscriptions = syncSubscriptions.enhance(async ({ form, submit }) => {
		isSubscriptionSyncSubmitting = true;
		try {
			await submit();
			await getProfile().refresh();

			// 동기화 후 구독 목록 리셋
			const refreshedData = await getSubscriptions();
			subscriptions = refreshedData.subscriptions;
			nextCursor = refreshedData.nextCursor;
			hasMore = refreshedData.hasMore;
		} catch (err) {
			console.error('구독 동기화 실패:', err);
		} finally {
			isSubscriptionSyncSubmitting = false;
		}
	})

	// IntersectionObserver로 무한 스크롤 구현
	$effect(() => {
		if (!sentinel || !hasMore) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) loadMore();
			},
			{
				threshold: 0,
				rootMargin: `${innerHeight.current}px`
			}
		);

		observer.observe(sentinel);

		return () => observer.disconnect();
	});

	let autoSyncAttempted = $state(false);

    // 구독 목록이 0개이고 동기화 중이 아니면 자동 동기화
    $effect.pre(() => {
        if (subscriptions.length === 0 && !isSync && !autoSyncAttempted) {
			autoSyncAttempted = true;
			isSubscriptionSyncSubmitting = true;
			syncSubscriptionsCommand()
				.updates(getSubscriptions(), getProfile())
				.catch((err) => {
					console.error('구독 동기화 실패:', err);
					isSubscriptionSyncSubmitting = false;
				});

			// 동기화 후 구독 목록 리셋
			getSubscriptions()
				.then((refreshedData) => {
					subscriptions = refreshedData.subscriptions;
					nextCursor = refreshedData.nextCursor;
					hasMore = refreshedData.hasMore;
					isSubscriptionSyncSubmitting = false;
				})
				.catch((err) => {
					console.error('구독 목록 조회 실패:', err);
					isSubscriptionSyncSubmitting = false;
				});
        }
    });

	// Realtime updates
	$effect.pre(() => {
		const { supabase } = page.data;

		const needsSync = ['pending', 'processing'].includes(
			profile?.youtube_subscription_sync_status
		);
		if (!needsSync) return;

		const channel = supabase
			.channel('profile-sync-updates')
			.on(
				'postgres_changes',
				{
					event: 'UPDATE',
					schema: 'public',
					table: 'profile'
				},
				async (payload) => {
					// profile 새로고침
					await getProfile().refresh();

					// 동기화 완료 시 구독 목록 새로고침
					const refreshedData = await getSubscriptions();
					subscriptions = refreshedData.subscriptions;
					nextCursor = refreshedData.nextCursor;
					hasMore = refreshedData.hasMore;
				}
			)
			.subscribe();

		return () => {
			channel.unsubscribe();
		};
	});
</script>

<main>
	<header class="flex items-start justify-between px-4 my-8">
		<h1 class="h1 mb-4">YouTube 구독 채널</h1>
		<div class="flex flex-col items-end gap-2">
			<form {...enhanceSyncSubscriptions}>
				<button
					type="submit"
					class={["chip preset-tonal-primary", {'animate-pulse' : isSync}]}
					disabled={isSync}
				>
					{isSync ? '동기화 중...' : '구독 동기화'}
				</button>
			</form>
			{#each syncSubscriptions.fields.allIssues() as issue}
				<span class="text-error-500 text-sm">
					{issue.message}
				</span>
			{/each}
		</div>
	</header>

	<section class="px-4 my-8">
		<header class="flex justify-end mb-4">
			<span>
				총 {subscriptions.length}개 채널 구독 중
			</span>
		</header>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#if subscriptions.length === 0}
				{#each Array(4) as _}
					<ChannelCard />
				{/each}
			{:else}
				{#each subscriptions as subscription}
					<ChannelCard channel={subscription.channel} />
				{/each}
			{/if}
		</div>

		<!-- Sentinel (무한 스크롤 트리거) -->
		{#if hasMore}
			<div bind:this={sentinel} class="mt-8 flex h-20 items-center justify-center">
				{#if isLoadingMore}
					<div class="animate-pulse text-surface-400">로딩 중...</div>
				{:else}
					<div class="text-surface-400">스크롤하여 더 보기</div>
				{/if}
			</div>
		{:else if subscriptions.length > 0}
			<div class="mt-8 py-8 text-center text-surface-400">
				모든 채널을 불러왔습니다
			</div>
		{/if}
	</section>
</main>
