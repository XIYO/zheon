<script>
	import { page } from '$app/state';
	import * as m from '$lib/paraglide/messages';
	import { Avatar } from '@skeletonlabs/skeleton-svelte';
	import Breadcrumb from './Breadcrumb.svelte';
</script>

<header class="sticky top-0 border-b border-surface-300-700 bg-surface-50-950">
	<div class="container mx-auto px-4 h-12 flex items-center justify-between">
		<div class="flex items-center gap-2">
			<a href="/" class="text-lg font-bold text-surface-900-100">
				{m.header_logo_text()}
			</a>
			<Breadcrumb />
		</div>

		<div class="flex items-center gap-4">
			{#if !page.data.user}
				<a href="/auth/sign-in" class="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded">
					{m.header_start_login()}
				</a>
			{:else}
				<a href="/profile" class="hover:opacity-80" aria-label="프로필">
					<Avatar class="w-8 h-8">
						<Avatar.Image src={page.data.user.user_metadata?.avatar_url} />
						<Avatar.Fallback>
							{(page.data.user.user_metadata?.display_name || page.data.user.email || 'User').substring(0, 2).toUpperCase()}
						</Avatar.Fallback>
					</Avatar>
				</a>
			{/if}
		</div>
	</div>
</header>
