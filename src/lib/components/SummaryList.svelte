<!-- 요약 결과 리스트 컴포넌트 -->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { getSummaryStore } from '$lib/stores/summary.svelte';
	import { getYouTubeThumbnail } from '$lib/utils/youtube';
	import { ListVideo } from '@lucide/svelte';

	const summaryStore = getSummaryStore();

	let sentinel: HTMLDivElement | null = $state(null);

	const isEmpty = $derived(() => {
		const allQueries = summaryStore.listQueries;
		const hasData = allQueries.some((q) => q.current?.summaries && q.current.summaries.length > 0);
		const isAnyLoading = allQueries.some((q) => q.loading);
		return !hasData && !isAnyLoading;
	});

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
	{#if isEmpty()}
		<div
			class={[
				'card preset-filled-surface-50-950',
				'p-12 text-center',
				'flex flex-col items-center gap-4'
			]}>
			<div
				class={[
					'w-16 h-16 rounded-full',
					'preset-tonal-surface',
					'flex items-center justify-center'
				]}>
				<ListVideo class="w-8 h-8 text-surface-600-400" />
			</div>
			<div class="space-y-2">
				<h2 class="text-xl font-semibold text-surface-950-50">아직 요약이 없습니다</h2>
				<p class="text-sm text-surface-600-400 max-w-md">
					상단 폼에서 YouTube URL을 입력하여 첫 요약을 시작하세요
				</p>
			</div>
		</div>
	{:else}
		<ul
			class={[
				'overflow-auto rounded-lg',
				'border border-surface-300-700',
				'divide-y divide-surface-200-800'
			]}>
			{#each summaryStore.listQueries as query, index}
				{#each query.current?.summaries as summary (summary.id)}
					<li class="transition-opacity hover:opacity-70">
						<a
							href={resolve('/(main)/[videoId]', { videoId: summary.video_id })}
							class="flex items-center gap-3 px-4 py-3">
							<div
								class={[
									'w-2 h-2 rounded-full shrink-0',
									{
										'bg-warning-500 animate-pulse': summary.processing_status === 'pending',
										'bg-primary-500 animate-pulse': summary.processing_status === 'processing',
										'bg-error-500': summary.processing_status === 'failed',
										'bg-success-500': summary.processing_status === 'completed'
									}
								]}>
							</div>
							<img
								src={getYouTubeThumbnail(summary.video_id, 'hqdefault')}
								alt=""
								width="80"
								height="45"
								class="rounded object-cover aspect-video shrink-0" />
							<div class="min-w-0 flex-1 space-y-1">
								<p class="truncate">
									{summary.title}
								</p>
								{#if summary.processing_status === 'failed' && (summary as any).failure_reason}
									<p class="text-xs text-error-500 truncate">
										{(summary as any).failure_reason}
									</p>
								{/if}
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
	{/if}
</section>
