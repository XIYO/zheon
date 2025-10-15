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
