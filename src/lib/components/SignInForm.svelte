<!-- 🙈 OAuth sign-in form with clean design -->
<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import GoogleIcon from '$lib/icons/GoogleIcon.svelte';
	import * as m from '$lib/paraglide/messages';

	/** @type {{ onsuccess?: () => void }} */
	const { onsuccess } = $props();
	
	const redirectToQuery = $derived.by(() => {
		const redirectTo = page.url.searchParams.get('redirectTo');
		return redirectTo
			? `&redirectTo=${encodeURIComponent(redirectTo)}`
			: `&redirectTo=${encodeURIComponent(page.url.pathname)}`;
	});

	/** @type {import('@sveltejs/kit').SubmitFunction} */
	const handleEnhance = ({ submitter }) => {
		submitter?.setAttribute('disabled', 'true');

		return ({ result }) => {
			if (result.type === 'redirect') {
				onsuccess?.();
				// OAuth 외부 URL은 window.location 사용
				window.location.href = result.location;
			} else {
				submitter?.removeAttribute('disabled');
			}
		};
	};
</script>

<!-- OAuth Sign-in Form as root element -->
<form
	action={`/auth/sign-in/?/google${redirectToQuery}`}
	method="POST"
	class="card preset-outlined-primary-500"
	use:enhance={handleEnhance}>
	
	<!-- Header Section -->
	<header class="p-4 text-center">
		<h2 class="preset-typo-headline">{m.auth_sign_in_title()}</h2>
		<p class="preset-typo-subtitle">{m.auth_sign_in_subtitle()}</p>
	</header>

	<hr class="border-surface-500/20" />

	<!-- Content Section -->
	<section class="p-4">
		<!-- Google Login Button -->
		<button
			type="submit"
			class="btn preset-filled-primary-500 w-full preset-typo-button">
			<GoogleIcon size={20} class="h-5 w-5" />
			<span>{m.auth_sign_in_google_button()}</span>
		</button>
	</section>

	<hr class="border-surface-500/20" />

	<!-- Footer Section -->
	<footer class="p-4 text-center">
		<p class="preset-typo-caption">
			{m.auth_sign_in_terms_notice()}
			<a href="/terms" class="text-primary-400 hover:text-primary-300 underline">{m.auth_sign_in_terms_link()}</a>
			{m.auth_sign_in_and()}
			<a href="/privacy" class="text-primary-400 hover:text-primary-300 underline">{m.auth_sign_in_privacy_link()}</a>
			{m.auth_sign_in_terms_agree()}
		</p>
	</footer>
</form>