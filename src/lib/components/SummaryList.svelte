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

<section aria-labelledby="summaries-title" class="space-y-4">
	{#if summaries?.length === 0}
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
				{#each summaries as summary (summary.id)}
					<tr class="border-b border-surface-200-800 hover:opacity-80">
						<td class="px-4 py-3">
							<a href="/summaries/{summary.id}/" class="flex items-center gap-3">
								{#if summary.processing_status === 'pending'}
									<div class="w-2 h-2 rounded-full bg-warning-500 animate-pulse"></div>
								{:else if summary.processing_status === 'processing'}
									<div class="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></div>
								{:else if summary.processing_status === 'failed'}
									<div class="w-2 h-2 rounded-full bg-error-500"></div>
								{:else}
									<div class="w-2 h-2 rounded-full bg-success-500"></div>
								{/if}
								<img
									src={extractThumbnail(summary.url)}
									alt=""
									width="80"
									height="45"
									loading="lazy"
									class="rounded object-cover aspect-video" />
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
	{/if}
</section>
