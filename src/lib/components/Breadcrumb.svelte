<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	const pathSegments = $derived.by(() => {
		const pathname = page.url.pathname;
		if (pathname === '/') return [];

		const segments = pathname.split('/').filter(Boolean);
		return segments.map((segment, index) => {
			const path = '/' + segments.slice(0, index + 1).join('/');
			return { segment, path };
		});
	});
</script>

<nav class="flex items-center gap-2 text-sm">
	{#each pathSegments as { segment, path }, index (path)}
		<span class="text-surface-400">/</span>
		{#if index === pathSegments.length - 1}
			<span class="text-surface-900-100 font-medium">
				{segment}
			</span>
		{:else}
			<a
				href={resolve(path)}
				class="text-surface-600-400 hover:text-surface-900-100 transition-colors">
				{segment}
			</a>
		{/if}
	{/each}
</nav>
