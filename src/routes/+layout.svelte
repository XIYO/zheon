<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import { createSummaryStore } from '$lib/stores/summary.svelte';

	let { data, children } = $props();

	const { subscribe } = createSummaryStore();

	onMount(() => subscribe(data.supabase));

	onMount(() => {
		const { data: { subscription } } = data.supabase.auth.onAuthStateChange((event) => {
			if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
				invalidate('supabase:auth');
			}
		});

		return () => subscription.unsubscribe();
	});
</script>

{@render children()}
