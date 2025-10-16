<script>
	import { createSummary } from '$lib/remote/summary.remote.js';
	import { getSummaries } from '$lib/remote/getSummaries.remote';
	import { SummarySchema } from '$lib/schemas/summary-schema.js';

	const { url } = createSummary.fields;

	const enhancedForm = createSummary
		.preflight(SummarySchema)
		.enhance(async ({ form, submit }) => {
		try {
			console.log('[SummaryForm] 제출 시작, URL:', url.value());

			const newUrl = url.value();

			// 낙관적 업데이트: set()으로 영구 추가
			const optimisticSummary = {
				id: null,
				url: newUrl,
				title: null,
				summary: null,
				processing_status: 'pending',
				thumbnail_url: null,
				created_at: null,
				updated_at: null
			};

			const current = await getSummaries({});
			getSummaries({}).set({
				...current,
				summaries: [optimisticSummary, ...current.summaries]
			});
			console.log('[SummaryForm] 낙관적 업데이트 (set):', optimisticSummary);

			// submit만 호출 (updates 불필요)
			await submit();

			form.reset();
			console.log('[SummaryForm] 제출 완료');
		} catch (error) {
			console.error('[SummaryForm] 요약 제출 실패:', error);
		}
	});
</script>

<form {...enhancedForm} novalidate class="flex gap-2">
	<div class="flex-1">
		<input
			{...url.as('text')}
			placeholder="YouTube URL을 입력하세요"
			class="input" />
		{#each url.issues() as issue (issue.message)}
			<p class="mt-1 text-xs text-error-500">{issue.message}</p>
		{/each}
	</div>
	<button
		type="submit"
		class="btn preset-filled-primary whitespace-nowrap">
		생성
	</button>
</form>
