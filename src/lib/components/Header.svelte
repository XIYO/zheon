<!-- 🙈 Header component with Skeleton UI design -->
<script>
	import SignInForm from '$lib/components/SignInForm.svelte';
	import SignOutForm from '$lib/components/SignOutForm.svelte';
	import { page } from '$app/state';
	import * as m from '$lib/paraglide/messages';

	/** @type {HTMLDialogElement} */
	let signInDialog;
	/** @type {HTMLDialogElement} */
	let signOutDialog;

	/**
	 * Handles the sign-in dialog opening.
	 * @param {MouseEvent} [e] - The mouse event that triggered the function.
	 */
	const handleSignIn = (e) => {
		e?.preventDefault();
		signInDialog.showModal();
	};

	/**
	 * Handles the sign-out dialog opening.
	 * @param {MouseEvent} [e] - The mouse event that triggered the function.
	 */
	const handleSignOut = (e) => {
		e?.preventDefault();
		signOutDialog.showModal();
	};

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
<header
	class="sticky top-0 z-50 backdrop-blur-xl preset-tonal-surface flex items-center justify-between px-6 py-4">
	<div class="flex items-center">
		<a
			href="/"
			class="group flex items-center space-x-3 transition-colors hover:preset-tonal-primary">
			<div class="relative">
				<span class="text-3xl font-black tracking-tight gradient-text">{m.header_logo_text()}</span>
				<div
					class="absolute -inset-2 rounded-xl bg-gradient-to-r from-primary-600 to-secondary-600 opacity-0 blur transition-opacity group-hover:opacity-20">
				</div>
			</div>
			<div class="hidden sm:block">
				<span class="text-xl font-bold tracking-wide">{m.header_app_name()}</span>
				<div class="text-xs opacity-70 font-medium">{m.header_app_description()}</div>
			</div>
		</a>
	</div>

	<div class="flex items-center">
		{#if !page.data.user}
			<nav>
				<button onclick={handleSignIn} class="btn variant-filled-primary btn-sm" type="button">
					<span>{m.header_start_login()}</span>
				</button>
			</nav>
		{:else}
			<div class="flex items-center space-x-4">
				<div class="hidden sm:flex sm:items-center sm:space-x-3">
					<div
						class="h-8 w-8 rounded-full preset-gradient flex items-center justify-center text-white text-sm font-semibold">
						{#if page.data.user.user_metadata.avatar_url}
							<img
								src={page.data.user.user_metadata.avatar_url}
								alt="User Avatar"
								class="h-8 w-8 rounded-full object-cover" />
						{:else}
							{page.data.user.user_metadata.name?.charAt(0) || 'U'}
						{/if}
					</div>
					<div class="text-sm">
						<div class="font-semibold">
							{m.header_welcome({ name: page.data.user.user_metadata.name })}
						</div>
						<div class="opacity-70">{m.header_welcome_message()}</div>
					</div>
				</div>
				<button onclick={handleSignOut} class="btn variant-ghost-surface btn-base" type="button">
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
					</svg>
					<span class="hidden sm:inline">{m.header_logout()}</span>
				</button>
			</div>
		{/if}
	</div>
</header>

<!-- ─────────────────────────── SIGN‑IN DIALOG ─────────────────────────── -->
<dialog
	bind:this={signInDialog}
	class="m-auto max-w-md backdrop:bg-black/80 backdrop:backdrop-blur-md">
		<!-- Close Button -->
		<form method="dialog" class="absolute top-4 right-4">
			<button 
				type="submit" 
				class="btn preset-ghost-surface-500 btn-sm rounded-full"
				aria-label={m.auth_close()}>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</form>
		
		<SignInForm onsuccess={onsuccessSignIn} />
</dialog>

<!-- ─────────────────────────── SIGN‑OUT DIALOG ─────────────────────────── -->
<dialog
	bind:this={signOutDialog}
	class="m-auto max-w-md backdrop:bg-black/80 backdrop:backdrop-blur-md">
	<!-- Close Button -->
	<form method="dialog" class="absolute top-4 right-4">
		<button 
			type="submit" 
			class="btn preset-ghost-surface-500 btn-sm rounded-full"
			aria-label={m.auth_close()}>
			<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
	</form>
	
	<SignOutForm onsuccess={onSubmitSignOut} />
</dialog>
