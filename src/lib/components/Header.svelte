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
				<button onclick={handleSignIn} class="btn variant-filled-primary btn-sm" type="button">
					<span>시작하기 / 로그인</span>
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
				<button onclick={handleSignOut} class="btn variant-ghost-surface btn-base" type="button">
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
	class="m-auto max-w-md rounded-2xl border-0 bg-transparent p-0 backdrop:bg-black/80 backdrop:backdrop-blur-md">
	<div
		class="relative overflow-hidden rounded-2xl border border-primary-500/30 bg-surface-900/95 backdrop-blur-xl">
		<!-- Cyberpunk Grid Background -->
		<div class="absolute inset-0">
			<div
				class="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:2rem_2rem]">
			</div>
			<div
				class="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-secondary-500/10">
			</div>
		</div>

		<!-- Scan Lines Effect -->
		<div
			class="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,transparent_24%,rgba(var(--color-primary-500),0.03)_25%,rgba(var(--color-primary-500),0.03)_26%,transparent_27%,transparent_74%,rgba(var(--color-primary-500),0.03)_75%,rgba(var(--color-primary-500),0.03)_76%,transparent_77%,transparent)] bg-[length:50px_50px] animate-scan">
		</div>

		<div class="relative p-6 space-y-6">
			<!-- Header with Glitch Effect -->
			<header class="flex items-center justify-between border-b border-primary-500/20 pb-4">
				<div class="flex items-center gap-3">
					<div class="h-2 w-2 rounded-full bg-primary-400 animate-pulse"></div>
					<h2 class="font-mono text-2xl font-bold text-primary-400">AUTHENTICATE</h2>
				</div>
				<form method="dialog">
					<button
						aria-label="닫기"
						class="group rounded-lg border border-error-500/30 bg-error-500/10 p-2 transition-all hover:bg-error-500/20 hover:border-error-400"
						type="submit">
						<svg
							class="h-5 w-5 text-error-400"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</form>
			</header>

			<!-- Terminal Status -->
			<div class="rounded-lg border border-surface-700/50 bg-surface-900/80 p-3 font-mono text-xs">
				<div class="flex items-center gap-2 text-success-400">
					<span class="animate-pulse">▶</span>
					<span>system.auth.ready</span>
				</div>
				<div class="mt-1 text-surface-400">Awaiting user credentials...</div>
			</div>

			<!-- Content -->
			<SignInForm onsuccess={onsuccessSignIn} />
		</div>
	</div>
</dialog>

<!-- ─────────────────────────── SIGN‑OUT DIALOG ─────────────────────────── -->
<dialog
	bind:this={signOutDialog}
	class="m-auto max-w-md rounded-2xl border-0 bg-transparent p-0 backdrop:bg-black/80 backdrop:backdrop-blur-md">
	<div
		class="relative overflow-hidden rounded-2xl border border-error-500/30 bg-surface-900/95 backdrop-blur-xl">
		<!-- Cyberpunk Grid Background -->
		<div class="absolute inset-0">
			<div
				class="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:2rem_2rem]">
			</div>
			<div
				class="absolute inset-0 bg-gradient-to-br from-error-500/10 via-transparent to-surface-800/50">
			</div>
		</div>

		<!-- Scan Lines Effect -->
		<div
			class="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,transparent_24%,rgba(var(--color-error-500),0.03)_25%,rgba(var(--color-error-500),0.03)_26%,transparent_27%,transparent_74%,rgba(var(--color-error-500),0.03)_75%,rgba(var(--color-error-500),0.03)_76%,transparent_77%,transparent)] bg-[length:50px_50px] animate-scan">
		</div>

		<div class="relative p-6 space-y-6">
			<!-- Header with Warning Style -->
			<header class="flex items-center justify-between border-b border-error-500/20 pb-4">
				<div class="flex items-center gap-3">
					<div class="h-2 w-2 rounded-full bg-error-400 animate-pulse"></div>
					<h2 class="font-mono text-2xl font-bold text-error-400">DISCONNECT</h2>
				</div>
				<form method="dialog">
					<button
						aria-label="닫기"
						class="group rounded-lg border border-surface-600/30 bg-surface-700/20 p-2 transition-all hover:bg-surface-600/30 hover:border-surface-500"
						type="submit">
						<svg
							class="h-5 w-5 text-surface-400"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</form>
			</header>

			<!-- Terminal Warning -->
			<div class="rounded-lg border border-error-500/30 bg-error-500/10 p-3 font-mono text-xs">
				<div class="flex items-center gap-2 text-error-400">
					<span class="animate-pulse">⚠</span>
					<span>system.auth.termination</span>
				</div>
				<div class="mt-1 text-surface-400">Session will be terminated...</div>
			</div>

			<!-- Content -->
			<SignOutForm onsuccess={onSubmitSignOut} />
		</div>
	</div>
</dialog>
