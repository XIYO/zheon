<script lang="ts">
	let { videoId }: { videoId: string } = $props();
</script>

<iframe
	src="https://www.youtube.com/embed/{videoId}"
	title="YouTube video player"
	allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
	referrerpolicy="strict-origin-when-cross-origin"
	allowfullscreen
	class="w-full aspect-video rounded-xl">
</iframe>
