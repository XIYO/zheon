<script lang="ts">
	import { getSummaryStore } from '$lib/stores/summary.svelte';

	let { videoId } = $props();

	const summaryStore = getSummaryStore();
</script>

<div>
	<h3 class="text-sm font-semibold text-surface-600-400 mb-2">카테고리</h3>
	<div class="flex flex-wrap gap-2">
		{#await summaryStore.categories(videoId)}
			<span class="chip preset-filled-primary-500 text-sm animate-pulse">
				<span class="invisible">카테고리 로딩중</span>
			</span>
			<span class="chip preset-filled-primary-500 text-sm animate-pulse">
				<span class="invisible">카테고리 로딩중 텍스트</span>
			</span>
		{:then categories}
			{#if categories && Array.isArray(categories) && categories.length > 0}
				{#each categories as category}
					<span class="chip preset-filled-primary-500 text-sm transition-all hover:scale-105">
						{(category as any).name_ko || (category as any).name}
					</span>
				{/each}
			{:else}
				<span class="chip preset-filled-primary-500 text-sm animate-pulse">
					<span class="invisible">카테고리 로딩중</span>
				</span>
				<span class="chip preset-filled-primary-500 text-sm animate-pulse">
					<span class="invisible">카테고리 로딩중 텍스트</span>
				</span>
			{/if}
		{/await}
	</div>
</div>
