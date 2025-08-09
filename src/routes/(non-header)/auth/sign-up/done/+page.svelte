<!-- 회원가입 완료 페이지 -->
<script>
	import { page } from '$app/state';
	
	const isEmailVerificationPending = $derived(
		page.url.searchParams.get('email-verification') === 'pending'
	);
</script>

<div class="h-screen w-screen flex items-center justify-center">
	<div class="card preset-filled-surface-500 max-w-md w-full mx-4">
		<!-- Header Section -->
		<header class="p-6 text-center">
			{#if isEmailVerificationPending}
				<div class="mb-4">
					<svg class="h-16 w-16 mx-auto text-warning-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
							d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
					</svg>
				</div>
				<h2 class="preset-typo-headline">이메일을 확인해주세요</h2>
				<p class="preset-typo-subtitle mt-2">
					회원가입을 완료하려면 이메일로 전송된 확인 링크를 클릭해주세요.
				</p>
			{:else}
				<div class="mb-4">
					<svg class="h-16 w-16 mx-auto text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
							d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<h2 class="preset-typo-headline">회원가입 완료!</h2>
				<p class="preset-typo-subtitle mt-2">
					회원가입이 성공적으로 완료되었습니다.
				</p>
			{/if}
		</header>

		<hr class="border-surface-500/20" />

		<!-- Content Section -->
		<section class="p-6 space-y-4">
			{#if isEmailVerificationPending}
				<div class="preset-typo-body text-surface-200">
					<p class="mb-3">다음 단계를 따라주세요:</p>
					<ol class="list-decimal list-inside space-y-2">
						<li>받은 편지함을 확인하세요</li>
						<li>Zheon에서 보낸 이메일을 찾으세요</li>
						<li>이메일의 확인 링크를 클릭하세요</li>
						<li>로그인 페이지로 이동하여 로그인하세요</li>
					</ol>
				</div>
				
				<div class="preset-filled-warning-500 p-4 rounded-lg">
					<p class="preset-typo-caption">
						<strong>이메일을 찾을 수 없나요?</strong><br>
						스팸 폴더를 확인하거나 몇 분 기다려보세요.
					</p>
				</div>
			{:else}
				<p class="preset-typo-body text-center">
					이제 로그인하여 Zheon의 모든 기능을 이용할 수 있습니다.
				</p>
			{/if}
			
			<div class="flex gap-3">
				<a href="/auth/sign-in" class="btn preset-filled-primary-500 flex-1 preset-typo-button">
					로그인 페이지로
				</a>
				<a href="/" class="btn preset-tonal-surface-500 flex-1 preset-typo-button">
					홈으로
				</a>
			</div>
		</section>
	</div>
</div>