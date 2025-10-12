<script>
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();
	let refreshing = $state(false);
	let refreshResult = $state(null);

	function formatTimeAgo(dateString) {
		if (!dateString) return '';

		const date = new Date(dateString);
		const now = new Date();
		const diff = now - date;

		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);

		if (minutes < 1) return '방금 전 업데이트';
		if (minutes < 60) return `${minutes}분 전 업데이트`;
		if (hours < 24) return `${hours}시간 전 업데이트`;
		return `${days}일 전 업데이트`;
	}
</script>

<div class="container mx-auto px-4 py-12">
	<!-- 채널 헤더 -->
	{#if data.channel}
		<div class="mb-8 flex items-start justify-between">
			<div class="flex gap-6">
				{#if data.channel.channel_avatar}
					<img
						src={data.channel.channel_avatar}
						alt={data.channel.channel_name}
						class="h-24 w-24 rounded-full object-cover"
					/>
				{/if}
				<div>
					<h1 class="text-xl font-bold mb-2">{data.channel.channel_name}</h1>
					{#if data.channel.channel_handle}
						<p class="text-surface-400-600">{data.channel.channel_handle}</p>
					{/if}
					<div class="mt-2 flex gap-4 text-sm text-surface-400-600">
						{#if data.channel.subscriber_count}
							<span>👥 구독자 {data.channel.subscriber_count}</span>
						{/if}
						{#if data.channel.video_count}
							<span>📹 동영상 {data.channel.video_count}개</span>
						{/if}
					</div>
				</div>
			</div>

			<div class="text-right">
				{#if data.lastUpdated}
					<p class="mb-2 text-sm text-surface-400-600">
						{formatTimeAgo(data.lastUpdated)}
					</p>
				{/if}

				<form
					method="POST"
					action="?/refreshChannel"
					use:enhance={() => {
						refreshing = true;
						refreshResult = null;

						return async ({ result }) => {
							refreshing = false;

							if (result.type === 'success' && result.data?.success) {
								refreshResult = result.data;
								await invalidateAll();
							} else if (result.type === 'success' && !result.data?.success) {
								refreshResult = { error: result.data?.error || '새로고침 실패' };
							}
						};
					}}
				>
					<button
						type="submit"
						class="btn preset-outlined min-w-32"
						disabled={refreshing}
					>
						{#if refreshing}
							<span class="animate-spin">🔄</span> 새로고침 중...
						{:else}
							🔄 영상 목록 새로고침
						{/if}
					</button>
				</form>

				{#if refreshResult}
					<div class="mt-2 text-sm">
						{#if refreshResult.error}
							<p class="text-red-500">❌ {refreshResult.error}</p>
						{:else}
							<p class="text-green-500">
								✅ {refreshResult.videosCount}개 영상 업데이트
							</p>
						{/if}
					</div>
				{/if}
			</div>
		</div>

		{#if data.channel.description}
			<div class="mb-8 rounded-lg bg-surface-100 p-4 dark:bg-surface-800">
				<p class="text-surface-600 dark:text-surface-300">
					{data.channel.description}
				</p>
			</div>
		{/if}
	{:else}
		<div class="mb-8">
			<h1 class="text-xl font-bold mb-4">채널 정보 없음</h1>
			<p class="text-surface-400-600">
				새로고침 버튼을 눌러 채널 정보를 가져오세요
			</p>

			<form
				method="POST"
				action="?/refreshChannel"
				use:enhance={() => {
					refreshing = true;

					return async ({ result }) => {
						refreshing = false;
						if (result.type === 'success' && result.data?.success) {
							await invalidateAll();
						}
					};
				}}
				class="mt-4"
			>
				<button
					type="submit"
					class="btn preset-filled-primary"
					disabled={refreshing}
				>
					{#if refreshing}
						<span class="animate-spin">🔄</span> 채널 정보 가져오는 중...
					{:else}
						채널 정보 가져오기
					{/if}
				</button>
			</form>
		</div>
	{/if}

	<!-- 영상 목록 -->
	<div class="mb-4">
		<h2 class="text-xl font-bold">최신 영상</h2>
	</div>

	{#if data.videos && data.videos.length > 0}
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each data.videos as video}
				<form method="POST" action="/youtube/summary" class="group">
					<input type="hidden" name="youtubeUrl" value="https://youtube.com/watch?v={video.video_id}" />
					<button
						type="submit"
						class="preset-outlined-surface block w-full overflow-hidden rounded-xl text-left transition-all hover:scale-[1.02]"
					>
						<!-- 썸네일 -->
						<div class="aspect-video w-full overflow-hidden bg-surface-800">
							{#if video.thumbnail_url}
								<img
									src={video.thumbnail_url}
									alt={video.title}
									class="h-full w-full object-cover"
									loading="lazy"
								/>
							{:else}
								<div class="flex h-full w-full items-center justify-center">
									<span class="text-4xl">🎬</span>
								</div>
							{/if}
							{#if video.duration}
								<span class="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-1 text-xs text-white">
									{video.duration}
								</span>
							{/if}
							<div class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
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
			{/each}
		</div>
	{:else if refreshing}
		<div class="preset-outlined-surface rounded-xl p-12 text-center">
			<div class="animate-spin text-4xl mb-4">🔄</div>
			<p class="text-surface-400-600">영상 목록을 가져오는 중...</p>
		</div>
	{:else}
		<div class="preset-outlined-surface rounded-xl p-12 text-center">
			<p class="text-surface-400-600">
				{#if data.channel}
					아직 영상 목록이 없습니다. 새로고침 버튼을 눌러주세요.
				{:else}
					먼저 채널 정보를 가져와주세요.
				{/if}
			</p>
		</div>
	{/if}
</div>
