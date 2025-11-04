<script>
	import { analyzeVideoQuality } from '$lib/remote/ai.remote';
	import { useId } from 'bits-ui';

	let youtubeUrl = $state('');
	let videoId = $state('');
	let summaryId = $state('');
	let analyzing = $state(false);
	let result = $state(null);
	let errorMessage = $state('');
	const youtubeInputId = useId();
	const summaryInputId = useId();

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

	async function handleAnalyze() {
		const vid = extractVideoId(youtubeUrl);
		if (!vid) {
			alert('올바른 YouTube URL 또는 videoId를 입력하세요');
			return;
		}

		videoId = vid;
		analyzing = true;
		result = null;
		errorMessage = '';

		try {
			console.log('[dev] 분석 시작:', videoId, summaryId || '(자동 생성)');

			const analysisResult = await analyzeVideoQuality({
				videoId,
				summaryId: summaryId || undefined
			});

			console.log('[dev] 분석 완료:', analysisResult);
			result = analysisResult;
		} catch (err) {
			console.error('[dev] 분석 실패:', err);
			errorMessage = err.message || '알 수 없는 오류';
			alert('분석 실패: ' + errorMessage);
		} finally {
			analyzing = false;
		}
	}
</script>

<main class="container mx-auto px-4 py-8 space-y-6">
	<header>
		<h1 class="h2">YouTube 영상 품질 분석 테스트</h1>
		<p class="text-surface-500">
			자막 + 댓글 100개를 AI로 분석하여 영상과 커뮤니티 품질을 정량적으로 평가합니다.
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

		<div class="flex flex-col gap-2">
			<label class="text-sm font-medium" for={summaryInputId}>Summary ID (선택사항)</label>
			<input
				type="text"
				id={summaryInputId}
				bind:value={summaryId}
				class="input"
				placeholder="기존 summaries 레코드 ID (없으면 자동 생성)" />
		</div>

		<button class="btn preset-filled-primary w-full" onclick={handleAnalyze} disabled={analyzing}>
			{#if analyzing}
				분석 중... (1-2분 소요)
			{:else}
				영상 품질 분석 시작
			{/if}
		</button>

		{#if errorMessage}
			<div
				class="rounded-lg border border-error-200 bg-error-50 p-4 dark:border-error-800 dark:bg-error-950">
				<p class="text-sm text-error-700 dark:text-error-300">
					<strong>에러:</strong>
					{errorMessage}
				</p>
			</div>
		{/if}
	</section>

	{#if result}
		<section class="space-y-4">
			<h2 class="h3">분석 결과</h2>

			<div
				class="rounded-xl border border-primary-200 bg-primary-50 p-4 dark:border-primary-800 dark:bg-primary-950">
				<p class="text-sm">
					<strong>Video ID:</strong>
					{result.videoId}
				</p>
				<p class="text-sm">
					<strong>Summary ID:</strong>
					{result.summaryId}
				</p>
			</div>

			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				<div
					class="rounded-lg border border-surface-200 bg-white p-4 dark:border-surface-800 dark:bg-surface-900">
					<h3 class="font-semibold mb-2">콘텐츠 품질</h3>
					<ul class="text-sm space-y-1">
						<li>
							종합: <strong>{result.analysis.content_quality.overall_score}</strong>
							/100
						</li>
						<li>교육적 가치: {result.analysis.content_quality.educational_value}</li>
						<li>재미: {result.analysis.content_quality.entertainment_value}</li>
						<li>정확성: {result.analysis.content_quality.information_accuracy}</li>
						<li>명확성: {result.analysis.content_quality.clarity}</li>
						<li>깊이: {result.analysis.content_quality.depth}</li>
						<li class="pt-2 border-t">
							카테고리: <span class="badge preset-filled">
								{result.analysis.content_quality.category}
							</span>
						</li>
						<li>
							대상: <span class="badge preset-filled-secondary">
								{result.analysis.content_quality.target_audience}
							</span>
						</li>
					</ul>
				</div>

				<div
					class="rounded-lg border border-surface-200 bg-white p-4 dark:border-surface-800 dark:bg-surface-900">
					<h3 class="font-semibold mb-2">여론 분석</h3>
					<ul class="text-sm space-y-1">
						<li>
							종합 여론: <strong>{result.analysis.sentiment.overall_score}</strong>
							/100
						</li>
						<li class="text-success-600">긍정: {result.analysis.sentiment.positive_ratio}%</li>
						<li class="text-surface-500">중립: {result.analysis.sentiment.neutral_ratio}%</li>
						<li class="text-error-600">부정: {result.analysis.sentiment.negative_ratio}%</li>
						<li class="pt-2 border-t">감정 강도: {result.analysis.sentiment.intensity}/100</li>
					</ul>
				</div>

				<div
					class="rounded-lg border border-surface-200 bg-white p-4 dark:border-surface-800 dark:bg-surface-900">
					<h3 class="font-semibold mb-2">커뮤니티 품질</h3>
					<ul class="text-sm space-y-1">
						<li>
							종합: <strong>{result.analysis.community.overall_score}</strong>
							/100
						</li>
						<li class="text-success-600">예의: {result.analysis.community.politeness}</li>
						<li class="text-error-600">저급: {result.analysis.community.rudeness}</li>
						<li class="text-success-600">상냥: {result.analysis.community.kindness}</li>
						<li class="text-error-600">독성: {result.analysis.community.toxicity}</li>
						<li class="pt-2 border-t">건설적: {result.analysis.community.constructive}</li>
						<li>자기중심: {result.analysis.community.self_centered}</li>
						<li>주제이탈: {result.analysis.community.off_topic}</li>
					</ul>
				</div>

				<div
					class="rounded-lg border border-surface-200 bg-white p-4 dark:border-surface-800 dark:bg-surface-900">
					<h3 class="font-semibold mb-2">나이대 분포</h3>
					<ul class="text-sm space-y-1">
						<li>10대: {result.analysis.age_groups.teens}%</li>
						<li>20대: {result.analysis.age_groups.twenties}%</li>
						<li>30대: {result.analysis.age_groups.thirties}%</li>
						<li>40대+: {result.analysis.age_groups.forty_plus}%</li>
					</ul>
				</div>
			</div>

			<div class="space-y-3">
				<div
					class="rounded-lg border border-surface-200 bg-white p-4 dark:border-surface-800 dark:bg-surface-900">
					<h3 class="font-semibold mb-2">콘텐츠 요약</h3>
					<p class="text-sm">{result.analysis.summary.content_summary}</p>
				</div>

				<div
					class="rounded-lg border border-surface-200 bg-white p-4 dark:border-surface-800 dark:bg-surface-900">
					<h3 class="font-semibold mb-2">관객 반응 요약</h3>
					<p class="text-sm">{result.analysis.summary.audience_reaction}</p>
				</div>

				{#if result.analysis.summary.key_insights.length > 0}
					<div
						class="rounded-lg border border-surface-200 bg-white p-4 dark:border-surface-800 dark:bg-surface-900">
						<h3 class="font-semibold mb-2">주요 발견사항</h3>
						<ul class="text-sm space-y-1 list-disc list-inside">
							{#each result.analysis.summary.key_insights as insight (insight)}
								<li>{insight}</li>
							{/each}
						</ul>
					</div>
				{/if}

				{#if result.analysis.summary.recommendations.length > 0}
					<div
						class="rounded-lg border border-surface-200 bg-white p-4 dark:border-surface-800 dark:bg-surface-900">
						<h3 class="font-semibold mb-2">개선 제안</h3>
						<ul class="text-sm space-y-1 list-disc list-inside">
							{#each result.analysis.summary.recommendations as recommendation (recommendation)}
								<li>{recommendation}</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
		</section>
	{/if}
</main>
