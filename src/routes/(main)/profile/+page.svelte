<script>
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	

	function getProviderName(user) {
		const provider = user?.app_metadata?.provider;
		if (provider === 'google') return 'Google';
		if (provider === 'github') return 'GitHub';
		return provider || '이메일';
	}
</script>

<div class="container mx-auto max-w-md px-4 py-8">
	<h1 class="h1 mb-8">계정</h1>

	<div class="card preset-elevated p-6">
		<!-- 연결된 계정 -->
		<div class="mb-6">
			<h2 class="h2 mb-2 text-surface-600-400">연결된 계정</h2>
			<div class="flex items-center gap-3">
				<div
					class="flex size-12 items-center justify-center rounded-full bg-surface-200 dark:bg-surface-700">
					<svg class="size-6" fill="currentColor" viewBox="0 0 24 24">
						<path
							d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
					</svg>
				</div>
				<div>
					<p class="font-semibold">{getProviderName(page.data.user)}</p>
					<p class="text-sm text-surface-600 dark:text-surface-400">
						{page.data.user?.email}
					</p>
				</div>
			</div>
		</div>

		<!-- YouTube 구독 관리 -->
		<div class="mb-6">
			<h2 class="h2 mb-3 text-surface-600-400">연결된 서비스</h2>
			<a
				href={resolve('/youtube/subscriptions')}
				class="btn preset-elevated w-full mb-3 flex items-center justify-center gap-2">
				<svg class="size-5" viewBox="0 0 24 24" fill="currentColor">
					<path
						d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
				</svg>
				YouTube 구독 채널 관리
			</a>
		</div>

		<!-- 서비스 안내 -->
		<div class="mb-6 rounded-lg bg-surface-100 p-4 dark:bg-surface-800">
			<p class="text-sm leading-relaxed text-surface-700 dark:text-surface-300">
				Zheon은 별도의 개인정보를 저장하지 않아요. 언제든 로그아웃하시면 서비스 이용이 종료되며,
				다시 로그인하시면 바로 사용하실 수 있습니다.
			</p>
		</div>

		<!-- 로그아웃 -->
		<a href={resolve('/auth/sign-out')} class="btn preset-outlined w-full">로그아웃</a>
	</div>
</div>
