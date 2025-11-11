<!-- 요약 결과 리스트 컴포넌트 -->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { getSummaryStore } from '$lib/stores/summary.svelte';
	import { extractVideoId, getYouTubeThumbnail } from '$lib/utils/youtube';

	const summaryStore = getSummaryStore();

	let sentinel: HTMLDivElement | null = $state(null);

	$effect(() => {
		if (!sentinel) return;

		const observer = new IntersectionObserver(
			async (entries) => {
				const queries = summaryStore.listQueries;
				const lastQuery = queries[queries.length - 1];
				const isLoading = lastQuery?.loading ?? false;

				if (entries[0].isIntersecting && !isLoading) {
					await summaryStore.loadMore();
				}
			},
			{
				threshold: 0,
				rootMargin: '100px'
			}
		);

		observer.observe(sentinel);

		return () => observer.disconnect();
	});
</script>

<section aria-labelledby="summaries-title" class="space-y-4">
	<ul
		class="overflow-auto border border-surface-300-700 rounded-lg divide-y divide-surface-200-800">
		{#each summaryStore.listQueries as query, index}
			{#each query.current?.summaries as summary (summary.id)}
				<li class="hover:opacity-80">
					<a
						href={resolve('/(main)/[id]', { id: summary.id })}
						class="flex items-center gap-3 px-4 py-3">
						<div
							class="w-2 h-2 rounded-full shrink-0 {summary.processing_status === 'pending'
								? 'bg-warning-500 animate-pulse'
								: summary.processing_status === 'processing'
									? 'bg-primary-500 animate-pulse'
									: summary.processing_status === 'failed'
										? 'bg-error-500'
										: 'bg-success-500'}">
						</div>
						<img
							src={getYouTubeThumbnail(extractVideoId(summary.url))}
							alt=""
							width="80"
							height="45"
							class="rounded object-cover aspect-video shrink-0" />
						<div class="min-w-0 flex-1">
							<p class="truncate">
								{summary.title}
							</p>
						</div>
					</a>
				</li>
			{:else}
			<!-- 스토어가 최초 두개(신규-최초는0개, 현재)의 getSummaries 함수를 가지기때문에 초기에는 펜딩 상태가 두 개 존재한다.
			 그래서 항상 마지막 배열의 펜딩만 그린다.
			  -->
				{#if query.loading && index === summaryStore.listQueries.length - 1}
					<li class="px-4 py-8 text-center text-surface-500">
						<p>불러오는 중...</p>
					</li>
				{/if}
			{/each}
		{/each}
	</ul>

	<div bind:this={sentinel} class="h-4"></div>
</section>
