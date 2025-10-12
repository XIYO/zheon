<script>
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';

	let { data } = $props();
	let syncing = $state(false);
	let syncResult = $state(null);

	function formatTimeAgo(dateString) {
		if (!dateString) return '동기화 필요';

		const date = new Date(dateString);
		const now = new Date();
		const diff = now - date;

		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);

		if (minutes < 1) return '방금 전';
		if (minutes < 60) return `${minutes}분 전`;
		if (hours < 24) return `${hours}시간 전`;
		return `${days}일 전`;
	}

	// 클라이언트에서 직접 동기화
	async function handleSync() {
		syncing = true;
		syncResult = null;

		try {
			// data에서 supabase 가져오기
			const { supabase } = data;

			// 세션 확인
			const { data: { session }, error: sessionError } = await supabase.auth.getSession();

			console.log('🔍 Session check:', {
				hasSession: !!session,
				userId: session?.user?.id,
				provider: session?.user?.app_metadata?.provider,
				hasProviderToken: !!session?.provider_token,
				sessionError
			});

			if (!session) {
				syncResult = { error: '로그인이 필요합니다' };
				return;
			}

			if (!session.provider_token) {
				console.error('❌ No provider_token in session');
				syncResult = { error: 'Google 재인증이 필요합니다. 다시 로그인해주세요.' };
				return;
			}

			console.log('📤 Calling Edge Function with provider_token...');

			// Edge Function 호출 (provider_token을 body로 전달)
			const { data: result, error } = await supabase.functions.invoke(
				'sync-youtube-subscriptions',
				{
					body: {
						providerToken: session.provider_token,
						userId: session.user.id
					}
				}
			);

			if (error) {
				console.error('❌ Sync error:', error);
				syncResult = { error: error.message || '동기화 실패' };
			} else {
				console.log('✅ Sync success:', result);
				syncResult = result;
				// 페이지 데이터 새로고침
				await invalidateAll();
			}
		} catch (err) {
			console.error('❌ Sync failed:', err);
			syncResult = { error: err.message || '동기화 중 오류 발생' };
		} finally {
			syncing = false;
		}
	}

	// 테스트 함수
	async function testSession() {
		const { supabase } = data;
		const { data: { session } } = await supabase.auth.getSession();

		console.log('=== Session Test Results ===');
		console.log('Session:', session);
		console.log('User ID:', session?.user?.id);
		console.log('Email:', session?.user?.email);
		console.log('Provider:', session?.user?.app_metadata?.provider);
		console.log('Provider Token:', session?.provider_token);
		console.log('Provider Refresh Token:', session?.provider_refresh_token);
		console.log('Access Token:', session?.access_token);
		console.log('========================');

		alert(`Session Test Complete! Check console for details.
Provider Token: ${session?.provider_token ? 'EXISTS' : 'MISSING'}
Provider: ${session?.user?.app_metadata?.provider || 'NONE'}`);
	}
</script>

<div class="container mx-auto px-4 py-12">
	<!-- 페이지 헤더 + 동기화 버튼 -->
	<div class="mb-12 flex items-start justify-between">
		<div>
			<h1 class="text-xl font-bold mb-4">YouTube 구독 채널</h1>
			<p class="text-surface-400-600">
				총 {data.totalChannels}개 채널 구독 중
			</p>
		</div>

		<div class="text-right">
			{#if data.lastSync}
				<p class="mb-2 text-sm text-surface-400-600">
					마지막 동기화: {formatTimeAgo(data.lastSync)}
					{#if data.apiUnitsUsed > 0}
						<span class="ml-2">(API {data.apiUnitsUsed} units)</span>
					{/if}
				</p>
			{/if}

			<div class="flex gap-2 justify-end">
				<!-- 테스트 버튼 -->
				<button
					onclick={testSession}
					class="btn preset-outlined"
				>
					🔍 세션 테스트
				</button>

				<!-- 동기화 버튼 -->
				<button
					onclick={handleSync}
					class="btn preset-filled-primary min-w-32"
					disabled={syncing}
				>
					{#if syncing}
						<span class="animate-spin">🔄</span> 동기화 중...
					{:else}
						🔄 동기화
					{/if}
				</button>
			</div>

			{#if syncResult}
				<div class="mt-2 text-sm">
					{#if syncResult.error}
						<p class="text-red-500">❌ {syncResult.error}</p>
					{:else}
						<p class="text-green-500">
							✅ {syncResult.channels_synced}개 채널 동기화 완료
						</p>
						<p class="text-surface-400-600">
							API {syncResult.api_units_used} units 사용
						</p>
					{/if}
				</div>
			{/if}
		</div>
	</div>

	<!-- 구독 채널 목록 -->
	{#if data.channels && data.channels.length > 0}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			{#each data.channels as channel}
				<a
					href="/youtube/channel/{channel.channel_id}"
					class="preset-outlined-surface group flex overflow-hidden rounded-xl transition-all hover:scale-[1.02]"
				>
					<!-- 채널 프로필 이미지 -->
					<div class="aspect-square w-32 flex-shrink-0 overflow-hidden bg-surface-800">
						{#if channel.channel_avatar}
							<img
								src={channel.channel_avatar}
								alt={channel.channel_name}
								class="h-full w-full object-cover"
								loading="lazy"
							/>
						{:else}
							<div class="flex h-full w-full items-center justify-center">
								<span class="text-4xl">📺</span>
							</div>
						{/if}
					</div>

					<!-- 채널 정보 -->
					<div class="flex flex-1 flex-col justify-center p-4">
						<h3 class="font-semibold mb-1 truncate">
							{channel.channel_name}
						</h3>

						{#if channel.channel_handle}
							<p class="text-surface-400-600 mb-1">
								{channel.channel_handle}
							</p>
						{/if}

						<div class="flex gap-3 text-xs text-surface-400-600">
							{#if channel.subscriber_count}
								<span>👥 {channel.subscriber_count}</span>
							{/if}
							{#if channel.video_count}
								<span>📹 {channel.video_count}개</span>
							{/if}
						</div>

						{#if channel.description}
							<p class="line-clamp-2 text-surface-400-600 mt-2">
								{channel.description}
							</p>
						{/if}
					</div>
				</a>
			{/each}
		</div>
	{:else if syncing}
		<div class="preset-outlined-surface rounded-xl p-12 text-center">
			<div class="animate-spin text-4xl mb-4">🔄</div>
			<p class="text-surface-400-600">채널 목록을 동기화하는 중...</p>
		</div>
	{:else}
		<div class="preset-outlined-surface rounded-xl p-12 text-center">
			<p class="text-surface-400-600 mb-4">구독 중인 채널이 없습니다</p>
			<p class="text-surface-400-600">
				상단의 동기화 버튼을 눌러 YouTube 구독 목록을 가져오세요
			</p>
		</div>
	{/if}
</div>