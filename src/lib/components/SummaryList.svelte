<!-- 요약 결과 리스트 컴포넌트 -->
<script>
	import { page } from '$app/state';
	import { getSummaries } from '$lib/remote/getSummaries.remote';

	const { supabase } = page.data;

	let query = getSummaries({});
	let queryResult = $derived(await query);

	// 무한 스크롤 상태
	let summaries = $state([]);
	let nextCursor = $state(null);
	let hasMore = $state(false);
	let isLoadingMore = $state(false);
	let sentinel = $state(null);

	// 쿼리 결과가 변경되면 로컬 상태 동기화
	$effect(() => {
		summaries = queryResult.summaries;
		nextCursor = queryResult.nextCursor;
		hasMore = queryResult.hasMore;
	});

	// 더 불러오기 함수
	async function loadMore() {
		if (!hasMore || isLoadingMore) return;

		isLoadingMore = true;
		const result = await getSummaries({ cursor: nextCursor });

		summaries = [...summaries, ...result.summaries];
		nextCursor = result.nextCursor;
		hasMore = result.hasMore;
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
				rootMargin: '800px'
			}
		);

		observer.observe(sentinel);

		return () => observer.disconnect();
	});

	let hasPending = $derived(
		summaries.some((s) => ['pending', 'processing'].includes(s.processing_status))
	);

	// Realtime updates
	$effect.pre(() => {
		$inspect('hasPending', hasPending);

		if (!hasPending) {
			console.log('[SummaryList] pending/processing 상태 없음, 구독 안 함');
			return;
		}

		console.log('[SummaryList] Realtime 구독 시작');
		const channel = supabase
			.channel('summary-updates')
			.on(
				'postgres_changes',
				{
					event: 'UPDATE',
					schema: 'public',
					table: 'summary'
				},
				(payload) => {
					console.log('[SummaryList] Realtime UPDATE 이벤트 수신:', payload);

					// payload.new에서 업데이트된 summary 가져오기
					const updatedSummary = payload.new;

					// 배열에서 url을 키로 찾아서 업데이트
					const index = summaries.findIndex(s => s.url === updatedSummary.url);
					if (index !== -1) {
						summaries[index] = updatedSummary;
						console.log('[SummaryList] 배열 업데이트 완료:', updatedSummary);
					}
				}
			)
			.subscribe((status, err) => {
				console.log('[SummaryList] 구독 상태:', status, err);
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
							<a href="/summaries/{summary.id}/" class="flex items-center gap-3">
								<div class="w-2 h-2 rounded-full {summary.processing_status === 'pending' ? 'bg-warning-500 animate-pulse' :
									summary.processing_status === 'processing' ? 'bg-primary-500 animate-pulse' :
									summary.processing_status === 'failed' ? 'bg-error-500' :
									'bg-success-500'}"></div>
								{#if summary.thumbnail_url}
								<img
									src={summary.thumbnail_url}
									alt=""
									width="80"
									height="45"
									loading="lazy"
									class="rounded object-cover aspect-video"
								/>
							{:else}
								<div
									class="w-20 h-[45px] rounded bg-surface-200-800 animate-pulse"
								></div>
							{/if}
								<p class="font-medium text-surface-900-100 truncate">
									{summary.title}
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
			<div class="mt-8 py-8 text-center text-surface-400">
				모든 항목을 불러왔습니다
			</div>
		{/if}
	{/if}
</section>
