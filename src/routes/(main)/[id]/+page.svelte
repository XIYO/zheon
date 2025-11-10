<script>
	import { page } from '$app/state';
	import SummaryDetail from '$lib/components/SummaryDetail.svelte';
</script>

<SummaryDetail id={page.params.id} />
