<!-- 🙈 Sign-in form with OAuth and email options -->
<script>
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { dev } from '$app/environment';
	import GoogleIcon from '$lib/icons/GoogleIcon.svelte';
	import * as m from '$lib/paraglide/messages';
	
	/** @type {{ onsuccess?: () => void }} */
	const { onsuccess } = $props();
	
	const redirectToQuery = $derived.by(() => {
		const redirectTo = page.url.searchParams.get('redirectTo');
		return redirectTo
			? `&redirectTo=${encodeURIComponent(redirectTo)}`
			: '';
	});
</script>

<!-- Sign-in Form Container -->
<div class="card preset-filled-surface-500 max-w-md w-full">
	
	<!-- Header Section -->
	<header class="p-4 text-center">
		<h2 class="preset-typo-headline">{m.auth_sign_in_title()}</h2>
		<p class="preset-typo-subtitle">{m.auth_sign_in_subtitle()}</p>
	</header>

	<hr class="border-surface-500/20" />

	<!-- Content Section -->
	<section class="p-4 space-y-4">
		{#if dev}
			<!-- Email/Password Login Form (Dev only) -->
			<form
				action={`/auth/sign-in/?/email${redirectToQuery}`}
				method="POST"
				class="space-y-4"
				use:enhance={() => {
					return async ({ result, update }) => {
						if (result.type === 'redirect') {
							onsuccess?.();
							goto(result.location);
						}
						await update();
					};
				}}>
				<div>
					<label for="email" class="preset-typo-label block mb-2">
						이메일
					</label>
					<input
						id="email"
						name="email"
						type="email"
						required
						placeholder="your@email.com"
						class="input preset-tonal-surface-500 w-full" />
				</div>
				
				<div>
					<label for="password" class="preset-typo-label block mb-2">
						비밀번호
					</label>
					<input
						id="password"
						name="password"
						type="password"
						required
						placeholder="비밀번호를 입력하세요"
						class="input preset-tonal-surface-500 w-full" />
				</div>
				
				<button
					type="submit"
					class="btn preset-filled-primary-500 w-full preset-typo-button">
					로그인
				</button>
			</form>
			
			<div class="flex items-center gap-4">
				<hr class="flex-1 border-surface-400/30" />
				<span class="preset-typo-caption text-surface-300">또는</span>
				<hr class="flex-1 border-surface-400/30" />
			</div>
		{/if}
		
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
			<button
				type="submit"
				class="btn preset-tonal-surface-500 w-full preset-typo-button">
				<GoogleIcon size={20} class="h-5 w-5" />
				<span>{m.auth_sign_in_google_button()}</span>
			</button>
		</form>
	</section>

	<hr class="border-surface-500/20" />

	<!-- Footer Section -->
	<footer class="p-4 text-center space-y-3">
		<p class="preset-typo-caption">
			{m.auth_sign_in_terms_notice()}
			<a href="/terms" class="text-primary-400 hover:text-primary-300 underline">{m.auth_sign_in_terms_link()}</a>
			{m.auth_sign_in_and()}
			<a href="/privacy" class="text-primary-400 hover:text-primary-300 underline">{m.auth_sign_in_privacy_link()}</a>
			{m.auth_sign_in_terms_agree()}
		</p>
		
		<div class="pt-2">
			<p class="preset-typo-body">
				아직 회원이 아니신가요?
				<a href="/auth/sign-up" class="text-primary-400 hover:text-primary-300 underline font-medium">
					회원가입
				</a>
			</p>
		</div>
	</footer>
</div>