<!-- 🙈 Header component with Google OAuth only -->
<script module>
	import SignInForm from '$lib/components/SignInForm.svelte';
	import SignOutForm from '$lib/components/SignOutForm.svelte';
	import { page } from '$app/state';

	/** @type {HTMLDialogElement} */
	let signInDialog;
	/** @type {HTMLDialogElement} */
	let signOutDialog;

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
	class="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-neutral-200/50 supports-[backdrop-filter]:bg-white/60">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex h-16 items-center justify-between">
			<!-- Logo / Title -->
			<a 
				href="/"
				class="group flex items-center space-x-2 text-neutral-900 transition-colors hover:text-blue-600">
				<div class="relative">
					<span class="text-2xl font-extrabold tracking-tight">展</span>
					<div class="absolute -inset-1 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 blur transition-opacity group-hover:opacity-20"></div>
				</div>
				<span class="hidden text-lg font-semibold tracking-wide sm:block">Zheon</span>
			</a>

			<!-- Auth navigation -->
			{#if !page.data.user}
				<nav>
					<button
						onclick={handleSignIn}
						class="group relative inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-600/25 transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-blue-600/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
						<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
							<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
							<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
							<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
							<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
						</svg>
						<span>Sign in with Google</span>
						<div class="absolute inset-0 rounded-full bg-white/20 opacity-0 transition-opacity group-hover:opacity-100"></div>
					</button>
				</nav>
			{:else}
				<div class="flex items-center space-x-4">
					<div class="hidden sm:block">
						<span class="text-sm font-medium text-neutral-700">
							안녕하세요, <span class="font-semibold text-neutral-900">{page.data.user.user_metadata.name}</span>님
						</span>
					</div>
					<button
						onclick={handleSignOut}
						class="group relative inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition-all hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
						</svg>
						<span>Sign out</span>
					</button>
				</div>
			{/if}
		</div>
	</div>
</header>

<!-- ─────────────────────────── SIGN‑IN DIALOG ─────────────────────────── -->
<dialog
	bind:this={signInDialog}
	class="m-auto max-w-md rounded-2xl border-0 bg-transparent p-0 backdrop:bg-black/50 backdrop:backdrop-blur-sm">
	<div class="relative overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
		<!-- 그라데이션 헤더 -->
		<div class="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4">
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-semibold text-neutral-900">로그인</h2>
				<form method="DIALOG">
					<button
						aria-label="닫기"
						class="rounded-full p-2 text-neutral-400 transition-colors hover:bg-white/50 hover:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
						<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
						</svg>
					</button>
				</form>
			</div>
		</div>
		<!-- 컨텐츠 -->
		<div class="p-6">
			<SignInForm onsuccess={onsuccessSignIn} />
		</div>
	</div>
</dialog>

<!-- ─────────────────────────── SIGN‑OUT DIALOG ─────────────────────────── -->
<dialog
	bind:this={signOutDialog}
	class="m-auto max-w-md rounded-2xl border-0 bg-transparent p-0 backdrop:bg-black/50 backdrop:backdrop-blur-sm">
	<div class="relative overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
		<!-- 그라데이션 헤더 -->
		<div class="bg-gradient-to-r from-red-50 to-orange-50 px-6 py-4">
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-semibold text-neutral-900">로그아웃</h2>
				<form method="DIALOG">
					<button
						aria-label="닫기"
						class="rounded-full p-2 text-neutral-400 transition-colors hover:bg-white/50 hover:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-red-500">
						<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
						</svg>
					</button>
				</form>
			</div>
		</div>
		<!-- 컨텐츠 -->
		<div class="p-6">
			<SignOutForm onsuccess={onSubmitSignOut} />
		</div>
	</div>
</dialog>
