<script>
	import { syncSubscriptionsCommand } from '$lib/remote/subscription.remote.js';

	let isRunning = $state(false);
	let result = $state(null);

	async function runTest() {
		isRunning = true;
		result = null;

		try {
			const startTime = Date.now();
			const data = await syncSubscriptionsCommand();
			const endTime = Date.now();

			result = {
				success: true,
				...data,
				clientTotalTimeMs: endTime - startTime
			};
		} catch (err) {
			result = {
				success: false,
				error: err.message || String(err)
			};
		} finally {
			isRunning = false;
		}
	}
</script>

<div class="container mx-auto max-w-4xl p-8">
	<h1 class="mb-8 text-3xl font-bold">YouTube 구독 동기화 + 비디오 동기화 테스트</h1>

	<div class="mb-8 rounded-lg border border-yellow-500 bg-yellow-50 p-4">
		<h2 class="mb-2 font-semibold text-yellow-800">테스트 내용</h2>
		<ul class="list-inside list-disc space-y-1 text-sm text-yellow-700">
			<li>구독 채널 목록을 YouTube API로 가져옴</li>
			<li>각 채널의 비디오 목록을 동시에 동기화 (CONCURRENCY = 10)</li>
			<li>성공/실패 개수 및 소요 시간 측정</li>
			<li>콘솔에서 상세 로그 확인 가능</li>
		</ul>
	</div>

	<button
		onclick={runTest}
		disabled={isRunning}
		class="mb-8 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
	>
		{isRunning ? '동기화 진행 중...' : '구독 동기화 + 비디오 동기화 시작'}
	</button>

	{#if result}
		<div class="rounded-lg border p-6 {result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}">
			<h2 class="mb-4 text-xl font-bold {result.success ? 'text-green-800' : 'text-red-800'}">
				{result.success ? '테스트 완료' : '테스트 실패'}
			</h2>

			{#if result.success}
				<div class="space-y-4">
					<div class="grid grid-cols-2 gap-4">
						<div class="rounded bg-white p-4">
							<div class="text-sm text-gray-600">동기화된 채널</div>
							<div class="text-2xl font-bold">{result.channelsSynced}개</div>
						</div>
						<div class="rounded bg-white p-4">
							<div class="text-sm text-gray-600">동기화된 구독</div>
							<div class="text-2xl font-bold">{result.subscriptionsSynced}개</div>
						</div>
					</div>

					{#if result.videoSyncResults}
						<div class="rounded border border-blue-300 bg-blue-50 p-4">
							<h3 class="mb-3 font-semibold text-blue-900">비디오 동기화 결과</h3>
							<div class="grid grid-cols-3 gap-4 mb-4">
								<div class="rounded bg-white p-3">
									<div class="text-sm text-gray-600">총 채널</div>
									<div class="text-xl font-bold">{result.videoSyncResults.total}개</div>
								</div>
								<div class="rounded bg-white p-3">
									<div class="text-sm text-green-600">성공</div>
									<div class="text-xl font-bold text-green-600">{result.videoSyncResults.succeeded}개</div>
								</div>
								<div class="rounded bg-white p-3">
									<div class="text-sm text-red-600">실패</div>
									<div class="text-xl font-bold text-red-600">{result.videoSyncResults.failed}개</div>
								</div>
							</div>

							<div class="grid grid-cols-2 gap-4">
								<div class="rounded bg-white p-3">
									<div class="text-sm text-gray-600">소요 시간</div>
									<div class="text-lg font-semibold">{(result.videoSyncResults.totalTimeMs / 1000).toFixed(2)}초</div>
								</div>
								<div class="rounded bg-white p-3">
									<div class="text-sm text-gray-600">동시 처리 수</div>
									<div class="text-lg font-semibold">{result.videoSyncResults.concurrency}개</div>
								</div>
							</div>

							{#if result.videoSyncResults.errors && result.videoSyncResults.errors.length > 0}
								<div class="mt-4 rounded bg-red-50 border border-red-200 p-3">
									<div class="mb-2 font-semibold text-red-800">에러 목록 (최대 10개)</div>
									<div class="space-y-2 max-h-60 overflow-y-auto">
										{#each result.videoSyncResults.errors.slice(0, 10) as err}
											<div class="rounded bg-white p-2 text-sm">
												<div class="font-mono text-xs text-gray-500 mb-1">채널 ID: {err.channelId}</div>
												<div class="font-mono text-red-600">{err.errorType}</div>
												<div class="text-gray-700 text-xs mt-1">{err.message}</div>
											</div>
										{/each}
									</div>
								</div>
							{/if}

							{#if result.videoSyncResults.failedChannelIds && result.videoSyncResults.failedChannelIds.length > 0}
								<div class="mt-4 rounded bg-orange-50 border border-orange-200 p-3">
									<div class="mb-2 font-semibold text-orange-800">실패한 채널 ID 목록</div>
									<div class="font-mono text-xs text-gray-700 max-h-40 overflow-y-auto whitespace-pre-wrap">
										{result.videoSyncResults.failedChannelIds.join('\n')}
									</div>
								</div>
							{/if}
						</div>
					{/if}

					<div class="rounded bg-white p-4">
						<div class="text-sm text-gray-600">클라이언트 총 소요 시간</div>
						<div class="text-lg font-semibold">{(result.clientTotalTimeMs / 1000).toFixed(2)}초</div>
					</div>

					<div class="rounded bg-blue-100 p-4">
						<p class="text-sm text-blue-800">
							<strong>참고:</strong> 브라우저 개발자 콘솔(F12)에서 더 상세한 로그를 확인할 수 있습니다.
						</p>
					</div>
				</div>
			{:else}
				<div class="rounded bg-white p-4">
					<div class="font-mono text-red-600">{result.error}</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
