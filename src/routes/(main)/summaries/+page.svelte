<script>
	import SummaryList from '$lib/components/SummaryList.svelte';

	let { data } = $props();
</script>

<div class="container mx-auto px-4 py-12">
	<!-- 페이지 헤더 -->
	<div class="mb-12 text-center">
		<h1 class="preset-typo-display-2 mb-4">
			{data.meta.title}
		</h1>
		<p class="preset-typo-subtitle text-surface-400-600">
			{data.meta.description}
		</p>
	</div>

	<!-- 요약 리스트 - limit=0으로 모든 항목 표시 -->
	<SummaryList limit={0} />
</div>
