<script lang="ts">
	import { getSummaryStore } from '$lib/stores/summary.svelte';

	const summaryStore = getSummaryStore();
	const { enhancedForm, fields } = summaryStore.form;
</script>

<form
	{...enhancedForm}
	novalidate
	class="flex gap-2 sticky top-12 z-10 backdrop-blur-md bg-surface-50-950/50 py-4">
	<input {...fields.video_id.as('text')} type="hidden" />
	<div class="flex-1">
		<input
			type="text"
			name="url"
			placeholder="YouTube URL을 입력하세요"
			class="input"
			autocomplete="off" />
	</div>
	<button type="submit" class="btn preset-filled-primary whitespace-nowrap">생성</button>
</form>
