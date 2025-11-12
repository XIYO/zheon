<script lang="ts">
	import { getSummaryStore } from '$lib/stores/summary.svelte';

	let { videoId } = $props();

	const summaryStore = getSummaryStore();
</script>

<div>
	<h3 class="text-sm font-semibold text-surface-600-400 mb-2">태그</h3>
	<div class="flex flex-wrap gap-2">
		{#await summaryStore.tags(videoId)}
			<span class="chip preset-tonal-secondary text-sm animate-pulse">
				<span class="invisible">태그 로딩</span>
			</span>
			<span class="chip preset-tonal-secondary text-sm animate-pulse">
				<span class="invisible">태그 로딩중 텍스트</span>
			</span>
			<span class="chip preset-tonal-secondary text-sm animate-pulse">
				<span class="invisible">태그 로딩중</span>
			</span>
		{:then tags}
			{#if tags && tags.length > 0}
				{#each tags as tag}
					<span
						class="chip preset-tonal-secondary text-sm transition-all hover:scale-105"
						style:opacity={tag.weight}>
						{tag.name_ko || tag.name}
					</span>
				{/each}
			{:else}
				<span class="chip preset-tonal-secondary text-sm animate-pulse">
					<span class="invisible">태그 로딩</span>
				</span>
				<span class="chip preset-tonal-secondary text-sm animate-pulse">
					<span class="invisible">태그 로딩중 텍스트</span>
				</span>
				<span class="chip preset-tonal-secondary text-sm animate-pulse">
					<span class="invisible">태그 로딩중</span>
				</span>
			{/if}
		{/await}
	</div>
</div>
