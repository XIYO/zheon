<script lang="ts">
	import { getSummaryStore } from '$lib/stores/summary.svelte';
	import CommunityEmotions from './CommunityEmotions.svelte';
	import CommunityAgeGroups from './CommunityAgeGroups.svelte';

	let { videoId } = $props();

	const summaryStore = getSummaryStore();
	const summary = $derived(summaryStore.detail(videoId));
</script>

<section class="card preset-filled-surface-50-950 p-4 transition-all hover:shadow-lg">
	<header class="mb-6">
		<h2 class="h2">커뮤니티 분석</h2>
	</header>

	{#await summaryStore.community(videoId)}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
			<div class="space-y-3">
				<h3 class="font-bold text-center text-surface-950-50">감정 분포</h3>
				<div class="flex items-center justify-center rounded-lg bg-surface-100-900 h-80">
					<p class="text-surface-500-400">커뮤니티 분석 중...</p>
				</div>
				<div class="h-16"></div>
			</div>
			<div class="space-y-3">
				<h3 class="font-bold text-center text-surface-950-50">연령 분포</h3>
				<div class="flex items-center justify-center rounded-lg bg-surface-100-900 h-80">
					<p class="text-surface-500-400">커뮤니티 분석 중...</p>
				</div>
				<div class="h-16"></div>
			</div>
		</div>

		<div class="text-xs text-surface-500 mt-6 text-right">
			<div class="h-3"></div>
		</div>
	{:then community}
		{#await summary then summaryData}
			{#if summaryData.analysis_status === 'processing'}
				<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
					<div class="space-y-3">
						<h3 class="font-bold text-center text-surface-950-50">감정 분포</h3>
						<div class="flex items-center justify-center rounded-lg bg-surface-100-900 h-80">
							<div class="placeholder animate-pulse size-64 rounded-lg"></div>
						</div>
						<div class="h-16"></div>
					</div>
					<div class="space-y-3">
						<h3 class="font-bold text-center text-surface-950-50">연령 분포</h3>
						<div class="flex items-center justify-center rounded-lg bg-surface-100-900 h-80">
							<div class="placeholder animate-pulse size-64 rounded-lg"></div>
						</div>
						<div class="h-16"></div>
					</div>
				</div>
			{:else if community}
				<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
					<CommunityEmotions {videoId} />
					<CommunityAgeGroups {videoId} />
				</div>

				<div class="text-xs text-surface-500 mt-6 text-right">
					최근 댓글 {community.comments_analyzed ?? 0}개 분석 · {community.analysis_model}
				</div>
			{:else}
				<div class="card preset-tonal-warning p-8 text-center">
					<p class="text-surface-700-300">댓글이 부족해서 커뮤니티 분석 실패</p>
				</div>
			{/if}
		{/await}
	{/await}
</section>
