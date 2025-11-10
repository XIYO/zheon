<script lang="ts">
	import { getSummaryStore } from '$lib/stores/summary.svelte';

	const summaryStore = getSummaryStore();
	const { enhancedForm, fields } = summaryStore.form;
	const { url } = fields;
</script>

<form {...enhancedForm} novalidate class="flex gap-2">
	<div class="flex-1">
		<input {...url.as('text')} placeholder="YouTube URL을 입력하세요" class="input" />
		{#each url.issues() as issue (issue.message)}
			<p class="mt-1 text-xs text-error-500">{issue.message}</p>
		{/each}
	</div>
	<button type="submit" class="btn preset-filled-primary whitespace-nowrap">생성</button>
</form>
