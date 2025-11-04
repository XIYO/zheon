<script>
	import { collectComments, getCommentsFromDB } from '$lib/remote/youtube/comment.remote';
	import { useId } from 'bits-ui';

	let youtubeUrl = $state('');
	let videoId = $state('');
	let commentList = $state([]);
	let collecting = $state(false);
	let loading = $state(false);
	let collectResult = $state(null);
	const youtubeInputId = useId();

	function extractVideoId(url) {
		if (!url) return '';

		// 이미 videoId만 입력한 경우
		if (url.length === 11 && !url.includes('/') && !url.includes('.')) {
			return url;
		}

		try {
			const urlObj = new URL(url);

			// youtube.com/watch?v=VIDEO_ID
			if (urlObj.hostname.includes('youtube.com')) {
				return urlObj.searchParams.get('v') || '';
			}

			// youtu.be/VIDEO_ID
			if (urlObj.hostname === 'youtu.be') {
				return urlObj.pathname.slice(1);
			}
		} catch {
			// URL 파싱 실패 시 그냥 그대로 반환
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

		try {
			console.log('[dev] 수집 시작:', videoId);
			const result = await collectComments({ videoId, maxComments: 100 });
			console.log('[dev] 수집 완료:', result);
			collectResult = result;

			// 수집 후 자동으로 조회
			await handleLoad();
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
			const result = await getCommentsFromDB({ videoId });
			console.log('[dev] 조회 완료:', result);

			commentList = result.comments || [];
		} catch (err) {
			console.error('[dev] 조회 실패:', err);
			alert('조회 실패: ' + (err.message || '알 수 없는 오류'));
		} finally {
			loading = false;
		}
	}

	function formatCommentText(data) {
		return data?.content?.text || data?.text || '';
	}

	function formatAuthor(data) {
		return data?.author?.name || '익명';
	}

	function formatLikeCount(data) {
		return data?.like_count || '0';
	}

	function formatPublishedTime(data) {
		return data?.published_time || '';
	}
</script>

<main class="container mx-auto px-4 py-8 space-y-6">
	<header>
		<h1 class="h2">YouTube 댓글 증분 수집 테스트</h1>
		<p class="text-surface-500">
			YouTube URL을 입력하여 댓글을 수집하고, DB에 저장된 댓글을 조회합니다.
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
					댓글 수집 (증분)
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
				<p class="text-xs text-surface-600 dark:text-surface-400 mt-1">
					수집: {collectResult.collected}개 · 배치: {collectResult.batches}개 ·
					{collectResult.stoppedByDuplicate ? '중복으로 중단' : '최대 한도 도달'}
				</p>
			</div>
		{/if}
	</section>

	<section class="space-y-4">
		<div class="flex items-center justify-between">
			<h2 class="h3">DB 저장 댓글 ({commentList.length}개)</h2>
			{#if videoId}
				<span class="text-sm text-surface-500">videoId: {videoId}</span>
			{/if}
		</div>

		{#if commentList.length === 0}
			<div
				class="rounded-lg border border-dashed border-surface-200 p-8 text-center text-surface-400 dark:border-surface-700">
				아직 저장된 댓글이 없습니다. 위에서 댓글을 수집하거나 조회하세요.
			</div>
		{:else}
			<ul class="space-y-3">
				{#each commentList as comment, idx (comment.comment_id)}
					{@const data = comment.data}
					<li
						class="rounded-xl border border-surface-200 bg-white p-4 shadow-sm dark:border-surface-800 dark:bg-surface-900">
						<header class="mb-2 flex items-center justify-between gap-4 text-sm">
							<span class="font-medium text-surface-700 dark:text-surface-200">
								{idx + 1}. {formatAuthor(data)}
							</span>
							<div class="flex items-center gap-3 text-surface-500">
								{#if formatPublishedTime(data)}
									<span>{formatPublishedTime(data)}</span>
								{/if}
								<span>👍 {formatLikeCount(data)}</span>
							</div>
						</header>

						<p class="whitespace-pre-wrap text-surface-800 dark:text-surface-100 mb-2">
							{formatCommentText(data)}
						</p>

						<footer class="flex items-center gap-3 text-xs text-surface-400">
							<span>comment_id: {comment.comment_id}</span>
							{#if data?.reply_count}
								<span>답글 {data.reply_count}개</span>
							{/if}
							{#if data?.is_pinned}
								<span class="text-primary-500">📌 고정</span>
							{/if}
						</footer>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</main>
