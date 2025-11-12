<script lang="ts">
	import SummaryTitle from './SummaryTitle.svelte';
	import YouTubePlayer from './YouTubePlayer.svelte';
	import SummaryCategories from './SummaryCategories.svelte';
	import SummaryTags from './SummaryTags.svelte';
	import ContentAnalysis from './ContentAnalysis.svelte';
	import SummarySummary from './SummarySummary.svelte';
	import CommunitySummary from './CommunitySummary.svelte';

	let { videoId } = $props();
</script>

<main class="container mx-auto px-4 pb-12 max-w-7xl">
	<SummaryTitle {videoId} />

	<section class="mb-8 space-y-8">
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
			<YouTubePlayer {videoId} />

			<div class="space-y-6">
				<SummaryCategories {videoId} />
				<SummaryTags {videoId} />
			</div>
		</div>

		<ContentAnalysis {videoId} />
	</section>

	<SummarySummary {videoId} />

	<CommunitySummary {videoId} />
</main>
