<script>
	let { data } = $props();
</script>

<div class="container mx-auto px-4 py-12">
	<!-- 페이지 헤더 -->
	<div class="mb-12">
		<h1 class="preset-typo-display-2 mb-4">YouTube 구독 채널</h1>
		<p class="preset-typo-subtitle text-surface-400-600">
			구독 중인 YouTube 채널 목록입니다
		</p>
	</div>

	<!-- 구독 목록 -->
	{#if data.subscriptions && data.subscriptions.length > 0}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			{#each data.subscriptions as subscription}
				<a
					href="/youtube/channel/{subscription.snippet.resourceId.channelId}"
					class="preset-outlined-surface group flex overflow-hidden rounded-xl transition-all hover:scale-[1.02]"
				>
					<!-- 채널 프로필 이미지 (1:2 비율의 왼쪽) -->
					<div class="relative aspect-square w-32 flex-shrink-0 overflow-hidden bg-surface-800">
						<img
							src={subscription.snippet.thumbnails.high?.url ||
								subscription.snippet.thumbnails.medium?.url ||
								subscription.snippet.thumbnails.default?.url}
							alt={subscription.snippet.title}
							class="h-full w-full object-cover"
							loading="lazy"
						/>
					</div>

					<!-- 채널 정보 (1:2 비율의 오른쪽) -->
					<div class="flex flex-1 flex-col justify-center p-4">
						<h3 class="preset-typo-headline-6 mb-1 truncate">
							{subscription.snippet.title}
						</h3>
						{#if subscription.snippet.description}
							<p class="preset-typo-caption line-clamp-2 text-surface-400-600">
								{subscription.snippet.description}
							</p>
						{/if}
					</div>
				</a>
			{/each}
		</div>
	{:else}
		<div class="preset-outlined-surface rounded-xl p-12 text-center">
			<p class="preset-typo-subtitle text-surface-400-600">구독 중인 채널이 없습니다</p>
		</div>
	{/if}
</div>
