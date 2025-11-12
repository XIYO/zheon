<script lang="ts">
	import { resolve } from '$app/paths';
	import Breadcrumb from './Breadcrumb.svelte';
</script>

<header class="z-100 sticky top-0 border-b border-surface-300-700 bg-surface-50-950">
	<div class="container mx-auto px-4 h-12 flex items-center justify-between">
		<div class="flex items-center gap-2">
			<a href={resolve('/')} class="text-lg font-bold">Zheon</a>
			<Breadcrumb />
		</div>
	</div>
</header>
