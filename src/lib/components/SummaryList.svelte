<!-- 요약 결과 리스트 컴포넌트 -->
<script>
	import { page } from '$app/state';

	// limit prop - 0은 무제한, 기본값 3
	let { limit = 3 } = $props();

	// limit에 따라 표시할 요약 개수 결정
	let summaries = $derived(
		limit === 0 
			? page.data.summaries 
			: page.data.summaries?.slice(0, limit)
	);

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
		return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
	}
</script>

<section aria-labelledby="summaries-title" class="mt-24 space-y-8">
	{#if summaries?.length === 0}
		<div class="text-center py-12">
			<p class="text-xl font-semibold text-surface-600 dark:text-surface-400">아직 요약된 영상이 없습니다</p>
			<p class="mt-2 text-surface-500">첫 번째 유튜브 영상을 입력해 보세요!</p>
		</div>
	{:else}
		<h2 id="summaries-title" class="text-3xl font-bold text-center">
			요약 결과
		</h2>
		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
			{#each summaries as summary (summary.id)}
				<article class="card preset-tonal-surface p-6 hover:preset-elevated transition-all">
					<a href="/summary/{summary.id}/" class="space-y-3">
						<!-- 썸네일 -->
						<div class="relative overflow-hidden rounded-lg">
							<img
								src={extractThumbnail(summary.url)}
								alt="썸네일"
								class="aspect-video w-full object-cover" />
							<span class="badge preset-filled-primary-500 absolute top-2 right-2">요약 완료</span>
						</div>
						
						<h3 class="text-xl font-semibold line-clamp-2">
							{summary.title}
						</h3>
						<p class="text-surface-600 dark:text-surface-400 line-clamp-3">
							{summary.summary}
						</p>
						<div class="btn preset-tonal-primary w-full">
							상세 보기 →
						</div>
					</a>
				</article>
			{/each}
		</div>
	{/if}
</section>