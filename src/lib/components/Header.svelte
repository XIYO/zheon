<!-- 🙈 Header component with Skeleton UI design -->
<script>
	import { page } from '$app/state';
	import Dialog from '$lib/components/Dialog.svelte';
	import SignInForm from '$lib/components/SignInForm.svelte';
	import SignOutForm from '$lib/components/SignOutForm.svelte';
	import * as m from '$lib/paraglide/messages';
	import { AppBar } from '@skeletonlabs/skeleton-svelte';

	/** @type {import('$lib/components/Dialog.svelte').default} */
	let signInDialog;
	/** @type {import('$lib/components/Dialog.svelte').default} */
	let signOutDialog;

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

	/**
	 * Handles the sign-in dialog opening.
	 * @param {MouseEvent} [e] - The mouse event that triggered the function.
	 */
	const handleSignIn = (e) => {
		e?.preventDefault();
		signInDialog.open();
	};

        /**
         * Handles the sign-out dialog opening.
         * @param {MouseEvent} [e] - The mouse event that triggered the function.
         */
        const handleSignOut = (e) => {
                e?.preventDefault();
                signOutDialog.open();
        };

        const userName = $derived(() => {
                const user = page.data.user;
                return user?.displayName ?? user?.email ?? m.header_default_user_name?.() ?? '사용자';
        });

	/**
	 * Handles the sign-in form submission success.
	 */
	const onsuccessSignIn = () => {
		signInDialog.close();
	};

	/**
	 * Handles the sign-out form submission success.
	 */
	const onSubmitSignOut = () => {
		signOutDialog.close();
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
		{#if !page.data.user}
			<nav>
				<button onclick={handleSignIn} class="btn preset-filled btn-sm" type="button">
					<span>{m.header_start_login()}</span>
				</button>
			</nav>
		{:else}
			<div class="flex items-center space-x-4">
                                <div class="hidden sm:flex sm:items-center sm:space-x-3">
                                        <div>
                                                <span class="preset-typo-caption font-semibold">{m.header_welcome({ name: userName })}</span>
                                                <span class="preset-typo-caption ml-2">{m.header_welcome_message()}</span>
                                        </div>
                                </div>
				<button onclick={handleSignOut} class="btn preset-ghost btn-base" type="button">
					{m.header_logout()}
				</button>
			</div>
		{/if}
	{/snippet}

	<span class="preset-typo-subtitle">{page.data?.meta?.title}</span>
</AppBar>

<!-- ─────────────────────────── SIGN‑IN DIALOG ─────────────────────────── -->
<Dialog bind:this={signInDialog} ariaLabel={m.auth_close()}>
	<SignInForm onsuccess={onsuccessSignIn} />
</Dialog>

<!-- ─────────────────────────── SIGN‑OUT DIALOG ─────────────────────────── -->
<Dialog bind:this={signOutDialog} ariaLabel={m.auth_close()}>
	<SignOutForm onsuccess={onSubmitSignOut} />
</Dialog>
