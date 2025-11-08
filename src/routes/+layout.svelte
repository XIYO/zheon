<script lang="ts">
	import '../app.css';
	import { invalidate } from '$app/navigation';

	let { data, children } = $props();
	let { session, supabase } = $derived(data);

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
