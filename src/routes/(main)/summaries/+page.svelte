<script>
	import SummaryList from '$lib/components/SummaryList.svelte';

	let { data } = $props();
</script>

<div class="container mx-auto px-4 py-8 max-w-7xl">
	<!-- 요약 리스트 - 100개 표시 -->
	<SummaryList pageSize={100} />
</div>
