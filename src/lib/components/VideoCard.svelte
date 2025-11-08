<script lang="ts">
	/**
	 * @typedef {Object} Video
	 * @property {string} video_id
	 * @property {string} title
	 * @property {string} [thumbnail_url]
	 * @property {string} [duration]
	 * @property {string} [view_count]
	 * @property {string} [published_at]
	 */

	/**
	 * @type {{ video?: Video }}
	 */
	let { video } = $props();
</script>

{#if video}
	<!-- 실제 비디오 데이터 -->
	<form method="POST" action="/youtube/summary" class="group">
		<input type="hidden" name="youtubeUrl" value="https://youtube.com/watch?v={video.video_id}" />
		<button
			type="submit"
			class="preset-outlined-surface block w-full overflow-hidden rounded-xl text-left transition-all hover:scale-[1.02]">
			<!-- 썸네일 -->
			<div class="aspect-video w-full overflow-hidden bg-surface-800 relative">
				{#if video.thumbnail_url}
					<img
						src={video.thumbnail_url}
						alt={video.title}
						class="h-full w-full object-cover"
						loading="lazy" />
				{:else}
					<div class="flex h-full w-full items-center justify-center bg-surface-700">
						<span class="text-sm text-surface-400">썸네일 없음</span>
					</div>
				{/if}
				{#if video.duration}
					<span class="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-1 text-xs text-white">
						{video.duration}
					</span>
				{/if}
				<div
					class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
					<span class="font-semibold text-white">요약 시작</span>
				</div>
			</div>

			<!-- 영상 정보 -->
			<div class="p-4">
				<h3 class="font-semibold mb-2 line-clamp-2">
					{video.title}
				</h3>
				<div class="flex justify-between text-sm text-surface-400-600">
					{#if video.published_at}
						<span>{video.published_at}</span>
					{/if}
					{#if video.view_count}
						<span>{video.view_count}</span>
					{/if}
				</div>
			</div>
		</button>
	</form>
{:else}
	<!-- 스켈레톤 -->
	<div class="preset-outlined-surface overflow-hidden rounded-xl animate-pulse">
		<!-- 썸네일 스켈레톤 -->
		<div class="aspect-video w-full bg-surface-200-800"></div>

		<!-- 정보 스켈레톤 -->
		<div class="p-4 space-y-2">
			<div class="h-5 bg-surface-200-800 rounded w-full"></div>
			<div class="h-5 bg-surface-200-800 rounded w-3/4"></div>
			<div class="flex justify-between">
				<div class="h-4 bg-surface-200-800 rounded w-20"></div>
				<div class="h-4 bg-surface-200-800 rounded w-16"></div>
			</div>
		</div>
	</div>
{/if}
