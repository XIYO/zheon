<!-- 유튜브 URL 입력 폼 컴포넌트 -->
<script>
	import { createSummary, getRecentSummaries } from '$lib/remote/summary.remote.js';
	import { SummarySchema } from '$lib/schemas/summary-schema.js';
	import { extractThumbnail } from '$lib/youtube-utils.js';

	const { url } = createSummary.fields;

	// preflight와 enhance 설정
	const enhancedForm = createSummary
		.preflight(SummarySchema)
		.enhance(async ({ form, submit, data }) => {
		try {
			// 낙관적 업데이트 데이터
			const optimisticEntry = {
				id: crypto.randomUUID(),
				url: data.url,
				title: '처리 중...',
				summary: '',
				processing_status: 'pending',
				thumbnail_url: extractThumbnail(data.url),
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			};

			// Edge Function 호출 + 낙관적 업데이트
			await submit().updates(
				getRecentSummaries().withOverride((summaries = []) => {
					form.reset();
					return [optimisticEntry, ...summaries];
				})
			);
		} catch (error) {
			console.error('[SummaryForm] 요약 제출 실패:', error);
		}
	});

</script>

<div class="card-modern rounded-2xl w-full mx-auto overflow-hidden">
	<div class="p-6">
		<!-- ✅ enhance된 폼 속성 사용 -->
		<form {...enhancedForm} novalidate class="space-y-4">
			<div class="space-y-2">
				<input
					{...url.as('text')}
					placeholder="영상 URL을 입력하세요"
					class="input glass-effect rounded-xl w-full px-4 py-3 placeholder:text-surface-400 focus:ring-2 focus:ring-primary-500/50 transition-all" />

				<!-- 에러 메시지 표시 -->
				{#each url.issues() as issue}
					<p class="text-xs text-error-500">
						{issue.message}
					</p>
				{/each}

				<p class="text-xs text-surface-600 dark:text-surface-400">지원 서비스: YouTube</p>
			</div>

			<button class="btn-premium rounded-xl w-full py-3" type="submit">
				인사이트 추출 시작 →
			</button>
		</form>
	</div>
</div>
