<script lang="ts">
	import { getSummaryStore } from '$lib/stores/summary.svelte';
	import YouTubePlayer from './YouTubePlayer.svelte';
	import SummaryCategories from './SummaryCategories.svelte';
	import SummaryTags from './SummaryTags.svelte';
	import ContentAnalysis from './ContentAnalysis.svelte';
	import CommunityEmotions from './CommunityEmotions.svelte';
	import CommunityAgeGroups from './CommunityAgeGroups.svelte';

	let { videoId } = $props();

	const summaryStore = getSummaryStore();
</script>

<main class="container mx-auto px-4 py-12 max-w-7xl">
	<header>
		<!-- 첫 번째 줄: 영상 + 카테고리/태그 -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
			<YouTubePlayer {videoId} />

			<!-- 우: 카테고리, 태그 -->
			<div class="space-y-6">
				<SummaryCategories {videoId} />
				<SummaryTags {videoId} />
			</div>
		</div>

		<!-- 두 번째 줄: 메트릭 레이더 + 메트릭 설명 -->
		<div class="mb-8">
			<ContentAnalysis {videoId} />
		</div>

		<div class="mt-8 mb-12">
			{#await summaryStore.detail(videoId)}
				<div class="placeholder animate-pulse h-10 rounded w-3/4"></div>
			{:then summary}
				{#if summary.title}
					<h1 class="text-xl font-extrabold mb-2 transition-colors hover:text-primary-600-400">
						{summary.title}
					</h1>
				{:else}
					<div class="placeholder animate-pulse h-10 rounded w-3/4"></div>
				{/if}
			{/await}
		</div>
	</header>

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
				<p class="break-keep">
					{summary.summary}
				</p>
			{:else if summary.analysis_status === 'failed' && summary.failure_reason}
				<div class="card preset-tonal-error p-4">
					<p class="text-sm text-error-700-300">
						{summary.failure_reason}
					</p>
				</div>
			{:else}
				<div class="space-y-3">
					<div class="placeholder animate-pulse h-4 rounded"></div>
					<div class="placeholder animate-pulse h-4 rounded"></div>
					<div class="placeholder animate-pulse h-4 w-4/5 rounded"></div>
				</div>
			{/if}
		{/await}
	</section>

	<section class="card preset-filled-surface-50-950 p-4 mt-6 transition-all hover:shadow-lg">
		<header class="mb-6">
			<h2 class="h2">커뮤니티 분석</h2>
		</header>

		{#await summaryStore.community(videoId)}
			<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
				<div class="space-y-3">
					<h3 class="font-bold text-center">감정 분포</h3>
					<div class="flex items-center justify-center rounded-lg bg-surface-100-900 h-80">
						<p class="text-surface-500-400">커뮤니티 분석 중...</p>
					</div>
					<div class="h-16"></div>
				</div>
				<div class="space-y-3">
					<h3 class="font-bold text-center">연령 분포</h3>
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
			{#if community}
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
	</section>
</main>
