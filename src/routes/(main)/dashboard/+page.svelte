<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { slide } from 'svelte/transition';
	import { handleSignIn } from '$lib/components/Header.svelte';

	let { data } = $props();
	let summaries = $derived(data.summaries);

	let loading = $state(false);

	/** @type {import('@sveltejs/kit').SubmitFunction} */
	function handleEnhance() {
		loading = true;
		return async ({ result, update }) => {
			if (result.type === 'redirect') {
				handleSignIn();
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

	function extractYoutubeId(url) {
		try {
			const parsedUrl = new URL(url);

			// youtu.be 형태 처리
			if (parsedUrl.hostname === 'youtu.be') {
				return parsedUrl.pathname.slice(1); // '/' 제거
			}

			// youtube.com 형태 처리
			if (parsedUrl.hostname.includes('youtube.com')) {
				return parsedUrl.searchParams.get('v') || '';
			}
		} catch {
			return '';
		}
		return '';
	}

	function extractThumbnail(url) {
		const id = extractYoutubeId(url);
		return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
	}
</script>

<div class="min-h-screen preset-tonal-surface px-4 py-12">
	<!-- 배경 패턴 -->
	<div
		class="fixed inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(59,130,246,0.1),transparent_50%)]">
	</div>
	<div
		class="fixed inset-0 bg-[radial-gradient(circle_at_75%_75%,rgba(168,85,247,0.1),transparent_50%)]">
	</div>

	<div class="relative flex flex-col items-center justify-start animate-fade-in">
		<!-- 헤더 섹션 -->
		<div class="mb-12 w-full max-w-xl">
			<div
				class="card relative overflow-hidden preset-tonal-surface p-8 shadow-2xl backdrop-blur-xl">
				<!-- 글로우 효과 -->
				<div class="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-secondary-500/5"></div>

				<div class="relative text-center">
					<div class="mb-4 inline-flex items-center space-x-3">
						<div class="relative">
							<span class="text-4xl font-black gradient-text">展</span>
							<div
								class="absolute -inset-1 rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 opacity-20 blur-lg">
							</div>
						</div>
						<h1 class="h2 font-black tracking-tight">요약</h1>
					</div>
					<p class="text-lg opacity-80">
						유튜브 영상의 영어 자막을 AI가 한국어로 번역 및 요약해줍니다.
					</p>
				</div>
			</div>
		</div>

		<!-- 폼 섹션 -->
		<div class="mb-12 w-full max-w-xl">
			{#if page.form?.message}
				{@const isRateLimit = page.form?.type === 'rate_limit'}
				<div
					in:slide
					class="mb-6 card {isRateLimit
						? 'preset-tonal-warning'
						: 'preset-tonal-error'} backdrop-blur-sm">
					<div class="flex items-start gap-4 p-6">
						<div class="flex-shrink-0">
							<div
								class="rounded-full {isRateLimit
									? 'preset-filled-warning-500'
									: 'preset-filled-error-500'} p-2">
								{#if isRateLimit}
									<svg class="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
										<path
											fill-rule="evenodd"
											d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
											clip-rule="evenodd" />
									</svg>
								{:else}
									<svg class="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
										<path
											fill-rule="evenodd"
											d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
											clip-rule="evenodd" />
									</svg>
								{/if}
							</div>
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

			<div
				class="card relative overflow-hidden preset-tonal-surface p-8 shadow-xl backdrop-blur-xl">
				<form method="POST" use:enhance={handleEnhance} class="space-y-6">
					<div class="relative">
						<input
							name="youtubeUrl"
							placeholder="유튜브 주소를 입력하세요"
							required
							type="text"
							class="input w-full text-lg transition-all focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50"
							disabled={loading} />
					</div>

					<button
						class="btn variant-filled-primary btn-xl w-full transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
						type="submit"
						disabled={loading}>
						<div class="flex items-center justify-center gap-3">
							{#if loading}
								<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
								<span>분석 중...</span>
							{:else}
								<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13 10V3L4 14h7v7l9-11h-7z" />
								</svg>
								<span>AI 번역 및 요약 시작</span>
							{/if}
						</div>
					</button>
				</form>
			</div>
		</div>

		<!-- 결과 섹션 -->
		<div class="w-full max-w-7xl">
			{#if summaries?.length === 0}
				<div class="text-center">
					<div class="mx-auto mb-6 h-32 w-32 opacity-20">
						<svg
							class="h-full w-full opacity-60"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1"
								d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
						</svg>
					</div>
					<p class="h3 opacity-70">아직 요약된 영상이 없습니다</p>
					<p class="mt-2 opacity-60">첫 번째 유튜브 영상을 입력해 보세요!</p>
				</div>
			{:else}
				<div class="mb-8 text-center">
					<h2 class="h2 font-bold">요약 결과</h2>
					<p class="mt-2 text-lg opacity-80">AI가 분석한 영상들을 확인해보세요</p>
				</div>

				<!-- 반응형 그리드: 모바일 1, 태블릿 2, 데스크탑 3~4 -->
				<div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{#each summaries as summary (summary.id)}
						<a
							href="/summary/{summary.id}/"
							class="card group relative overflow-hidden preset-tonal-surface backdrop-blur-sm shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl hover:preset-tonal-primary">
							<!-- 썸네일 -->
							<div class="relative overflow-hidden">
								<img
									src={extractThumbnail(summary.url)}
									alt="썸네일"
									class="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-110" />
								<div
									class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
								</div>

								<!-- 재생 아이콘 -->
								<div
									class="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100">
									<div class="rounded-full preset-tonal p-4 shadow-lg backdrop-blur-sm">
										<svg class="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
											<path d="M8 5v14l11-7z" />
										</svg>
									</div>
								</div>
							</div>

							<!-- 컨텐츠 -->
							<div class="p-6">
								<div class="mb-3">
									<h3 class="line-clamp-2 h4 font-bold transition-colors">
										{summary.title}
									</h3>
								</div>
								<div class="line-clamp-3 text-sm leading-relaxed opacity-80">
									{summary.summary}
								</div>

								<!-- 하단 메타데이터 -->
								<div class="mt-4 flex items-center justify-between">
									<div class="flex items-center gap-2">
										<div class="h-2 w-2 rounded-full preset-filled-success-500"></div>
										<span class="text-xs font-medium opacity-70">요약 완료</span>
									</div>
									<div class="chip preset-tonal-primary">
										<span class="text-xs font-medium">AI 분석</span>
									</div>
								</div>
							</div>

							<!-- 호버 글로우 효과 -->
							<div
								class="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary-600/5 to-secondary-600/5 opacity-0 transition-opacity group-hover:opacity-100">
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
