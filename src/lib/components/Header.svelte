<!-- 🙈 Header component with Skeleton UI design -->
<script>
	import { page } from '$app/state';
	import * as m from '$lib/paraglide/messages';
	import { AppBar } from '@skeletonlabs/skeleton-svelte';

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
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
			</button>
		{/if}
	{/snippet}

	{#snippet trail()}
		<!--
		═══════════════════════════════════════════════════════════════
		인증 기능 (Authentication)
		═══════════════════════════════════════════════════════════════

		현재 인증 기능은 숨김 처리되어 있습니다.
		필요시 아래 주석을 해제하여 로그인/로그아웃 링크를 활성화할 수 있습니다.

		로그인/회원가입 페이지: /auth/sign-in, /auth/sign-up
		로그아웃 페이지: /auth/sign-out

		{#if !page.data.user}
			<nav>
				<a href="/auth/sign-in" class="btn preset-filled btn-sm">
					<span>{m.header_start_login()}</span>
				</a>
			</nav>
		{:else}
			<div class="flex items-center space-x-4">
				<div class="hidden sm:flex sm:items-center sm:space-x-3">
					<div>
						<span class="preset-typo-caption font-semibold">
							{m.header_welcome({ name: page.data.user.user_metadata.name })}
						</span>
						<span class="preset-typo-caption ml-2">
							{m.header_welcome_message()}
						</span>
					</div>
				</div>
				<a href="/auth/sign-out" class="btn preset-ghost btn-base">
					{m.header_logout()}
				</a>
			</div>
		{/if}
		═══════════════════════════════════════════════════════════════
		-->
	{/snippet}

	<span class="preset-typo-subtitle">{page.data?.meta?.title}</span>
</AppBar>
