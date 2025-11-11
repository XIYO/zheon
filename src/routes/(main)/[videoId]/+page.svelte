<script>
	import { page } from '$app/state';
	import SummaryDetail from '$lib/components/SummaryDetail.svelte';
</script>

<SummaryDetail videoId={page.params.videoId} />
