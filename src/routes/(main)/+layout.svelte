<script lang="ts">
	import { onNavigate } from '$app/navigation';
	import Header from '$lib/components/Header.svelte';
	import SummaryForm from '$lib/components/SummaryForm.svelte';

	let { children } = $props();

	onNavigate((navigation) => {
		if (!document.startViewTransition) return;

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

<Header />

<main class="container mx-auto px-4 py-8 max-w-5xl space-y-6">
	<SummaryForm />
	{@render children()}
</main>
