<!-- 🙈 Sign-in form with OAuth and email options -->
<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import GoogleIcon from '$lib/icons/GoogleIcon.svelte';
	import * as m from '$lib/paraglide/messages';

	/** @type {{ onsuccess?: () => void }} */
	const { onsuccess } = $props();

	const redirectToQuery = $derived.by(() => {
		const redirectTo = page.url.searchParams.get('redirectTo');
		return redirectTo ? `&redirectTo=${encodeURIComponent(redirectTo)}` : '';
	});
</script>

<!-- Sign-in Form Container -->
<div class="max-w-md w-full">
	<!-- Header Section -->
	<header class="p-4 text-center">
		<h2 class="text-xl font-bold">{m.auth_sign_in_title()}</h2>
		<p>{m.auth_sign_in_subtitle()}</p>
	</header>

	<hr class="border-surface-500/20" />

	<!-- Content Section -->
	<section class="p-4 space-y-4">
		<!-- Google Login Form -->
		<form
			action={`/auth/sign-in/?/google${redirectToQuery}`}
			method="POST"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'redirect') {
						onsuccess?.();
					}
					await update();
				};
			}}>
			<button type="submit" class="btn preset-filled-primary-500 w-full ">
				<GoogleIcon size={20} class="h-5 w-5" />
				<span>{m.auth_sign_in_google_button()}</span>
			</button>
		</form>
	</section>

</div>
