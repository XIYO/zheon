<script lang="ts">
	import { getSummaryStore } from '$lib/stores/summary.svelte';

	let { videoId } = $props();

	const summaryStore = getSummaryStore();
</script>

<section class="card preset-filled-surface-50-950 p-4 transition-all hover:shadow-lg">
	<header class="mb-4">
		<h2 class="h2">AI 요약</h2>
	</header>
	{#await summaryStore.detail(videoId)}
		<div class="space-y-3">
			<div class="placeholder animate-pulse h-4 rounded"></div>
			<div class="placeholder animate-pulse h-4 rounded"></div>
			<div class="placeholder animate-pulse h-4 w-4/5 rounded"></div>
		</div>
	{:then summary}
		{#if summary.analysis_status === 'processing'}
			<div class="space-y-3">
				<div class="placeholder animate-pulse h-4 rounded"></div>
				<div class="placeholder animate-pulse h-4 rounded"></div>
				<div class="placeholder animate-pulse h-4 w-4/5 rounded"></div>
			</div>
		{:else if summary.summary}
			<p class="break-keep text-surface-700-300">
				{summary.summary}
			</p>
		{:else}
			<div class="space-y-3">
				<div class="placeholder animate-pulse h-4 rounded"></div>
				<div class="placeholder animate-pulse h-4 rounded"></div>
				<div class="placeholder animate-pulse h-4 w-4/5 rounded"></div>
			</div>
		{/if}
	{/await}
</section>
