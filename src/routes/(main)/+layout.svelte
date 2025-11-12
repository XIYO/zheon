<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import SummaryForm from '$lib/components/SummaryForm.svelte';

	let { children } = $props();
</script>

<Header />

<main class="container mx-auto px-4 py-8 max-w-5xl space-y-6">
	<SummaryForm />
	{@render children()}
</main>
