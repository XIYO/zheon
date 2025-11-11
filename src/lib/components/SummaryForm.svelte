<script lang="ts">
	import { getSummaryStore } from '$lib/stores/summary.svelte';

	const summaryStore = getSummaryStore();
	const { enhancedForm, fields } = summaryStore.form;
</script>

<form {...enhancedForm} novalidate class="flex gap-2">
	<div class="flex-1">
		<input {...fields.id.as('text')} type="text" />
		<input {...fields.url.as('text')} placeholder="YouTube URL을 입력하세요" class="input" />
		{#each fields.url.issues() as issue (issue.message)}
			<p class="mt-1 text-xs text-error-500">{issue.message}</p>
		{/each}
	</div>
	<button type="submit" class="btn preset-filled-primary whitespace-nowrap">생성</button>
</form>
