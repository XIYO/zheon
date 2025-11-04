<script>
	import { collectTranscript, getTranscriptFromDB } from '$lib/remote/youtube/transcription.remote';
	import { useId } from 'bits-ui';

	let youtubeUrl = $state('');
	let videoId = $state('');
	let transcript = $state(null);
	let collecting = $state(false);
	let loading = $state(false);
	let collectResult = $state(null);
	const youtubeInputId = useId();

	function extractVideoId(url) {
		if (!url) return '';

		if (url.length === 11 && !url.includes('/') && !url.includes('.')) {
			return url;
		}

		try {
			const urlObj = new URL(url);

			if (urlObj.hostname.includes('youtube.com')) {
				return urlObj.searchParams.get('v') || '';
			}

			if (urlObj.hostname === 'youtu.be') {
				return urlObj.pathname.slice(1);
			}
		} catch {
			return url;
		}

		return '';
	}

	async function handleCollect() {
		const vid = extractVideoId(youtubeUrl);
		if (!vid) {
			alert('올바른 YouTube URL 또는 videoId를 입력하세요');
			return;
		}

		videoId = vid;
		collecting = true;
		collectResult = null;
		transcript = null;

		try {
			console.log('[dev] 수집 시작:', videoId);
			const result = await collectTranscript({ videoId });
			console.log('[dev] 수집 완료:', result);
			collectResult = result;

			if (result.success && result.data) {
				transcript = { data: result.data };
			}
		} catch (err) {
			console.error('[dev] 수집 실패:', err);
			alert('수집 실패: ' + (err.message || '알 수 없는 오류'));
		} finally {
			collecting = false;
		}
	}

	async function handleLoad() {
		const vid = extractVideoId(youtubeUrl) || videoId;
		if (!vid) {
			alert('올바른 YouTube URL 또는 videoId를 입력하세요');
			return;
		}

		videoId = vid;
		loading = true;

		try {
			console.log('[dev] 조회 시작:', videoId);
			const result = await getTranscriptFromDB({ videoId });
			console.log('[dev] 조회 완료:', result);

			transcript = result.success ? result.transcript : null;
		} catch (err) {
			console.error('[dev] 조회 실패:', err);
			alert('조회 실패: ' + (err.message || '알 수 없는 오류'));
		} finally {
			loading = false;
		}
	}

	function toTimestamp(ms) {
		if (!Number.isFinite(ms)) return '00:00';
		const sec = Math.floor(ms / 1000);
		const h = Math.floor(sec / 3600);
		const m = Math.floor((sec % 3600) / 60);
		const s = sec % 60;
		const pad = (n) => String(n).padStart(2, '0');
		return h > 0 ? h + ':' + pad(m) + ':' + pad(s) : pad(m) + ':' + pad(s);
	}
</script>

<main class="container mx-auto px-4 py-8 space-y-6">
	<header>
		<h1 class="h2">YouTube 자막 수집 테스트</h1>
		<p class="text-surface-500">
			YouTube URL을 입력하여 자막을 수집하고, DB에 저장된 자막을 조회합니다.
		</p>
	</header>

	<section
		class="rounded-xl border border-surface-200 bg-surface-50 p-6 dark:border-surface-800 dark:bg-surface-900 space-y-4">
		<div class="flex flex-col gap-2">
			<label class="text-sm font-medium" for={youtubeInputId}>YouTube URL 또는 videoId</label>
			<input
				type="text"
				id={youtubeInputId}
				bind:value={youtubeUrl}
				class="input"
				placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ 또는 dQw4w9WgXcQ" />
		</div>

		<div class="flex gap-3">
			<button
				class="btn preset-filled-primary"
				onclick={handleCollect}
				disabled={collecting || loading}>
				{#if collecting}
					수집 중...
				{:else}
					자막 수집
				{/if}
			</button>

			<button
				class="btn preset-filled-secondary"
				onclick={handleLoad}
				disabled={collecting || loading}>
				{#if loading}
					조회 중...
				{:else}
					DB 조회
				{/if}
			</button>
		</div>

		{#if collectResult}
			<div
				class="rounded-lg border border-primary-200 bg-primary-50 p-4 dark:border-primary-800 dark:bg-primary-950">
				<p class="text-sm">
					<strong>수집 결과:</strong>
					{collectResult.message}
				</p>
				{#if collectResult.segmentCount}
					<p class="text-xs text-surface-600 dark:text-surface-400 mt-1">
						세그먼트: {collectResult.segmentCount}개
					</p>
				{/if}
			</div>
		{/if}
	</section>

	<section class="space-y-4">
		<div class="flex items-center justify-between">
			<h2 class="h3">
				DB 저장 자막 {transcript ? '(' + transcript.data.segments.length + '개 세그먼트)' : ''}
			</h2>
			{#if videoId}
				<span class="text-sm text-surface-500">videoId: {videoId}</span>
			{/if}
		</div>

		{#if !transcript}
			<div
				class="rounded-lg border border-dashed border-surface-200 p-8 text-center text-surface-400 dark:border-surface-700">
				아직 저장된 자막이 없습니다. 위에서 자막을 수집하거나 조회하세요.
			</div>
		{:else}
			{@const data = transcript.data}
			<div class="space-y-3">
				{#if data.title}
					<div
						class="rounded-lg border border-surface-200 bg-white p-4 dark:border-surface-800 dark:bg-surface-900">
						<h3 class="font-semibold mb-2">영상 정보</h3>
						<p class="text-sm mb-1">
							<strong>제목:</strong>
							{data.title}
						</p>
						{#if data.duration}
							<p class="text-sm">
								<strong>길이:</strong>
								{data.duration}초
							</p>
						{/if}
					</div>
				{/if}

				<div
					class="rounded-lg border border-surface-200 bg-white p-4 dark:border-surface-800 dark:bg-surface-900">
					<h3 class="font-semibold mb-3">자막 세그먼트</h3>
					<ul class="space-y-2 max-h-96 overflow-y-auto">
						{#each data.segments as segment (segment.start_ms)}
							<li class="border-b border-surface-100 pb-2 last:border-0 dark:border-surface-800">
								<div class="flex items-start gap-3">
									<span
										class="text-xs font-mono text-surface-500 dark:text-surface-400 shrink-0 mt-1">
										{toTimestamp(segment.start_ms)}
									</span>
									<p class="text-sm text-surface-800 dark:text-surface-100">
										{segment.text}
									</p>
								</div>
							</li>
						{/each}
					</ul>
				</div>

				<div
					class="rounded-lg border border-surface-200 bg-white p-4 dark:border-surface-800 dark:bg-surface-900">
					<h3 class="font-semibold mb-2">전체 텍스트</h3>
					<div
						class="text-sm text-surface-800 dark:text-surface-100 whitespace-pre-wrap max-h-64 overflow-y-auto">
						{data.segments.map((s) => s.text).join(' ')}
					</div>
				</div>
			</div>
		{/if}
	</section>
</main>
