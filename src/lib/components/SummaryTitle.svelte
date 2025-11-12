<script lang="ts">
	import { getSummaryStore } from '$lib/stores/summary.svelte';

	let { videoId } = $props();

	const summaryStore = getSummaryStore();
</script>

<h1 class="text-xl font-extrabold mb-8 text-surface-950-50">
	{#await summaryStore.detail(videoId)}
		<span class="placeholder animate-pulse rounded w-3/4 inline-block">
			<span class="sr-only">로딩 중...</span>
		</span>
	{:then summary}
		{summary.title}
	{/await}
</h1>
