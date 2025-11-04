<!-- 요약 결과 리스트 컴포넌트 -->
<script>
	import { page } from '$app/state';
	import { getSummaries } from '$lib/remote/summary.remote';
	import { localizeHref } from '$lib/paraglide/runtime';
	import { innerHeight } from 'svelte/reactivity/window';

	const { supabase } = page.data;

	// 첫 페이지는 query로 캐싱, withOverride 동작
	let firstPage = $derived(await getSummaries({}));

	// 추가 페이지는 수동 관리
	let additionalPages = $state(
		/** @type {Array<{summaries: any[], nextCursor: string | null, hasMore: boolean}>} */ ([])
	);

	// 모든 페이지 합치기
	let summaries = $derived([
		...firstPage.summaries,
		...additionalPages.flatMap((p) => p.summaries)
	]);

	// 무한 스크롤 상태
	let hasMore = $derived(
		additionalPages.length === 0 ? firstPage.hasMore : (additionalPages.at(-1)?.hasMore ?? false)
	);
	let isLoadingMore = $state(false);
	let sentinel = $state(/** @type {HTMLDivElement | null} */ (null));

	// 더 불러오기 함수
	async function loadMore() {
		if (!hasMore || isLoadingMore) return;

		isLoadingMore = true;
		const cursor = additionalPages.at(-1)?.nextCursor ?? firstPage.nextCursor;
		const result = await getSummaries({ cursor });

		additionalPages = [...additionalPages, result];
		isLoadingMore = false;
	}

	// IntersectionObserver로 무한 스크롤 구현
	$effect(() => {
		if (!sentinel || !hasMore) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) loadMore();
			},
			{
				threshold: 0,
				rootMargin: `${innerHeight.current}px`
			}
		);

		observer.observe(sentinel);

		return () => observer.disconnect();
	});

	// pending/processing 상태 추적
	let hasPending = $derived(
		summaries.some((s) => ['pending', 'processing'].includes(s.processing_status))
	);

	// Realtime updates - pending/processing이 있을 때만 구독
	$effect(() => {
		if (!hasPending) {
			console.log('[SummaryList] pending/processing 없음, 구독 안 함');
			return;
		}

		console.log('[SummaryList] Realtime 구독 시작');
		const channel = supabase
			.channel('summary-updates')
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'zheon',
					table: 'summaries'
				},
				async (payload) => {
					console.log('[SummaryList] Realtime 이벤트 수신:', payload.eventType, payload);

					const summary = payload.new;

					// 현재 query 결과 가져오기
					const currentResult = await getSummaries({});

					if (payload.eventType === 'INSERT') {
						// INSERT는 맨 앞에 추가
						const exists = currentResult.summaries.some((s) => s.id === summary.id);
						if (!exists) {
							getSummaries({}).set({
								...currentResult,
								summaries: [summary, ...currentResult.summaries]
							});
							console.log('[SummaryList] INSERT 추가:', summary.url);
						}
					} else if (payload.eventType === 'UPDATE') {
						// UPDATE는 URL 또는 ID 기반으로 교체
						const index = currentResult.summaries.findIndex(
							(s) => s.id === summary.id || s.url === summary.url
						);

						if (index !== -1) {
							const updatedSummaries = [...currentResult.summaries];
							updatedSummaries[index] = summary;

							getSummaries({}).set({
								...currentResult,
								summaries: updatedSummaries
							});
							console.log('[SummaryList] UPDATE 교체:', summary.url);
						}
					}
				}
			)
			.subscribe((status, err) => {
				if (err) console.error('[SummaryList] 구독 에러:', status, err);
			});

		return () => {
			console.log('[SummaryList] Realtime 구독 해제');
			channel.unsubscribe();
		};
	});
</script>

<section aria-labelledby="summaries-title" class="space-y-4">
	{#if summaries.length === 0}
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
					{#each summaries as summary (summary.url)}
						<tr class="border-b border-surface-200-800 hover:opacity-80">
							<td class="px-4 py-3">
								<a href={localizeHref(`/summaries/${summary.id}/`)} class="flex items-center gap-3">
									<div class="flex items-center gap-2">
										<div
											class="w-2 h-2 rounded-full {summary.processing_status === 'pending'
												? 'bg-warning-500 animate-pulse'
												: summary.processing_status === 'processing'
													? 'bg-primary-500 animate-pulse'
													: summary.processing_status === 'failed'
														? 'bg-error-500'
														: 'bg-success-500'}">
										</div>
										{#if summary.processing_status === 'pending'}
											<span class="text-xs text-warning-500">대기 중</span>
										{:else if summary.processing_status === 'processing'}
											<span class="text-xs text-primary-500">처리 중</span>
										{:else if summary.processing_status === 'failed'}
											<span class="text-xs text-error-500">실패</span>
										{/if}
									</div>
									{#if summary.thumbnail_url}
										<img
											src={summary.thumbnail_url}
											alt=""
											width="80"
											height="45"
											loading="lazy"
											class="rounded object-cover aspect-video" />
									{:else}
										<div class="w-20 h-[45px] rounded bg-surface-200-800 animate-pulse"></div>
									{/if}
									<p class="font-medium text-surface-900-100 truncate">
										{summary.title || '제목 없음'}
									</p>
								</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Sentinel (무한 스크롤 트리거) -->
		{#if hasMore}
			<div bind:this={sentinel} class="mt-8 flex h-20 items-center justify-center">
				{#if isLoadingMore}
					<div class="animate-pulse text-surface-400">로딩 중...</div>
				{:else}
					<div class="text-surface-400">스크롤하여 더 보기</div>
				{/if}
			</div>
		{:else}
			<div class="mt-8 py-8 text-center text-surface-400">모든 항목을 불러왔습니다</div>
		{/if}
	{/if}
</section>
