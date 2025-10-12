<!-- 요약 결과 리스트 컴포넌트 -->
<script>
	import { page } from '$app/state';
	import { getRecentSummaries } from '$lib/remote/summary.remote.js';

	// ⭐ Query 구독 (자동 반응형)
	const query = getRecentSummaries();
	let summaries = $derived(query.current || []);

	// ⭐ Realtime 구독 (pending → completed 전환)
	$effect.pre(() => {
		const { supabase } = page.data;

		if (!supabase || !summaries) {
			console.log('⏸️ Realtime skip: supabase or summaries not ready');
			return;
		}

		const hasPending = summaries.some(
			(s) => s.processing_status === 'pending' || s.processing_status === 'processing'
		);

		if (!hasPending) {
			console.log('⏸️ Realtime skip: no pending summaries');
			return;
		}

		console.log('📡 Starting Realtime subscription...', {
			pendingCount: summaries.filter(s => s.processing_status === 'pending' || s.processing_status === 'processing').length
		});

		const channel = supabase
			.channel('summary-updates')
			.on(
				'postgres_changes',
				{
					event: 'UPDATE',
					schema: 'public',
					table: 'summary'
				},
				async (payload) => {
					console.log('📥 Realtime UPDATE received:', {
						id: payload.new.id,
						status: payload.new.processing_status,
						title: payload.new.title
					});

					// Query 다시 fetch
					await query.refresh();
					console.log('✅ Query refreshed after Realtime update');
				}
			)
			.subscribe((status, err) => {
				if (status === 'SUBSCRIBED') {
					console.log('✅ Realtime subscribed successfully');
				} else if (err) {
					console.error('❌ Realtime subscription error:', err);
				}
			});

		return () => {
			console.log('🔌 Unsubscribing from Realtime...');
			channel.unsubscribe();
		};
	});

	/** @param {string} url */
	function extractYoutubeId(url) {
		try {
			const parsedUrl = new URL(url);

			// youtu.be 형태 처리
			if (parsedUrl.hostname === 'youtu.be') {
				return parsedUrl.pathname.slice(1); // '/' 제거
			}

			// youtube.com 형태 처리
			if (parsedUrl.hostname.includes('youtube.com')) {
				return parsedUrl.searchParams.get('v') || '';
			}
		} catch {
			return '';
		}
		return '';
	}

	/** @param {string} url */
	function extractThumbnail(url) {
		const id = extractYoutubeId(url);
		return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : '';
	}
</script>

<section aria-labelledby="summaries-title" class="space-y-8">
	{#if summaries?.length === 0}
		<div class="text-center py-12">
			<p class="text-xl font-semibold text-surface-600 dark:text-surface-400">
				아직 정리된 인사이트가 없습니다
			</p>
			<p class="mt-2 text-surface-500">첫 번째 유튜브 영상을 입력해 보세요!</p>
		</div>
	{:else}
		<div class="flex items-center justify-between mb-6 max-w-6xl mx-auto">
			<h2 id="summaries-title" class="text-3xl font-bold">인사이트 목록</h2>
		</div>
		<div class="flex flex-col gap-4 max-w-6xl mx-auto">
			{#each summaries as summary (summary.id)}
				<article class="card-modern rounded-xl hover-lift overflow-hidden">
					<a href="/summaries/{summary.id}/" class="flex">
						<!-- 썸네일 (25%) -->
						<div class="w-1/4 flex-shrink-0">
							<img
								src={extractThumbnail(summary.url)}
								alt="썸네일"
								width="1280"
								height="720"
								loading="lazy"
								class="w-full h-full object-cover transition-opacity duration-700 opacity-100 starting:opacity-0"
								style="view-transition-name: summary-image-{summary.id}; aspect-ratio: 16/9" />
						</div>

						<!-- 내용 (75%) -->
						<div class="w-3/4 p-6 flex flex-col justify-center">
							<div class="flex items-center gap-2 mb-3">
								<h3 class="text-2xl font-bold line-clamp-2 flex-1">
									{summary.title}
								</h3>
								{#if summary.processing_status === 'pending'}
									<span
										class="preset-filled-warning-500 text-xs px-2 py-1 rounded-full whitespace-nowrap">
										대기 중
									</span>
								{:else if summary.processing_status === 'processing'}
									<span
										class="preset-filled-primary-500 text-xs px-2 py-1 rounded-full whitespace-nowrap">
										정리 중...
									</span>
								{:else if summary.processing_status === 'failed'}
									<span
										class="preset-filled-error-500 text-xs px-2 py-1 rounded-full whitespace-nowrap">
										실패
									</span>
								{/if}
							</div>
							<p
								class="text-surface-600 dark:text-surface-400 text-base line-clamp-3 leading-relaxed">
								{summary.summary}
							</p>
						</div>
					</a>
				</article>
			{/each}
		</div>
	{/if}
</section>
