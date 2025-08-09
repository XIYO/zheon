<!-- 🙈 Sign-up form with OAuth and email options -->
<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import GoogleIcon from '$lib/icons/GoogleIcon.svelte';
	import * as m from '$lib/paraglide/messages';

	/** @type {{ onsuccess?: () => void }} */
	const { onsuccess } = $props();
	
	let showEmailForm = $state(false);
	let email = $state('');
	let password = $state('');
	let passwordConfirm = $state('');
	
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
<div class="card preset-filled-surface-500 max-w-md w-full">
	
	<!-- Header Section -->
	<header class="p-4 text-center">
		<h2 class="preset-typo-headline">회원가입</h2>
		<p class="preset-typo-subtitle">Zheon에 오신 것을 환영합니다</p>
	</header>

	<hr class="border-surface-500/20" />

	<!-- Content Section -->
	<section class="p-4 space-y-3">
		{#if !showEmailForm}
			<!-- OAuth Sign-up Options -->
			<form
				action={`/auth/sign-up/?/google${redirectToQuery}`}
				method="POST"
				use:enhance={handleEnhance}>
				<button
					type="submit"
					class="btn preset-filled-primary-500 w-full preset-typo-button">
					<GoogleIcon size={20} class="h-5 w-5" />
					<span>Google로 회원가입</span>
				</button>
			</form>
			
			<div class="flex items-center gap-4 my-4">
				<hr class="flex-1 border-surface-400/30" />
				<span class="preset-typo-caption text-surface-300">또는</span>
				<hr class="flex-1 border-surface-400/30" />
			</div>
			
			<button
				type="button"
				onclick={() => showEmailForm = true}
				class="btn preset-tonal-surface-500 w-full preset-typo-button">
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
						d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
				</svg>
				<span>이메일로 회원가입</span>
			</button>
		{:else}
			<!-- Email Sign-up Form -->
			<button
				type="button"
				onclick={() => showEmailForm = false}
				class="btn preset-ghost-surface-500 w-full preset-typo-button mb-4">
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
						d="M10 19l-7-7m0 0l7-7m-7 7h18" />
				</svg>
				<span>다른 방법으로 회원가입</span>
			</button>
			
			<form
				action={`/auth/sign-up/?/email${redirectToQuery}`}
				method="POST"
				class="space-y-4"
				use:enhance={handleEnhance}>
				
				<div>
					<label for="email" class="preset-typo-label block mb-2">
						이메일
					</label>
					<input
						id="email"
						name="email"
						type="email"
						bind:value={email}
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
						bind:value={password}
						required
						minlength="6"
						placeholder="최소 6자 이상"
						class="input preset-tonal-surface-500 w-full" />
				</div>
				
				<div>
					<label for="password-confirm" class="preset-typo-label block mb-2">
						비밀번호 확인
					</label>
					<input
						id="password-confirm"
						name="password-confirm"
						type="password"
						bind:value={passwordConfirm}
						required
						minlength="6"
						placeholder="비밀번호를 다시 입력해주세요"
						class="input preset-tonal-surface-500 w-full" />
				</div>
				
				<button
					type="submit"
					class="btn preset-filled-primary-500 w-full preset-typo-button"
					disabled={!email || !password || password !== passwordConfirm}>
					회원가입
				</button>
			</form>
		{/if}
	</section>

	<hr class="border-surface-500/20" />

	<!-- Footer Section -->
	<footer class="p-4 text-center space-y-3">
		<p class="preset-typo-caption">
			회원가입 시
			<a href="/terms" class="text-primary-400 hover:text-primary-300 underline">이용약관</a>
			및
			<a href="/privacy" class="text-primary-400 hover:text-primary-300 underline">개인정보처리방침</a>에
			동의하는 것으로 간주됩니다.
		</p>
		
		<div class="pt-2">
			<p class="preset-typo-body">
				이미 계정이 있으신가요?
				<a href="/auth/sign-in" class="text-primary-400 hover:text-primary-300 underline font-medium">
					로그인
				</a>
			</p>
		</div>
	</footer>
</div>