<script>
	import { enhance } from '$app/forms';

	let { data } = $props();
	let channel = $state(data.channel);
	let videos = $state(data.videos);
	let loading = $state(data.loading);

	// 스트리밍 데이터가 도착하면 업데이트
	$effect(() => {
		if (data.streamed?.data) {
			data.streamed.data.then((streamedData) => {
				if (streamedData) {
					console.log('Data arrived:', streamedData);
					channel = streamedData.channel;
					videos = streamedData.videos;
					loading = streamedData.loading;
				}
			});
		}
	});
</script>

<div class="container mx-auto px-4 py-12">
	<!-- 채널 헤더 -->
	{#if loading}
		<!-- Skeleton Placeholder -->
		<div class="mb-8 flex items-start gap-6">
			<div class="placeholder-circle w-24 h-24 animate-pulse"></div>
			<div class="flex-1 space-y-3">
				<div class="placeholder h-8 w-1/3 animate-pulse"></div>
				<div class="placeholder h-4 w-1/4 animate-pulse"></div>
				<div class="placeholder h-4 w-full animate-pulse"></div>
				<div class="placeholder h-4 w-5/6 animate-pulse"></div>
			</div>
		</div>
	{:else if channel}
		<div class="mb-8 flex items-start gap-6">
			<!-- 채널 썸네일 -->
			<div class="w-24 h-24 rounded-full overflow-hidden bg-surface-200-700-token flex-shrink-0">
				<img src={channel.thumbnail} alt={channel.name} class="w-full h-full object-cover" />
			</div>

			<!-- 채널 정보 -->
			<div class="flex-1">
				<h1 class="preset-typo-display-2 mb-2">{channel.name}</h1>
				{#if channel.subscriberCount}
					<p class="text-sm text-surface-600-300-token mb-2">
						구독자 {channel.subscriberCount}
					</p>
				{/if}
				{#if channel.description}
					<p class="preset-typo-subtitle text-surface-400-600">
						{channel.description}
					</p>
				{/if}
			</div>
		</div>
	{:else}
		<div class="mb-8">
			<h1 class="preset-typo-display-2 mb-2">채널</h1>
		</div>
	{/if}

	<!-- 최신 영상 목록 -->
	{#if loading}
		<!-- Skeleton Placeholders for Videos -->
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each Array(6) as _, i}
				<div class="preset-outlined-surface overflow-hidden rounded-xl">
					<div class="placeholder aspect-video w-full animate-pulse"></div>
					<div class="p-4 space-y-2">
						<div class="placeholder h-5 w-full animate-pulse"></div>
						<div class="placeholder h-5 w-4/5 animate-pulse"></div>
						<div class="placeholder h-4 w-1/3 animate-pulse"></div>
					</div>
				</div>
			{/each}
		</div>
	{:else if videos && videos.length > 0}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each videos as video (video.id)}
				<form
					method="POST"
					action="/?/summarize"
					class="preset-outlined-surface group overflow-hidden rounded-xl transition-all hover:scale-[1.02]"
					use:enhance={() => {
						return async ({ result }) => {
							if (result.type === 'success' || result.type === 'failure') {
								alert(result.type === 'success' ? '요약이 시작되었습니다!' : '요약 요청에 실패했습니다.');
							}
						};
					}}
				>
					<input type="hidden" name="youtubeUrl" value={video.url} />

					<button type="submit" class="w-full text-left">
						<!-- 영상 썸네일 -->
						<div class="relative aspect-video w-full overflow-hidden bg-surface-800">
							<img
								src={video.thumbnail}
								alt={video.title}
								class="h-full w-full object-cover"
								loading="lazy"
							/>
							<div class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
								<span class="preset-typo-headline-6 text-white">요약 시작</span>
							</div>
						</div>

						<!-- 영상 정보 -->
						<div class="p-4">
							<h3 class="preset-typo-headline-6 mb-2 line-clamp-2">
								{video.title}
							</h3>
							<p class="preset-typo-caption text-surface-400-600">
								{video.publishedAt}
							</p>
						</div>
					</button>
				</form>
			{/each}
		</div>
	{:else}
		<div class="preset-outlined-surface rounded-xl p-12 text-center">
			<p class="preset-typo-subtitle text-surface-400-600">영상이 없습니다</p>
		</div>
	{/if}
</div>
