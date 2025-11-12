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
		{#if summary.summary}
			<p class="break-keep text-surface-700-300">
				{summary.summary}
			</p>
		{:else if summary.analysis_status === 'failed' && summary.failure_reason}
			<div class="card preset-tonal-error p-4">
				<p class="text-sm text-error-700-300">
					{summary.failure_reason}
				</p>
			</div>
		{:else}
			<div class="card preset-tonal-warning p-4">
				<p class="text-sm text-warning-700-300">요약을 생성하지 못했습니다.</p>
			</div>
		{/if}
	{/await}
</section>
