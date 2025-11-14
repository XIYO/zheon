<script lang="ts">
	import changelogRaw from '../../../CHANGELOG.md?raw';
	import { marked } from 'marked';
	import { Tooltip } from 'bits-ui';

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

	const recentChangelog = $derived.by(() => {
		const lines = changelogRaw.split('\n');
		const versionStarts: number[] = [];

		lines.forEach((line, idx) => {
			if (line.match(/^#+ \[?\d+\.\d+\.\d+\]?/)) {
				versionStarts.push(idx);
			}
		});

		const last2Versions = versionStarts.slice(0, 2);
		if (last2Versions.length === 0) return '';

		const versions: string[] = [];

		for (let i = 0; i < last2Versions.length; i++) {
			const startIdx = last2Versions[i];
			const endIdx = last2Versions[i + 1] || versionStarts[2] || lines.length;
			const versionLines = lines.slice(startIdx, endIdx);
			versions.push(versionLines.join('\n'));
		}

		const formattedMarkdown = versions.join('\n\n---\n\n');

		const withoutIssueLinks = formattedMarkdown.replace(/\s*\(#\d+\)/g, '');

		return marked(withoutIssueLinks);
	});
</script>

<div class="fixed bottom-4 right-4 z-50" role="contentinfo">
	<Tooltip.Root delayDuration={200}>
		<Tooltip.Trigger class="badge preset-filled-surface-100-900 shadow-lg">
			<span class="font-mono">v{__APP_VERSION__}</span>
		</Tooltip.Trigger>
		<Tooltip.Content
			side="top"
			align="end"
			sideOffset={8}
			class="animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
		>
			<div class="card preset-filled-surface-50-950 max-h-[70vh] w-[600px] overflow-auto p-4 shadow-2xl">
				<div class="mb-3 border-b border-surface-200-800 pb-2">
					<dl class="flex gap-6 text-xs">
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
				<div class="prose prose-sm max-w-none dark:prose-invert">
					{@html recentChangelog}
				</div>
			</div>
		</Tooltip.Content>
	</Tooltip.Root>
</div>
