<!-- 🙈 Header component with Skeleton UI design -->
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
	class="sticky top-0 z-50 backdrop-blur-xl preset-tonal-surface flex items-center justify-between px-6 py-4">
	<div class="flex items-center">
		<a
			href="/"
			class="group flex items-center space-x-3 transition-colors hover:preset-tonal-primary">
			<div class="relative">
				<span class="text-3xl font-black tracking-tight gradient-text">展</span>
				<div
					class="absolute -inset-2 rounded-xl bg-gradient-to-r from-primary-600 to-secondary-600 opacity-0 blur transition-opacity group-hover:opacity-20">
				</div>
			</div>
			<div class="hidden sm:block">
				<span class="text-xl font-bold tracking-wide">Zheon</span>
				<div class="text-xs opacity-70 font-medium">YouTube AI 요약</div>
			</div>
		</a>
	</div>

	<div class="flex items-center">
		{#if !page.data.user}
			<nav>
				<button onclick={handleSignIn} class="btn variant-filled-primary btn-lg" type="button">
					<svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
						<path
							fill="#4285F4"
							d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
						<path
							fill="#34A853"
							d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
						<path
							fill="#FBBC05"
							d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
						<path
							fill="#EA4335"
							d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
					</svg>
					<span>Google 로그인</span>
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
							{page.data.user.user_metadata.name}님
						</div>
						<div class="opacity-70">환영합니다!</div>
					</div>
				</div>
				<button onclick={handleSignOut} class="btn hover:preset-tonal btn-base" type="button">
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
					</svg>
					<span class="hidden sm:inline">로그아웃</span>
				</button>
			</div>
		{/if}
	</div>
</header>

<!-- ─────────────────────────── SIGN‑IN DIALOG ─────────────────────────── -->
<dialog
	bind:this={signInDialog}
	class="m-auto max-w-md rounded-2xl border-0 bg-transparent p-0 backdrop:bg-black/50 backdrop:backdrop-blur-sm">
	<div class="card p-6 space-y-6 preset-tonal-surface shadow-2xl">
		<!-- 헤더 -->
		<header class="flex items-center justify-between">
			<h2 class="h3 font-bold gradient-text">로그인</h2>
			<form method="DIALOG">
				<button aria-label="닫기" class="btn hover:preset-tonal btn-sm" type="button">
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</form>
		</header>
		<!-- 컨텐츠 -->
		<SignInForm onsuccess={onsuccessSignIn} />
	</div>
</dialog>

<!-- ─────────────────────────── SIGN‑OUT DIALOG ─────────────────────────── -->
<dialog
	bind:this={signOutDialog}
	class="m-auto max-w-md rounded-2xl border-0 bg-transparent p-0 backdrop:bg-black/50 backdrop:backdrop-blur-sm">
	<div class="card p-6 space-y-6 preset-tonal-surface shadow-2xl">
		<!-- 헤더 -->
		<header class="flex items-center justify-between">
			<h2 class="h3 font-bold preset-tonal-error">로그아웃</h2>
			<form method="DIALOG">
				<button aria-label="닫기" class="btn hover:preset-tonal btn-sm" type="button">
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</form>
		</header>
		<!-- 컨텐츠 -->
		<SignOutForm onsuccess={onSubmitSignOut} />
	</div>
</dialog>
