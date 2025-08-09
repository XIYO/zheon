<script>
	let { data } = $props();
	let summary = $derived(data.summary);

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

	function extractThumbnail(url) {
		const id = extractYoutubeId(url);
		return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
	}

	function formatDate(dateString) {
		return new Date(dateString).toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="container mx-auto px-4 py-12 max-w-4xl">
	<!-- 썸네일 -->
	<a href={summary.url} target="_blank" rel="noopener noreferrer">
		<img
			src={extractThumbnail(summary.url).replace('hqdefault', 'maxresdefault')}
			alt={summary.title}
			class="w-full rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300" />
	</a>

	<!-- 제목과 날짜 -->
	<div class="mt-8 mb-12">
		<h1 class="text-3xl font-bold mb-2">{summary.title}</h1>
		<p class="text-sm text-surface-600 dark:text-surface-400">
			{formatDate(summary.created_at)}
		</p>
	</div>

	<!-- AI 요약 -->
	<div class="bg-white dark:bg-surface-800 rounded-xl p-6 mb-8">
		<h2 class="text-xl font-semibold mb-4">AI 요약</h2>
		<p class="text-surface-700 dark:text-surface-300 leading-relaxed whitespace-pre-wrap">
			{summary.summary}
		</p>
	</div>
	
	<!-- 핵심 인사이트 (content 필드에 인사이트가 있는 경우) -->
	{#if summary.content && summary.content !== summary.summary}
		<div class="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-xl p-6">
			<h2 class="text-xl font-semibold mb-4">핵심 인사이트</h2>
			<div class="text-surface-700 dark:text-surface-300 leading-relaxed whitespace-pre-wrap">
				{summary.content}
			</div>
		</div>
	{/if}
</div>
