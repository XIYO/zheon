<script>
	import { Avatar } from '@skeletonlabs/skeleton-svelte';
	import { resolve } from '$app/paths';

	/**
	 * @typedef {Object} Channel
	 * @property {string} channel_id
	 * @property {string} title
	 * @property {string} [thumbnail_url]
	 * @property {string} [custom_url]
	 * @property {string|number} [subscriber_count]
	 * @property {number} [video_count]
	 * @property {string} [description]
	 */

	/**
	 * @type {{ channel?: Channel }}
	 */
	let { channel } = $props();
</script>

<div class="channel-card-container">
	{#if channel}
		<!-- 실제 채널 데이터 -->
		<a
			href={resolve('/youtube/channel/[channel_id]', { channel_id: channel.channel_id })}
			class="preset-outlined-surface group flex overflow-hidden rounded-xl hover:preset-filled-surface-500 transition-colors">
			<div class="content-center-safe p-4">
				<Avatar>
					<Avatar.Image src={channel.thumbnail_url} alt={channel.title} />
				</Avatar>
			</div>

			<div class="flex flex-1 flex-col justify-center p-4 pl-0 min-w-0">
				<h3 class="font-semibold mb-1 truncate">
					{channel.title}
				</h3>

				{#if channel.custom_url}
					<p class="text-sm text-surface-600-400 mb-2 truncate">
						{channel.custom_url}
					</p>
				{/if}

				<div class="flex gap-3 text-xs text-surface-600-400 mb-2">
					<span class="inline-flex items-center gap-1" title="구독자 수">
						구독자 {channel.subscriber_count || 0}명
					</span>
					{#if channel.video_count}
						<span class="inline-flex items-center gap-1" title="영상 개수">
							영상 {channel.video_count}개
						</span>
					{/if}
				</div>

				<p class="line-clamp-2 text-sm text-surface-700-300 description">
					{channel.description || '설명 없음'}
				</p>
			</div>
		</a>
	{:else}
		<!-- 스켈레톤 -->
		<div class="preset-outlined-surface flex overflow-hidden rounded-xl animate-pulse">
			<div class="content-center-safe p-4">
				<div class="w-12 h-12 bg-surface-200-800 rounded-full"></div>
			</div>

			<div class="flex flex-1 flex-col justify-center p-4 pl-0 gap-2 min-w-0">
				<div class="h-5 bg-surface-200-800 rounded w-3/4"></div>
				<div class="h-4 bg-surface-200-800 rounded w-1/2"></div>
				<div class="h-3 bg-surface-200-800 rounded w-full"></div>
				<div class="h-3 bg-surface-200-800 rounded w-full"></div>
			</div>
		</div>
	{/if}
</div>

<style>
	.channel-card-container {
		container-type: inline-size;
	}

	/* 좁은 컨테이너: 세로 레이아웃 */
	@container (max-width: 300px) {
		.channel-card-container :global(a),
		.channel-card-container > div {
			flex-direction: column;
			text-align: center;
		}

		.channel-card-container :global(.content-center-safe) {
			padding-bottom: 0;
		}

		.channel-card-container .description {
			display: none;
		}
	}

	/* 넓은 컨테이너: 가로 레이아웃 (기본) */
	@container (min-width: 301px) {
		.channel-card-container :global(a),
		.channel-card-container > div {
			flex-direction: row;
		}
	}
</style>
