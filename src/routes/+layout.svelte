<script lang="ts">
	import '../app.css';
	import { invalidate } from '$app/navigation';
	import { createSummaryStore } from '$lib/stores/summary.svelte';
	import { setContext } from 'svelte';

	let { data, children } = $props();
	let { session, supabase } = $derived(data);

	const summaryStore = createSummaryStore(supabase);
	setContext('summaryStore', summaryStore);

	$effect.pre(() => {
		const { data } = supabase.auth.onAuthStateChange((_, newSession) => {
			if (newSession?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth');
			}
		});

		return () => data.subscription.unsubscribe();
	});
</script>

{@render children()}
