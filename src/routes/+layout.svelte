<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import { createSummaryStore } from '$lib/stores/summary.svelte';
	import VersionDisplay from '$lib/components/VersionDisplay.svelte';
	import { Tooltip } from 'bits-ui';

	let { data, children } = $props();

	const { subscribe } = createSummaryStore();

	onMount(() => {
		const unsubscribe = subscribe(data.supabase);
		return unsubscribe;
	});

	onMount(() => {
		const {
			data: { subscription }
		} = data.supabase.auth.onAuthStateChange((event) => {
			if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
				invalidate('supabase:auth');
			}
		});

		return () => subscription.unsubscribe();
	});
</script>

<Tooltip.Provider>
	{@render children()}
	<VersionDisplay />
</Tooltip.Provider>
