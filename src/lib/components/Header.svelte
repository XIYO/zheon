<script module>
	import SignUpForm from '$lib/components/SignUpForm.svelte';
	import SignInForm from '$lib/components/SignInForm.svelte';
	import SIgnOutForm from '$lib/components/SignOutForm.svelte';
	import { page } from '$app/state';

	/** @type {HTMLDialogElement} */
	let signUpDialog;
	/** @type {HTMLDialogElement} */
	let signInDialog;
	/** @type {HTMLDialogElement} */
	let signOutDialog;

	export const handleSignUp = (/** @type MouseEvent || undefined */ e) => {
		e?.preventDefault();
		signUpDialog.showModal();
	};

	export const handleSignIn = (/** @type MouseEvent || undefined */ e) => {
		e?.preventDefault();
		signInDialog.showModal();
	};

	export const handleSignOut = (/** @type MouseEvent || undefined */ e) => {
		e?.preventDefault();
		signOutDialog.showModal();
	};

	const onSubmitSignUp = () => {
		signUpDialog.close();
	};

	const onsuccessSignIn = () => signInDialog.close();

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
	{#if !page.data.userMetadata}
		<nav class="space-x-6">
			<a
				href="/auth/sign-up"
				class="text-sm underline-offset-4 hover:underline"
				onclick={handleSignUp}>Sign up</a
			>
			<a
				href="/auth/sign-in"
				class="text-sm underline-offset-4 hover:underline"
				onclick={handleSignIn}>Sign in</a
			>
		</nav>
	{:else}
		<span class="text-sm text-gray-300">
			환영합니다, {page.data.userMetadata.name}님
			<a
				href="/auth/sign-out/"
				onclick={handleSignOut}
				class="ml-4 text-sm underline hover:text-white"
			>
				Sign out
			</a>
		</span>
	{/if}
</header>

<!-- ─────────────────────────── SIGN‑UP DIALOG ─────────────────────────── -->
<dialog bind:this={signUpDialog} class="m-auto max-w-md rounded-lg backdrop:bg-black/30 bg-gray-50 p-4">
	<form method="DIALOG" class="mb-4">
		<button class="ml-auto block rounded-md bg-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-300 transition-colors">닫기</button>
	</form>
	<SignUpForm onsuccess={onSubmitSignUp} />
</dialog>

<!-- ─────────────────────────── SIGN‑IN DIALOG ─────────────────────────── -->
<dialog bind:this={signInDialog} class="m-auto max-w-md rounded-lg backdrop:bg-black/30 bg-gray-50 p-4">
	<form method="DIALOG" class="mb-4">
		<button class="ml-auto block rounded-md bg-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-300 transition-colors">닫기</button>
	</form>
	<SignInForm onsuccess={onsuccessSignIn} />
</dialog>

<!-- ─────────────────────────── SIGN‑OUT DIALOG ─────────────────────────── -->
<dialog bind:this={signOutDialog} class="m-auto max-w-md rounded-lg backdrop:bg-black/30 bg-gray-50 p-4">
	<form method="DIALOG" class="mb-4">
		<button class="ml-auto block rounded-md bg-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-300 transition-colors">닫기</button>
	</form>
	<SIgnOutForm onsuccess={onSubmitSignOut} />
</dialog>
