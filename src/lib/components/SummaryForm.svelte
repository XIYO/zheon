<!-- 유튜브 URL 입력 폼 컴포넌트 -->
<script>
	import { enhance } from '$app/forms';
	import { slide } from 'svelte/transition';
	import { page } from '$app/state';
	import { urlSchema } from '$lib/schemas/url.js';

	let loading = $state(false);
	let errorMessage = $state('');

	/** @type {import('@sveltejs/kit').SubmitFunction} */
	function handleEnhance({ formData, cancel }) {
		// URL 검증
		const url = formData.get('youtubeUrl');
		const validation = urlSchema.safeParse(url);
		
		if (!validation.success) {
			errorMessage = validation.error.issues[0].message;
			cancel();
			return;
		}
		
		// 검증 성공 시 에러 메시지 초기화 및 로딩 시작
		errorMessage = '';
		loading = true;
		
		return async ({ result, update }) => {
			if (result.type === 'redirect') {
				// 로그인이 필요한 경우 리다이렉트 처리됨
				loading = false;
				// 리다이렉트는 자동으로 처리됨
			} else if (result.type === 'success' && result.data?.success) {
				// Edge Function 성공 처리
				if (result.data?.fromCache) {
					console.log('Existing summary found, displaying immediately');
				} else {
					console.log('New summary created successfully');
				}
				update({ invalidateAll: true });
			} else {
				update({ invalidateAll: true });
			}
			loading = false;
		};
	}
</script>

<div class="card preset-filled-surface-200-800 w-full mx-auto">
	{#if page.form?.message}
		{@const isRateLimit = page.form?.type === 'rate_limit'}
		<div
			in:slide
			class="mb-6 card {isRateLimit
				? 'preset-tonal-warning'
				: 'preset-tonal-error'}">
			<div class="flex items-start gap-4 p-6">
				<div class="flex-shrink-0">
					<span class="badge {isRateLimit ? 'preset-filled-warning-500' : 'preset-filled-error-500'}">
						{isRateLimit ? '⚠️' : '❌'}
					</span>
				</div>
				<div class="flex-1">
					<p class="text-sm font-medium">{page.form.message}</p>
					{#if isRateLimit}
						<p class="mt-2 text-xs opacity-80">
							현재 많은 사용자가 이용 중입니다. 5분 후에 다시 시도해주세요.
						</p>
						<p class="mt-1 text-xs opacity-70">
							💡 팁: 이미 요약된 영상은 아래 목록에서 바로 확인할 수 있습니다.
						</p>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<div class="p-6">
		<form method="POST" use:enhance={handleEnhance} class="space-y-4">
			<div class="space-y-2">
				<input
					name="youtubeUrl"
					placeholder="영상 URL을 입력하세요"
					type="text"
					class="input preset-tonal-surface w-full"
					disabled={loading} />
				{#if errorMessage}
					<p class="text-xs text-error-500" in:slide>
						{errorMessage}
					</p>
				{/if}
				<p class="text-xs text-surface-600 dark:text-surface-400">
					지원 서비스: YouTube
				</p>
			</div>

			<button
				class="btn preset-filled-primary-500 w-full"
				type="submit"
				disabled={loading}>
				{#if loading}
					영상 분석 중...
				{:else}
					인사이트 추출 시작 →
				{/if}
			</button>
		</form>
	</div>
</div>