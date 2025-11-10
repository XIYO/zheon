<!-- 요약 결과 리스트 컴포넌트 -->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { getSummaryStore } from '$lib/stores/summary.svelte';
	import { extractVideoId, getYouTubeThumbnail } from '$lib/utils/youtube';

	const summaryStore = getSummaryStore();

	let sentinel = $state(/** @type {HTMLDivElement | null} */ (null));

	$effect(() => {
		if (!sentinel) return;

		const observer = new IntersectionObserver(
			async (entries) => {
				if (entries[0].isIntersecting && !summaryStore.isLoadingMore) {
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
	{#if summaryStore.allSummaries.length === 0}
		<div class="text-center py-12 text-surface-500-400">
			<p>아직 정리된 인사이트가 없습니다</p>
		</div>
	{:else}
			<div class="overflow-x-auto">
				<table class="w-full border border-surface-300-700 rounded-lg overflow-hidden">
					<thead class="border-b border-surface-300-700">
						<tr>
							<th class="px-4 py-3 text-left font-medium text-surface-700-300">제목</th>
						</tr>
					</thead>
					<tbody>
						{#each summaryStore.allSummaries as summary (summary.id)}
							<tr class="border-b border-surface-200-800 hover:opacity-80">
								<td class="px-4 py-3">
									<a href={resolve('/(main)/[id]', { id: summary.id })} class="flex items-center gap-3">
										<div
											class="w-2 h-2 rounded-full shrink-0 {summary.processing_status === 'pending'
												? 'bg-warning-500 animate-pulse'
												: summary.processing_status === 'processing'
													? 'bg-primary-500 animate-pulse'
													: summary.processing_status === 'failed'
														? 'bg-error-500'
														: 'bg-success-500'}">
										</div>
										{#if summary.thumbnail_url || extractVideoId(summary.url)}
											<img
												src={summary.thumbnail_url ||
													getYouTubeThumbnail(extractVideoId(summary.url) || '')}
												alt=""
												width="80"
												height="45"
												class="rounded object-cover aspect-video shrink-0" />
										{/if}
										<div class="min-w-0 flex-1">
											<p class="truncate">
												{summary.title || summary.url}
											</p>
										</div>
									</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<div bind:this={sentinel} class="h-4"></div>

			{#if summaryStore.isLoadingMore}
				<div class="text-center py-4 text-surface-500-400">
					<p>더 불러오는 중...</p>
				</div>
			{/if}
	{/if}
</section>
