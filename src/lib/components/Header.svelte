<script>
	import { page } from '$app/state';
	import * as m from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';
	import { Avatar } from '@skeletonlabs/skeleton-svelte';
	import Breadcrumb from './Breadcrumb.svelte';
</script>

<header class="z-100 sticky top-0 border-b border-surface-300-700 bg-surface-50-950">
	<div class="container mx-auto px-4 h-12 flex items-center justify-between">
		<div class="flex items-center gap-2">
			<a href={localizeHref('/')} class="text-lg font-bold text-surface-900-100">
				{m.header_logo_text()}
			</a>
			<Breadcrumb />
		</div>

		<div class="flex items-center gap-4">
			{#if !page.data.user}
				<a href={localizeHref('/auth/sign-in')} class="btn preset-filled-primary btn-sm">
					{m.header_start_login()}
				</a>
			{:else}
				<a href={localizeHref('/profile')} class="hover:opacity-80" aria-label="프로필">
					<Avatar class="w-8 h-8">
						<Avatar.Image src={page.data.user.user_metadata?.avatar_url} />
					</Avatar>
				</a>
			{/if}
		</div>
	</div>
</header>
