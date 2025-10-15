<script>
	import { page } from '$app/state';
	import { syncChannelVideos, getChannelVideos } from '$lib/remote/channel_videos.remote.js';
	import { getChannel } from '$lib/remote/channel.remote.js';
	import VideoCard from '$lib/components/VideoCard.svelte';

	/** @type {string} */
	let channelId = $derived(page.params.channelId);
	let [channel, initialData] = $derived(await Promise.all([
		getChannel(channelId),
		getChannelVideos({ channelId })
	]));

	let isChannelSyncSubmitting = $state(false);
	let isSync = $derived(isChannelSyncSubmitting || ['pending', 'processing'].includes(channel?.video_sync_status));

	// 무한 스크롤 상태
	let videos = $state(initialData.videos);
	let nextCursor = $state(initialData.nextCursor);
	let hasMore = $state(initialData.hasMore);
	let isLoadingMore = $state(false);
	let sentinel = $state(null);

	// 더 불러오기 함수
	async function loadMore() {
		if (!hasMore || isLoadingMore) return;

		isLoadingMore = true;
		const result = await getChannelVideos({ channelId, cursor: nextCursor });

		videos = [...videos, ...result.videos];
		nextCursor = result.nextCursor;
		hasMore = result.hasMore;
		isLoadingMore = false;
	}

	const enhancedForm = syncChannelVideos.enhance(async ({ form, submit }) => {
		isChannelSyncSubmitting = true;
		await submit();
		await getChannel(channelId).refresh();

		// 동기화 후 비디오 목록 리셋
		const refreshedData = await getChannelVideos({ channelId });
		videos = refreshedData.videos;
		nextCursor = refreshedData.nextCursor;
		hasMore = refreshedData.hasMore;

		isChannelSyncSubmitting = false;
	});

	// IntersectionObserver로 무한 스크롤 구현
	$effect(() => {
		if (!sentinel || !hasMore) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) loadMore();
			},
			{ threshold: 0.1 }
		);

		observer.observe(sentinel);

		return () => observer.disconnect();
	});

	// Realtime updates for channel sync status
	$effect.pre(() => {
		const { supabase } = page.data;

		const needsUpdate = ['pending', 'processing'].includes(channel?.video_sync_status);

		if (!needsUpdate) return;

		const channelUpdateChannel = supabase
			.channel(`channel-sync-${channelId}`)
			.on(
				'postgres_changes',
				{
					event: 'UPDATE',
					schema: 'public',
					table: 'channels',
					filter: `channel_id=eq.${channelId}`
				},
				async (payload) => {
					const updated = await getChannel(channelId);
					channel = updated;

					if (updated.video_sync_status === 'completed') {
						const refreshedData = await getChannelVideos({ channelId });
						videos = refreshedData.videos;
						nextCursor = refreshedData.nextCursor;
						hasMore = refreshedData.hasMore;
					}
				}
			)
			.subscribe((status, err) => {
				if (err) console.error('[Realtime] Channel sync subscription error:', err);
			});

		return () => {
			channelUpdateChannel.unsubscribe();
		};
	});
</script>

<div class="container mx-auto px-4 py-12">
	<!-- 채널 헤더 -->
	{#if channel}
		<div class="mb-8 flex items-start justify-between">
			<div class="flex gap-6">
				{#if channel.channel_avatar}
					<img
						src={channel.channel_avatar}
						alt={channel.channel_name}
						class="h-24 w-24 rounded-full object-cover"
					/>
				{/if}
				<div>
					<h1 class="h1 mb-2">{channel.channel_name}</h1>
					{#if channel.channel_handle}
						<p class="text-surface-400-600">{channel.channel_handle}</p>
					{/if}
					<div class="mt-2 flex gap-4 text-sm text-surface-400-600">
						{#if channel.subscriber_count}
							<span>구독자 {channel.subscriber_count}</span>
						{/if}
						{#if channel.video_count}
							<span>동영상 {channel.video_count}개</span>
						{/if}
					</div>
				</div>
			</div>

			<div class="text-right">
				<form {...enhancedForm}>
					<input type="hidden" name="channelId" value={channelId} />
					<button
						type="submit"
						class={["chip preset-tonal-primary", {'animate-pulse' : isSync}]}
						disabled={isSync}
					>
						{isSync ? '동기화 중...' : '영상 목록 동기화'}
					</button>
				</form>
				{#each syncChannelVideos.fields.allIssues() as issue}
					<span class="text-error-500 text-sm block mt-2">
						{issue.message}
					</span>
				{/each}
			</div>
		</div>

		{#if channel.description}
			<div class="mb-8 rounded-lg bg-surface-100 p-4 dark:bg-surface-800">
				<p class="text-surface-600 dark:text-surface-300">
					{channel.description}
				</p>
			</div>
		{/if}
	{/if}

	<!-- 영상 목록 -->
	<div class="mb-4">
		<h2 class="h2">최신 영상</h2>
	</div>

	{#if videos.length > 0}
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each videos as video}
				<VideoCard {video} />
			{/each}
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
		{:else}
			<div class="mt-8 py-8 text-center text-surface-400">
				모든 영상을 불러왔습니다
			</div>
		{/if}
	{:else}
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each Array(4) as _}
				<VideoCard />
			{/each}
		</div>
	{/if}
</div>
