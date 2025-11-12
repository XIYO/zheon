<script lang="ts">
	import { ExternalLink } from '@lucide/svelte';

	let { videoId }: { videoId: string } = $props();
</script>

{#snippet playerContent(id: string)}
	{#await (async () => {
		try {
			const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`);
			return response.ok;
		} catch {
			return false;
		}
	})()}
		<div class="w-full aspect-video rounded-xl overflow-hidden bg-surface-900 animate-pulse"></div>
	{:then isEmbeddable}
		{@const thumbnailUrl = `https://img.youtube.com/vi/${id}/maxresdefault.jpg`}
		{@const youtubeUrl = `https://www.youtube.com/watch?v=${id}`}
		{#if isEmbeddable}
			<div class="w-full aspect-video rounded-xl overflow-hidden">
				<iframe
					src="https://www.youtube.com/embed/{id}"
					title="YouTube video player"
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
					referrerpolicy="strict-origin-when-cross-origin"
					allowfullscreen
					class="w-full h-full">
				</iframe>
			</div>
		{:else}
			<div class="relative w-full aspect-video rounded-xl overflow-hidden bg-surface-900">
				<img src={thumbnailUrl} alt="Video thumbnail" class="w-full h-full object-cover" />
				<div
					class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col items-center justify-center gap-4">
					<p class="text-white text-center px-4 font-semibold text-sm">
						이 영상은 외부 사이트에서 재생할 수 없습니다
					</p>
					<a
						href={youtubeUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="btn preset-filled-error-500 gap-2 transition-transform hover:scale-105">
						<ExternalLink size={18} />
						YouTube에서 보기
					</a>
				</div>
			</div>
		{/if}
	{/await}
{/snippet}

{#key videoId}
	{@render playerContent(videoId)}
{/key}
