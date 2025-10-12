<!-- 🙈 Header component with Skeleton UI design -->
<script>
	import { page } from '$app/state';
	import * as m from '$lib/paraglide/messages';
	import { AppBar, Avatar } from '@skeletonlabs/skeleton-svelte';

	/**
	 * Check if current page is home/root
	 */
	let isRootPage = $derived(page.url.pathname === '/');

	/**
	 * Handle navigation - back or home
	 */
	const handleNavigation = () => {
		if (!isRootPage) {
			history.back();
		}
	};
</script>

<!-- ─────────────────────────── HEADER ─────────────────────────── -->
<AppBar>
	{#snippet lead()}
		{#if isRootPage}
			<a href="/" class="flex items-center space-x-3">
				<span class="preset-typo-headline font-black tracking-tight">{m.header_logo_text()}</span>
			</a>
		{:else}
			<button onclick={handleNavigation} class="btn-icon" aria-label="Go back">
				<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 19l-7-7 7-7" />
				</svg>
			</button>
		{/if}
	{/snippet}

	{#snippet trail()}
		{#if !page.data.user}
			<nav>
				<a href="/auth/sign-in" class="btn preset-filled btn-sm">
					<span>{m.header_start_login()}</span>
				</a>
			</nav>
		{:else}
			<a
				href="/profile"
				class="transition-transform hover:scale-105 active:scale-95"
				aria-label="프로필"
			>
				<Avatar
					src={page.data.user.user_metadata?.avatar_url}
					name={page.data.user.user_metadata?.display_name || page.data.user.email || 'User'}
				/>
			</a>
		{/if}
	{/snippet}

	<span class="preset-typo-subtitle">{page.data?.meta?.title}</span>
</AppBar>
