<!-- 요약 결과 리스트 컴포넌트 -->
<script>
	import { page } from '$app/state';

	// limit prop - 0은 무제한, 기본값 3
	let { limit = 3 } = $props();

	// limit에 따라 표시할 요약 개수 결정
	let summaries = $derived(
		limit === 0 ? page.data.summaries : page.data.summaries?.slice(0, limit)
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
			{#if limit !== 0}
				<a href="/summaries" class="btn btn-sm variant-ghost-primary">
					전체 보기
					<svg class="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 5l7 7-7 7" />
					</svg>
				</a>
			{/if}
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
							<h3 class="text-2xl font-bold mb-3 line-clamp-2">
								{summary.title}
							</h3>
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
