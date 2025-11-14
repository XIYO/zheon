<script lang="ts">
	import { getSummaryStore } from '$lib/stores/summary.svelte';

	let { videoId } = $props();

	const summaryStore = getSummaryStore();
</script>

{#await summaryStore.detail(videoId) then summary}
	{#if summary.analysis_status === 'failed' && summary.failure_reason}
		<div class="card preset-tonal-error p-6 mb-8">
			<h2 class="h3 text-error-700-300 mb-2">분석 실패</h2>
			<p class="text-error-700-300">
				{summary.failure_reason}
			</p>
		</div>
	{/if}
{/await}
