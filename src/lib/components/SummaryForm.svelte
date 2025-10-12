<script>
	import { createSummary } from '$lib/remote/summary.remote.js';
	import { SummarySchema } from '$lib/schemas/summary-schema.js';

	const { url } = createSummary.fields;

	const enhancedForm = createSummary
		.preflight(SummarySchema)
		.enhance(async ({ form, submit }) => {
		try {
			await submit();
			form.reset();
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
			class="w-full px-3 py-2 text-sm border border-surface-300-700 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
		{#each url.issues() as issue}
			<p class="mt-1 text-xs text-error-500">{issue.message}</p>
		{/each}
	</div>
	<button
		type="submit"
		class="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded whitespace-nowrap">
		생성
	</button>
</form>
