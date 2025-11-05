<script>
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { Avatar } from '@skeletonlabs/skeleton-svelte';
	import Breadcrumb from './Breadcrumb.svelte';
</script>

<header class="z-100 sticky top-0 border-b border-surface-300-700 bg-surface-50-950">
	<div class="container mx-auto px-4 h-12 flex items-center justify-between">
		<div class="flex items-center gap-2">
			<a href={resolve('/')} class="text-lg font-bold text-surface-900-100">
				Zheon
			</a>
			<Breadcrumb />
		</div>

		<div class="flex items-center gap-4">
			{#if !page.data.user}
				<a href={resolve('/auth/sign-in')} class="btn preset-filled-primary btn-sm">
					로그인
				</a>
			{:else}
				<a href={resolve('/profile')} class="hover:opacity-80" aria-label="프로필">
					<Avatar class="w-8 h-8">
						<Avatar.Image src={page.data.user.user_metadata?.avatar_url} />
					</Avatar>
				</a>
			{/if}
		</div>
	</div>
</header>
