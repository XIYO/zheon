<script>
	import SummaryForm from '$lib/components/SummaryForm.svelte';
	import SummaryList from '$lib/components/SummaryList.svelte';
</script>

<main class="container mx-auto space-y-8 py-8">
	<!-- 폼 섹션 -->
	<SummaryForm />

	<!-- 결과 리스트 섹션 -->
	<SummaryList />
</main>
