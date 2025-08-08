<!-- 🙈 Sign-out form with Cyberpunk theme -->
<script>
	import { applyAction, enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	/** @type {{ onsuccess?: () => void }} */
	const { onsuccess } = $props();

	/** @type {import('@sveltejs/kit').SubmitFunction} */
	const handleEnhance = () => {
		return ({ result }) => {
			if (result.type === 'redirect') {
				onsuccess?.();
				goto(result.location, { invalidateAll: true });
			} else {
				applyAction(result);
			}
		};
	};
</script>

<div class="space-y-6">
	<!-- Warning Visual -->
	<div class="relative">
		<div class="flex justify-center">
			<div class="relative">
				<!-- Pulsing Warning Icon -->
				<div
					class="absolute -inset-4 rounded-full bg-gradient-to-r from-error-500/20 via-warning-500/20 to-error-500/20 blur-xl animate-pulse">
				</div>
				<div
					class="relative rounded-2xl border border-error-500/30 bg-surface-900/50 p-6 backdrop-blur">
					<svg
						class="h-16 w-16 text-error-400"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
					</svg>
				</div>
			</div>
		</div>

		<!-- Warning Text -->
		<div class="mt-6 text-center space-y-2">
			<p class="font-mono text-sm text-error-400">SESSION TERMINATION REQUEST</p>
			<p class="text-xs text-surface-400">All active processes will be terminated</p>
		</div>
	</div>

	<!-- System Message -->
	<div class="rounded-lg border border-warning-500/30 bg-warning-500/10 p-4">
		<div class="space-y-2">
			<div class="flex items-center gap-2">
				<div class="h-2 w-2 rounded-full bg-warning-400 animate-pulse"></div>
				<p class="font-mono text-sm text-warning-400">WARNING: SYSTEM LOGOUT</p>
			</div>
			<div class="pl-4 space-y-1 font-mono text-xs text-surface-400">
				<p>> Current session will be invalidated</p>
				<p>> Authentication tokens will be revoked</p>
				<p>> Redirecting to public zone...</p>
			</div>
		</div>
	</div>

	<!-- Action Buttons -->
	<form action="/auth/sign-out/" method="POST" use:enhance={handleEnhance} class="space-y-3">
		<!-- Disconnect Button -->
		<button
			type="submit"
			class="group relative w-full overflow-hidden rounded-lg border border-error-500/50 bg-error-500/10 px-6 py-4 font-mono font-bold text-error-300 backdrop-blur-xl transition-all hover:border-error-400 hover:bg-error-500/20 hover:shadow-[0_0_30px_rgba(var(--color-error-500),0.5)]">
			<!-- Gradient Background -->
			<div
				class="absolute inset-0 bg-gradient-to-r from-error-500/0 via-error-500/20 to-error-500/0 opacity-0 transition-opacity group-hover:opacity-100">
			</div>

			<!-- Button Content -->
			<div class="relative flex items-center justify-center gap-3">
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
				</svg>
				<span class="tracking-wider">TERMINATE SESSION</span>
				<svg
					class="h-5 w-5 transition-transform group-hover:translate-x-1"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
				</svg>
			</div>

			<!-- Scan Line Effect -->
			<div
				class="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-error-400 to-transparent opacity-0 group-hover:opacity-100 animate-scan-horizontal">
			</div>
		</button>

		<!-- Cancel Button -->
		<button
			type="button"
			onclick={() => document.querySelector('dialog[open]')?.close()}
			class="group relative w-full overflow-hidden rounded-lg border border-surface-600/50 bg-surface-900/50 px-6 py-4 font-mono font-bold text-surface-300 backdrop-blur-xl transition-all hover:border-surface-500 hover:bg-surface-800/50">
			<!-- Button Content -->
			<div class="relative flex items-center justify-center gap-3">
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12" />
				</svg>
				<span class="tracking-wider">ABORT OPERATION</span>
			</div>
		</button>
	</form>
</div>

<style>
	@keyframes scan-horizontal {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(100%);
		}
	}

	.animate-scan-horizontal {
		animation: scan-horizontal 2s linear infinite;
	}
</style>
