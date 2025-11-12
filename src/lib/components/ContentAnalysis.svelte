<script lang="ts">
	import { getSummaryStore } from '$lib/stores/summary.svelte';
	import MetricsRadarChart from './MetricsRadarChart.svelte';

	let { videoId } = $props();

	const summaryStore = getSummaryStore();
</script>

{#await summaryStore.metrics(videoId)}
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
		<div class="flex items-center justify-center">
			<div>
				<h3 class="text-sm font-semibold text-surface-600-400 mb-4 text-center">
					콘텐츠 특성 분석
				</h3>
				<div class="placeholder-circle animate-pulse bg-surface-200-800 size-80"></div>
			</div>
		</div>

		<div class="flex flex-col justify-center">
			<h3 class="text-sm font-semibold text-surface-600-400 mb-4">지표 상세</h3>
			<div class="space-y-3 text-sm">
				{#each Array(4) as _}
					<div class="card preset-tonal-surface p-3">
						<div class="placeholder animate-pulse h-4 w-32 rounded mb-2"></div>
						<div class="placeholder animate-pulse h-3 w-full rounded"></div>
					</div>
				{/each}
			</div>
		</div>
	</div>
{:then metrics}
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
		<div class="flex items-center justify-center">
			<div>
				<h3 class="text-sm font-semibold text-surface-600-400 mb-4 text-center">
					콘텐츠 특성 분석
				</h3>
				{#if metrics && Object.keys(metrics).length > 0}
					<MetricsRadarChart
						data={Object.fromEntries(
							Object.entries(metrics).map(([key, value]) => [
								key,
								typeof value === 'object' && value !== null && 'score' in value
									? (value.score as number)
									: 0
							])
						)} />
				{:else}
					<div class="placeholder-circle animate-pulse bg-surface-200-800 size-80"></div>
				{/if}
			</div>
		</div>

		<div class="flex flex-col justify-center">
			<h3 class="text-sm font-semibold text-surface-600-400 mb-4">지표 상세</h3>
			<div class="space-y-3 text-sm">
				{#if metrics && Object.keys(metrics).length > 0}
					{#each Object.entries(metrics) as [key, value]}
						{@const metricValue =
							typeof value === 'object' && value !== null && 'score' in value
								? (value as { score: number; reasoning?: string })
								: { score: 0, reasoning: '' }}
						{@const score = typeof metricValue.score === 'number' ? metricValue.score : 0}
						{@const badgeClass =
							score >= 70
								? 'preset-filled-success'
								: score >= 40
									? 'preset-filled-warning'
									: 'preset-filled-error'}
						{@const category = score >= 70 ? '강점' : score >= 40 ? '보통' : '약점'}
						<div
							class="card preset-tonal-surface p-3 transition-all hover:shadow-md hover:-translate-y-0.5">
							<div class="flex justify-between items-center mb-2">
								<div class="flex items-center gap-2">
									<span class="font-mono font-semibold text-surface-900-50">{key}</span>
									<span class="text-xs text-surface-500">({category})</span>
								</div>
								<span class="badge {badgeClass}">{score}</span>
							</div>
							{#if metricValue.reasoning}
								<p class="text-surface-600-400 text-xs">{metricValue.reasoning}</p>
							{/if}
						</div>
					{/each}
				{:else}
					{#each Array(4) as _}
						<div class="card preset-tonal-surface p-3">
							<div class="placeholder animate-pulse h-4 w-32 rounded mb-2"></div>
							<div class="placeholder animate-pulse h-3 w-full rounded"></div>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</div>
{/await}
