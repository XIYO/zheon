<!-- 🙈 Sign-up form with OAuth and email options -->
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
			: `&redirectTo=${encodeURIComponent('/')}`;
	});

	/** @type {import('@sveltejs/kit').SubmitFunction} */
	const handleEnhance = ({ submitter }) => {
		submitter?.setAttribute('disabled', 'true');

		return ({ result }) => {
			if (result.type === 'redirect') {
				onsuccess?.();
				// OAuth 외부 URL은 window.location 사용
				if (result.location.startsWith('http')) {
					window.location.href = result.location;
				}
			} else {
				submitter?.removeAttribute('disabled');
			}
		};
	};
</script>

<!-- Sign-up Form as root element -->
<div class="max-w-md w-full">
	<!-- Header Section -->
	<header class="p-4 text-center">
		<h2 class="text-xl font-bold">회원가입</h2>
		<p>Zheon에 오신 것을 환영합니다</p>
	</header>

	<hr class="border-surface-500/20" />

	<!-- Content Section -->
	<section class="p-4 space-y-3">
		<!-- OAuth Sign-up Options -->
		<form
			action={`/auth/sign-up/?/google${redirectToQuery}`}
			method="POST"
			use:enhance={handleEnhance}>
			<button type="submit" class="btn preset-filled-primary-500 w-full ">
				<GoogleIcon size={20} class="h-5 w-5" />
				<span>Google로 회원가입</span>
			</button>
		</form>
	</section>

	<hr class="border-surface-500/20" />

	<!-- Footer Section -->
	<footer class="p-4 text-center space-y-3">
		<p class="text-sm">
			회원가입 시
			<a href="/terms" class="text-primary-400 hover:text-primary-300 underline">이용약관</a>
			및
			<a href="/privacy" class="text-primary-400 hover:text-primary-300 underline">
				개인정보처리방침
			</a>
			에 동의하는 것으로 간주됩니다.
		</p>
	</footer>
</div>
