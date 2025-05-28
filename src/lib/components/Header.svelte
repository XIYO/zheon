<!-- 🙈 Header component with authentication dialogs and Svelte 5 runes -->
<script module>
	import SignUpForm from '$lib/components/SignUpForm.svelte';
	import SignInForm from '$lib/components/SignInForm.svelte';
	import SignOutForm from '$lib/components/SignOutForm.svelte';
	import { page } from '$app/state';

	/** @type {HTMLDialogElement} */
	let signUpDialog;
	/** @type {HTMLDialogElement} */
	let signInDialog;
	/** @type {HTMLDialogElement} */
	let signOutDialog;

	/**
	 * Handles the sign-up dialog opening.
	 * @param {MouseEvent} [e] - The mouse event that triggered the function.
	 */
	export const handleSignUp = (e) => {
		e?.preventDefault();
		signUpDialog.showModal();
	};

	/**
	 * Handles the sign-in dialog opening.
	 * @param {MouseEvent} [e] - The mouse event that triggered the function.
	 */
	export const handleSignIn = (e) => {
		e?.preventDefault();
		signInDialog.showModal();
	};

	/**
	 * Handles the sign-out dialog opening.
	 * @param {MouseEvent} [e] - The mouse event that triggered the function.
	 */
	export const handleSignOut = (e) => {
		e?.preventDefault();
		signOutDialog.showModal();
	};

	/**
	 * Handles the sign-up form submission success.
	 */
	const onSubmitSignUp = () => {
		signUpDialog.close();
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
	class="sticky top-0 z-50 flex items-center justify-between bg-black px-6 py-4 text-white shadow-md"
>
	<!-- Logo / Title -->
	<a class="text-xl font-extrabold tracking-widest" href="/">展</a>

	<!-- Auth navigation -->
	{#if !page.data.user}
		<nav class="space-x-6">
			<a
				href="/auth/sign-up"
				class="text-sm text-gray-300 underline-offset-4 hover:underline hover:text-white"
				onclick={handleSignUp}
			>Sign up</a>
			<a
				href="/auth/sign-in"
				class="text-sm text-gray-300 underline-offset-4 hover:underline hover:text-white"
				onclick={handleSignIn}
			>Sign in</a>
		</nav>
	{:else}
		<span class="text-sm text-gray-300">
			환영합니다, {page.data.user.user_metadata.name}님
			<a
				href="/auth/sign-out/"
				onclick={handleSignOut}
				class="ml-4 text-sm text-gray-300 underline-offset-4 hover:underline hover:text-white"
			>
				Sign out
			</a>
		</span>
	{/if}
</header>

<!-- ─────────────────────────── SIGN‑UP DIALOG ─────────────────────────── -->
<dialog bind:this={signUpDialog} class="m-auto max-w-md rounded-lg backdrop:bg-black/30 bg-gray-50 p-4">
	<form method="DIALOG" class="mb-4">
		<button class="ml-auto block rounded-md bg-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-300">닫기</button>
	</form>
	<SignUpForm onsuccess={onSubmitSignUp} />
</dialog>

<!-- ─────────────────────────── SIGN‑IN DIALOG ─────────────────────────── -->
<dialog bind:this={signInDialog} class="m-auto max-w-md rounded-lg backdrop:bg-black/30 bg-gray-50 p-4">
	<form method="DIALOG" class="mb-4">
		<button class="ml-auto block rounded-md bg-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-300">닫기</button>
	</form>
	<SignInForm onsuccess={onsuccessSignIn} />
</dialog>

<!-- ─────────────────────────── SIGN‑OUT DIALOG ─────────────────────────── -->
<dialog bind:this={signOutDialog} class="m-auto max-w-md rounded-lg backdrop:bg-black/30 bg-gray-50 p-4">
	<form method="DIALOG" class="mb-4">
		<button class="ml-auto block rounded-md bg-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-300">닫기</button>
	</form>
	<SignOutForm onsuccess={onSubmitSignOut} />
</dialog>
