<!-- 🙈 Sign-out form with clean design -->
<script>
	import { applyAction, enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import * as m from '$lib/paraglide/messages';

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

<!-- Sign-out Form as root element -->
<form 
	action="/auth/sign-out/" 
	method="POST" 
	use:enhance={handleEnhance} 
	class="card preset-outlined-error-500 flex flex-col">
	
	<!-- Header Section -->
	<header class="p-6 text-center">
		<h2 class="preset-typo-headline text-error-400">{m.auth_sign_out_title()}</h2>
		<p class="preset-typo-subtitle">{m.auth_sign_out_confirm()}</p>
	</header>

	<hr class="border-surface-500/20" />

	<!-- Content Section -->
	<section class="p-6 space-y-6">
		<!-- Warning Message -->
		<div class="preset-tonal-warning-500 p-4 rounded-lg">
			<div class="flex items-start gap-3">
				<svg class="h-5 w-5 text-warning-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
				</svg>
				<div>
					<p class="preset-typo-menu text-warning-400">{m.auth_sign_out_warning_title()}</p>
					<ul class="mt-2 space-y-1 preset-typo-caption">
						<li>• {m.auth_sign_out_warning_session()}</li>
						<li>• {m.auth_sign_out_warning_unsaved()}</li>
						<li>• {m.auth_sign_out_warning_relogin()}</li>
					</ul>
				</div>
			</div>
		</div>
	</section>

	<hr class="border-surface-500/20" />

	<!-- Footer Section -->
	<footer class="p-6 flex gap-3">
		<!-- Cancel Button -->
		<button
			type="button"
			onclick={() => document.querySelector('dialog[open]')?.close()}
			class="btn preset-ghost-surface-500 btn-base flex-1 preset-typo-button">
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
					d="M6 18L18 6M6 6l12 12" />
			</svg>
			<span>{m.auth_sign_out_cancel()}</span>
		</button>

		<!-- Sign Out Button -->
		<button
			type="submit"
			class="btn preset-filled-error-500 btn-base flex-1 preset-typo-button">
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
					d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
			</svg>
			<span>{m.auth_sign_out_logout_button()}</span>
		</button>
	</footer>
</form>