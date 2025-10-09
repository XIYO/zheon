<script>
	import { enhance } from '$app/forms';

	let { data } = $props();
</script>

<div class="container mx-auto px-4 py-12">
	<!-- 채널 헤더 -->
	<div class="mb-8">
		<h1 class="preset-typo-display-2 mb-2">{data.channel?.title || '채널'}</h1>
		{#if data.channel?.description}
			<p class="preset-typo-subtitle text-surface-400-600">
				{data.channel.description}
			</p>
		{/if}
	</div>

	<!-- 최신 영상 목록 -->
	{#if data.videos && data.videos.length > 0}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each data.videos as video}
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
					<input type="hidden" name="youtubeUrl" value="https://www.youtube.com/watch?v={video.id.videoId}" />

					<button type="submit" class="w-full text-left">
						<!-- 영상 썸네일 -->
						<div class="relative aspect-video w-full overflow-hidden bg-surface-800">
							<img
								src={video.snippet.thumbnails.high?.url ||
									video.snippet.thumbnails.medium?.url ||
									video.snippet.thumbnails.default?.url}
								alt={video.snippet.title}
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
								{video.snippet.title}
							</h3>
							<p class="preset-typo-caption text-surface-400-600">
								{new Date(video.snippet.publishedAt).toLocaleDateString('ko-KR')}
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
