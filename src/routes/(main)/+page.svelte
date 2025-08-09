<script>
	import SummaryHero from '$lib/components/SummaryHero.svelte';
	import SummaryForm from '$lib/components/SummaryForm.svelte';
	import SummaryList from '$lib/components/SummaryList.svelte';
</script>

<main class="container mx-auto px-4 py-12 md:py-20">
	<!-- 히어로 섹션 -->
	<SummaryHero />

	<!-- 폼 섹션 -->
	<SummaryForm />

	<!-- 결과 리스트 섹션 -->
	<SummaryList />
</main>
