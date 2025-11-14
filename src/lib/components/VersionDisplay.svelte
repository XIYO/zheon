<script lang="ts">
	let showTooltip = $state(false);

	const formatBuildTime = (isoString: string) => {
		const date = new Date(isoString);
		return date.toLocaleString('ko-KR', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	};
</script>

<div
	class="fixed bottom-4 right-4 z-50"
	role="contentinfo"
	onmouseenter={() => (showTooltip = true)}
	onmouseleave={() => (showTooltip = false)}
>
	<div class="flex items-center gap-1 rounded-lg bg-surface-100-900 px-3 py-1.5 text-sm shadow-lg">
		<span class="font-mono text-surface-600-400">v{__APP_VERSION__}</span>
		<span class="text-surface-400-600">?</span>
	</div>

	{#if showTooltip}
		<div
			class="absolute bottom-full right-0 mb-2 w-64 rounded-lg bg-surface-50-950 p-3 shadow-xl"
		>
			<dl class="space-y-2 text-xs">
				<div>
					<dt class="font-semibold text-surface-700-300">Version</dt>
					<dd class="font-mono text-surface-600-400">{__APP_VERSION__}</dd>
				</div>
				<div>
					<dt class="font-semibold text-surface-700-300">Build Time</dt>
					<dd class="font-mono text-surface-600-400">{formatBuildTime(__BUILD_TIME__)}</dd>
				</div>
			</dl>
		</div>
	{/if}
</div>
