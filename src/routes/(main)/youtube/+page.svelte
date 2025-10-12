<script>
	import { enhance } from '$app/forms';

	let { data } = $props();

	let channelPopover = $state(null);
	let isSubmitting = $state(false);

	function openChannelPopover() {
		channelPopover?.showPopover();
	}

	function closeChannelPopover() {
		channelPopover?.hidePopover();
	}

	// 간단한 form 제출
	function handleSubmit() {
		return async ({ formData }) => {
			const channelHandle = formData.get('channelHandle');
			if (!channelHandle) return;

			isSubmitting = true;
			closeChannelPopover();

			return async ({ result, update }) => {
				isSubmitting = false;
				if (result.type === 'failure') {
					alert(result.data?.error || '채널 추가에 실패했습니다');
				} else {
					// redirect 시 자동으로 페이지 새로고침됨
					await update();
				}
			};
		};
	}
</script>

<svelte:head>
	<title>추천 채널 - Zheon</title>
	<meta name="description" content="엄선된 YouTube 개발 채널 추천" />
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-7xl">
	<!-- 헤더 -->
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="h1 mb-2">추천 YouTube 채널</h1>
			<p class="text-surface-600-300-token">
				고품질 프로그래밍 및 웹 개발 콘텐츠를 제공하는 채널들입니다
			</p>
		</div>
		<button class="btn preset-filled-primary-500" onclick={openChannelPopover}>
			+ 채널 추가
		</button>
	</div>

	<!-- 채널 추가 Popover -->
	<div bind:this={channelPopover} popover="auto" class="popover-modal">
		<div class="popover-content card preset-filled-surface-50-900 p-6 max-w-md w-full">
			<div class="flex items-center justify-between mb-4">
				<h3 class="h3">채널 추가</h3>
				<button
					type="button"
					class="btn-icon preset-ghost-surface-500"
					onclick={closeChannelPopover}
					aria-label="닫기"
				>
					✕
				</button>
			</div>
			<form method="POST" action="?/addChannel" use:enhance={handleSubmit}>
				<label class="label mb-4">
					<span class="text-sm font-medium mb-2 block">YouTube 채널 핸들</span>
					<input
						type="text"
						name="channelHandle"
						placeholder="@channelname"
						class="input preset-outlined-surface-500 w-full"
						required
						autofocus
						disabled={isSubmitting}
					/>
					<span class="text-xs text-surface-600-300-token mt-1">예: @fireship, @ThePrimeagen</span>
				</label>
				<div class="flex gap-2 justify-end">
					<button type="button" class="btn preset-outlined-surface-500" onclick={closeChannelPopover} disabled={isSubmitting}>
						취소
					</button>
					<button type="submit" class="btn preset-filled-primary-500" disabled={isSubmitting}>
						{isSubmitting ? '추가 중...' : '추가'}
					</button>
				</div>
			</form>
		</div>
	</div>

	<!-- 채널 그리드 -->
	<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
		{#each data.channels as channel (channel.id)}
			{@const isLoading = channel.id.startsWith('temp-')}
			<a
				href={isLoading ? '#' : `/youtube/channel/${channel.id}`}
				class="card preset-filled-surface-50-900 hover:preset-filled-primary-500 transition-all duration-200 p-4 flex flex-col items-center text-center space-y-3"
				class:opacity-60={isLoading}
				class:pointer-events-none={isLoading}
			>
				<!-- 채널 썸네일 -->
				<div class="w-16 h-16 rounded-full overflow-hidden bg-surface-200-700-token flex items-center justify-center flex-shrink-0">
					{#if channel.thumbnail && !isLoading}
						<img src={channel.thumbnail} alt={channel.name} class="w-full h-full object-cover" />
					{:else}
						<!-- 썸네일 없을 때 placeholder -->
						<div class="placeholder-circle w-16 h-16 bg-surface-300-600-token" class:animate-pulse={isLoading}></div>
					{/if}
				</div>

				<!-- 채널 정보 -->
				<div class="space-y-1 min-w-0 w-full">
					<h3 class="font-bold text-sm truncate" class:animate-pulse={isLoading}>
						{channel.name}
					</h3>
					<p class="text-xs text-surface-600-300-token truncate" class:animate-pulse={isLoading}>
						{channel.handle}
					</p>
					{#if channel.description}
						<p class="text-xs text-surface-700-200-token line-clamp-2">
							{channel.description}
						</p>
					{/if}
				</div>
			</a>
		{/each}
	</div>

	<!-- 추가 정보 -->
	<div class="card preset-tonal-primary mt-8 p-4">
		<h2 class="font-bold text-lg mb-2">💡 Tip</h2>
		<p class="text-sm text-surface-700-200-token">
			위의 "채널 추가" 버튼을 클릭하여 원하는 YouTube 채널을 추가할 수 있습니다.
		</p>
	</div>
</div>

<style>
	.popover-modal {
		position: fixed;
		inset: 0;
		margin: auto;
		border: none;
		padding: 0;
		background: transparent;
		max-width: none;
		max-height: none;
		width: fit-content;
		height: fit-content;
		overflow: visible;
	}

	.popover-modal::backdrop {
		background-color: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
	}

	.popover-content {
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
		animation: popoverIn 0.2s ease-out;
	}

	@keyframes popoverIn {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
</style>
