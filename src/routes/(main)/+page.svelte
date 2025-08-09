<script>
	import { page } from '$app/state';
	import SummaryHero from '$lib/components/SummaryHero.svelte';
	import SummaryForm from '$lib/components/SummaryForm.svelte';
	import SummaryList from '$lib/components/SummaryList.svelte';
</script>

<main class="container mx-auto space-y-8 py-8">
	<!-- 히어로 섹션 -->
	<SummaryHero />

	<!-- 폼 섹션 - 로그인한 사용자에게만 표시 -->
	{#if page.data.user}
		<SummaryForm />
	{/if}

	<!-- 결과 리스트 섹션 -->
	<SummaryList />
</main>
