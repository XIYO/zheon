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

<div class="min-h-screen bg-gradient-to-br from-surface-50 via-surface-25 to-surface-100 px-4 py-12">
	<!-- 배경 패턴 -->
	<div class="fixed inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(59,130,246,0.1),transparent_50%)]"></div>
	<div class="fixed inset-0 bg-[radial-gradient(circle_at_75%_75%,rgba(168,85,247,0.1),transparent_50%)]"></div>
	
	<div class="relative flex flex-col items-center justify-start animate-fade-in">
		<!-- 헤더 섹션 -->
		<div class="mb-12 w-full max-w-xl">
			<div class="card relative overflow-hidden bg-surface-50/80 p-8 shadow-2xl backdrop-blur-xl border border-surface-200/50">
				<!-- 글로우 효과 -->
				<div class="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-secondary-500/5"></div>
				
				<div class="relative text-center">
					<div class="mb-4 inline-flex items-center space-x-3">
						<div class="relative">
							<span class="text-4xl font-black gradient-text">展</span>
							<div class="absolute -inset-1 rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 opacity-20 blur-lg"></div>
						</div>
						<h1 class="h2 font-black tracking-tight text-surface-900">요약</h1>
					</div>
					<p class="text-lg text-surface-600">유튜브 영상을 입력하면 AI가 요약해줍니다.</p>
				</div>
			</div>
		</div>

		<!-- 폼 섹션 -->
		<div class="mb-12 w-full max-w-xl">
			{#if page.form?.message}
				<div in:slide class="mb-6 card bg-error-50/80 backdrop-blur-sm border border-error-200/50">
					<div class="flex items-start gap-4 p-6">
						<div class="flex-shrink-0">
							<div class="rounded-full bg-error-100 p-2">
								<svg class="h-5 w-5 text-error-600" viewBox="0 0 20 20" fill="currentColor">
									<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
								</svg>
							</div>
						</div>
						<div class="flex-1">
							<p class="text-sm font-medium text-error-800">{page.form.message}</p>
						</div>
					</div>
				</div>
			{/if}

			<div class="card relative overflow-hidden bg-surface-50/60 p-8 shadow-xl backdrop-blur-xl border border-surface-200/50">
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
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
								</svg>
								<span>AI 요약 시작</span>
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
						<svg class="h-full w-full text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
						</svg>
					</div>
					<p class="h3 text-surface-500">아직 요약된 영상이 없습니다</p>
					<p class="mt-2 text-surface-400">첫 번째 유튜브 영상을 입력해 보세요!</p>
				</div>
			{:else}
				<div class="mb-8 text-center">
					<h2 class="h2 font-bold text-surface-900">요약 결과</h2>
					<p class="mt-2 text-lg text-surface-600">AI가 분석한 영상들을 확인해보세요</p>
				</div>

				<!-- 반응형 그리드: 모바일 1, 태블릿 2, 데스크탑 3~4 -->
				<div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{#each summaries as summary (summary.id)}
						<a
							href="/summary/{summary.id}/"
							class="card group relative overflow-hidden bg-surface-50/60 backdrop-blur-sm border border-surface-200/50 shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl hover:bg-surface-50/80">
							
							<!-- 썸네일 -->
							<div class="relative overflow-hidden">
								<img
									src={extractThumbnail(summary.youtube_url)}
									alt="썸네일"
									class="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-110" />
								<div class="absolute inset-0 bg-gradient-to-t from-surface-900/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
								
								<!-- 재생 아이콘 -->
								<div class="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100">
									<div class="rounded-full bg-surface-50/90 p-4 shadow-lg backdrop-blur-sm">
										<svg class="h-8 w-8 text-surface-700" fill="currentColor" viewBox="0 0 24 24">
											<path d="M8 5v14l11-7z"/>
										</svg>
									</div>
								</div>
							</div>
							
							<!-- 컨텐츠 -->
							<div class="p-6">
								<div class="mb-3">
									<h3 class="line-clamp-2 h4 font-bold text-surface-900 group-hover:text-primary-600 transition-colors">
										{summary.title}
									</h3>
								</div>
								<div class="line-clamp-3 text-sm leading-relaxed text-surface-600">
									{summary.summary}
								</div>
								
								<!-- 하단 메타데이터 -->
								<div class="mt-4 flex items-center justify-between">
									<div class="flex items-center gap-2">
										<div class="h-2 w-2 rounded-full bg-success-400"></div>
										<span class="text-xs font-medium text-surface-500">요약 완료</span>
									</div>
									<div class="chip bg-primary-100 text-primary-600">
										<span class="text-xs font-medium">AI 분석</span>
									</div>
								</div>
							</div>
							
							<!-- 호버 글로우 효과 -->
							<div class="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary-600/5 to-secondary-600/5 opacity-0 transition-opacity group-hover:opacity-100"></div>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
