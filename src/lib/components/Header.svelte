<script>
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

	const handleSignUp = (/** @type MouseEvent */ e) => {
		e.preventDefault();
		signUpDialog.showModal();
	};

	const handleSignIn = (/** @type MouseEvent */ e) => {
		e.preventDefault();
		signInDialog.showModal();
	};

	const handleSignOut = (/** @type MouseEvent */ e) => {
		e.preventDefault();
		signOutDialog.showModal();
	};

	const handleSignInSuccessAfter = () => {
		signInDialog.close();
	};
</script>

<!-- ─────────────────────────── HEADER ─────────────────────────── -->
<header class="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-black text-white shadow-md">
	<!-- Logo / Title -->
	<a class="text-xl font-extrabold tracking-widest" href="/">展</a>

	<!-- Auth navigation -->
	{#if !page.data.userMetadata}
		<nav class="space-x-6">
			<a
				href="/auth/sign-up"
				class="text-sm underline-offset-4 hover:underline"
				onclick={handleSignUp}
			>Sign up</a
			>
			<a
				href="/auth/sign-in"
				class="text-sm underline-offset-4 hover:underline"
				onclick={handleSignIn}
			>Sign in</a
			>
		</nav>
	{:else}
		<span class="text-sm text-gray-300">
			환영합니다, {page.data.userMetadata.name}님
			<a href="/auth/sign-out/" onclick={handleSignOut} class="ml-4 underline hover:text-white text-sm">
				Sign out
			</a>
		</span>
	{/if}
</header>

<!-- ─────────────────────────── SIGN‑UP DIALOG ─────────────────────────── -->
<dialog bind:this={signUpDialog} class="m-auto rounded-lg backdrop:bg-black/30 max-w-md">
	<form method="DIALOG">
		<button>close</button>
	</form>
	<SignUpForm />
</dialog>

<!-- ─────────────────────────── SIGN‑IN DIALOG ─────────────────────────── -->
<dialog bind:this={signInDialog} class="m-auto rounded-lg backdrop:bg-black/30 max-w-md">
	<form method="DIALOG">
		<button>close</button>
	</form>
	<SignInForm successAfter={handleSignInSuccessAfter}/>
</dialog>

<!-- ─────────────────────────── SIGN‑OUT DIALOG ─────────────────────────── -->
<dialog bind:this={signOutDialog} class="m-auto rounded-lg backdrop:bg-black/30 max-w-md">
	<form method="DIALOG">
		<button>close</button>
	</form>
	<SIgnOutForm />
</dialog>