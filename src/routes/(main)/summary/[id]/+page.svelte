<script>
	let { data } = $props();
	let summary = $derived(data.summary);

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

	function formatDate(dateString) {
		return new Date(dateString).toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="min-h-screen preset-tonal-surface">
	<!-- 배경 패턴 -->
	<div class="fixed inset-0 preset-glass-primary opacity-10"></div>

	<div class="relative px-4 py-8">
		<div class="mx-auto max-w-6xl">
			<!-- 향상된 헤더 -->
			<div class="mb-8">
				<div class="flex items-center justify-between">
					<a
						href="/"
						class="group inline-flex items-center gap-3 rounded-2xl border border-surface-200-800/40 preset-glass-surface px-6 py-3 font-medium text-surface-700-300 shadow-lg backdrop-blur-sm transition-all hover:preset-tonal-primary hover:shadow-xl hover:scale-[1.02]">
						<svg
							class="h-5 w-5 transition-transform group-hover:-translate-x-1"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 19l-7-7 7-7">
							</path>
						</svg>
						<span>홈으로 돌아가기</span>
					</a>

					<!-- 브랜드 로고 -->
					<div class="flex items-center space-x-3">
						<div class="relative">
							<span class="text-3xl font-black text-surface-900-100">展</span>
							<div class="absolute -inset-1 rounded-lg preset-tonal-primary opacity-15 blur-lg">
							</div>
						</div>
						<span class="text-xl font-bold text-surface-900-100">Zheon</span>
					</div>
				</div>
			</div>

			<!-- 메인 컨텐츠 -->
			<div class="grid gap-8 lg:grid-cols-3">
				<!-- 좌측: 영상 정보 -->
				<div class="lg:col-span-1">
					<div class="sticky top-8 space-y-6">
						<!-- 영상 카드 -->
						<div
							class="relative overflow-hidden rounded-3xl border border-surface-200-800/40 preset-glass-surface shadow-2xl backdrop-blur-xl">
							<!-- 글로우 효과 -->
							<div class="absolute inset-0 preset-tonal-primary opacity-5"></div>

							<div class="relative">
								<!-- 썸네일 -->
								<div class="relative overflow-hidden">
									<img
										src={extractThumbnail(summary.url)}
										alt="Video thumbnail"
										class="aspect-video w-full object-cover" />
									<div class="absolute inset-0 preset-tonal-surface opacity-40"></div>

									<!-- 재생 버튼 -->
									<a
										href={summary.url}
										target="_blank"
										rel="noopener noreferrer"
										aria-label="YouTube에서 영상 재생"
										class="absolute inset-0 flex items-center justify-center group">
										<div
											class="rounded-full preset-tonal-surface p-6 shadow-2xl backdrop-blur-sm transition-all group-hover:preset-filled-error group-hover:scale-110">
											<svg class="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
												<path d="M8 5v14l11-7z" />
											</svg>
										</div>
									</a>
								</div>

								<!-- 영상 정보 -->
								<div class="p-6">
									<h1 class="mb-4 h3 text-surface-900-100 leading-tight">
										{summary.title}
									</h1>

									<div class="space-y-3">
										<div class="flex items-center gap-3">
											<div class="rounded-full preset-tonal-primary p-2">
												<svg
													class="h-4 w-4 text-primary-600-400"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
												</svg>
											</div>
											<div>
												<div class="text-sm font-medium text-surface-700-300">생성일</div>
												<div class="text-xs text-surface-500-500">
													{formatDate(summary.created_at)}
												</div>
											</div>
										</div>

										<div class="flex items-center gap-3">
											<div class="rounded-full preset-tonal-secondary p-2">
												<svg
													class="h-4 w-4 text-secondary-600-400"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
												</svg>
											</div>
											<div>
												<div class="text-sm font-medium text-surface-700-300">언어</div>
												<div class="text-xs text-surface-500-500">
													{summary.lang === 'ko' ? '한국어' : 'English'}
												</div>
											</div>
										</div>
									</div>

									<!-- YouTube 링크 -->
									<a
										href={summary.url}
										target="_blank"
										rel="noopener noreferrer"
										class="mt-6 btn variant-filled-error btn-lg w-full justify-center gap-3">
										<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
											<path
												d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
										</svg>
										<span>YouTube에서 보기</span>
									</a>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- 우측: 컨텐츠 영역 -->
				<div class="lg:col-span-2">
					<div class="space-y-8">
						<!-- 탭 네비게이션 -->
						<div
							class="flex space-x-1 rounded-3xl border border-surface-200-800/40 preset-glass-surface p-2 backdrop-blur-xl">
							<button class="btn variant-filled-primary btn-base flex-1">📝 AI 요약</button>
							<button
								class="flex-1 rounded-2xl px-6 py-3 text-sm font-medium text-surface-600-400 transition-all hover:preset-tonal-surface">
								📄 전체 내용
							</button>
						</div>

						<!-- 읽기 진행률 -->
						<div
							class="rounded-2xl border border-surface-200-800/40 preset-glass-surface p-4 backdrop-blur-xl">
							<div class="flex items-center justify-between mb-2">
								<span class="text-sm font-medium text-surface-700-300">읽기 진행률</span>
								<span class="text-sm text-surface-500-500">0%</span>
							</div>
							<div class="h-2 rounded-full bg-surface-200-800">
								<div class="h-2 w-0 rounded-full bg-primary-600-400 transition-all duration-300">
								</div>
							</div>
						</div>

						<!-- AI 요약 섹션 -->
						<article
							class="group relative overflow-hidden rounded-3xl border border-surface-200-800/40 preset-glass-surface shadow-2xl backdrop-blur-xl">
							<!-- 글로우 효과 -->
							<div class="absolute inset-0 preset-tonal-primary opacity-5"></div>

							<div class="relative">
								<!-- 헤더 -->
								<div class="border-b border-surface-200-800/50 preset-tonal-surface px-8 py-6">
									<div class="flex items-center gap-4">
										<div class="rounded-2xl preset-tonal-primary p-3">
											<svg
												class="h-6 w-6 text-white"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
											</svg>
										</div>
										<div>
											<h2 class="h2 text-surface-900-100">AI 핵심 요약</h2>
											<p class="text-surface-600-400">영상의 핵심 내용을 구조화하여 정리했습니다</p>
										</div>
									</div>
								</div>

								<!-- 컨텐츠 -->
								<div class="p-8">
									<div class="prose prose-lg max-w-none">
										<div class="rounded-2xl preset-tonal-surface p-8 shadow-inner">
											<p class="text-lg leading-relaxed text-surface-800-200 whitespace-pre-line">
												{summary.summary}
											</p>
										</div>
									</div>

									<!-- 액션 버튼들 -->
									<div class="mt-8 flex flex-wrap gap-4">
										<button
											class="btn variant-ghost-surface btn-base inline-flex items-center gap-2">
											<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h3a1 1 0 110 2h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h4z" />
											</svg>
											<span>요약 복사</span>
										</button>

										<button
											class="btn variant-ghost-surface btn-base inline-flex items-center gap-2">
											<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
											</svg>
											<span>공유하기</span>
										</button>
									</div>
								</div>
							</div>
						</article>

						<!-- 전체 내용 섹션 -->
						<article
							class="group relative overflow-hidden rounded-3xl border border-surface-200-800/40 preset-glass-surface shadow-2xl backdrop-blur-xl">
							<!-- 글로우 효과 -->
							<div class="absolute inset-0 preset-tonal-primary opacity-5"></div>

							<div class="relative">
								<!-- 헤더 -->
								<div class="border-b border-surface-200-800/50 preset-tonal-surface px-8 py-6">
									<div class="flex items-center gap-4">
										<div class="rounded-2xl preset-tonal-success p-3">
											<svg
												class="h-6 w-6 text-white"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
											</svg>
										</div>
										<div>
											<h2 class="h2 text-surface-900-100">전체 스크립트</h2>
											<p class="text-surface-600-400">영상의 모든 내용을 텍스트로 변환했습니다</p>
										</div>
									</div>
								</div>

								<!-- 컨텐츠 -->
								<div class="p-8">
									<div class="prose prose-base max-w-none">
										<!-- 책 스타일 다단 레이아웃 -->
										<div class="rounded-2xl preset-tonal-surface p-8 shadow-inner">
											<div class="max-w-3xl mx-auto">
												<p class="text-base leading-7 text-surface-700-300 whitespace-pre-line">
													{summary.content}
												</p>
											</div>
										</div>
									</div>

									<!-- 통계 정보 -->
									<div class="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
										<div
											class="rounded-2xl preset-glass-surface p-4 text-center backdrop-blur-sm border border-surface-200-800/40">
											<div class="text-2xl font-bold text-primary-600-400">
												{summary.summary.length}
											</div>
											<div class="text-xs text-surface-600-400">요약 글자 수</div>
										</div>
										<div
											class="rounded-2xl preset-glass-surface p-4 text-center backdrop-blur-sm border border-surface-200-800/40">
											<div class="text-2xl font-bold text-secondary-600-400">
												{summary.content.length}
											</div>
											<div class="text-xs text-surface-600-400">전체 글자 수</div>
										</div>
										<div
											class="rounded-2xl preset-glass-surface p-4 text-center backdrop-blur-sm border border-surface-200-800/40">
											<div class="text-2xl font-bold text-success-600-400">
												{Math.round((summary.summary.length / summary.content.length) * 100)}%
											</div>
											<div class="text-xs text-surface-600-400">압축률</div>
										</div>
										<div
											class="rounded-2xl preset-glass-surface p-4 text-center backdrop-blur-sm border border-surface-200-800/40">
											<div class="text-2xl font-bold text-warning-600-400">
												{Math.ceil(summary.content.length / 300)}
											</div>
											<div class="text-xs text-surface-600-400">예상 읽기 시간(분)</div>
										</div>
									</div>
								</div>
							</div>
						</article>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
