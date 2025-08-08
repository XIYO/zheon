<!-- Hero Section -->
<section class="relative overflow-hidden preset-tonal">
	<div class="absolute inset-0 preset-glass-primary opacity-20"></div>

	<div class="relative grid items-center gap-16 px-6 py-32 md:grid-cols-2 lg:px-8">
		<div class="space-y-8 animate-fade-in">
			<div class="space-y-4">
				<div class="flex items-center space-x-3">
					<div class="relative">
						<span class="text-6xl font-black tracking-tight gradient-text">展</span>
						<div class="absolute -inset-2 rounded-xl preset-gradient opacity-20 blur-xl"></div>
					</div>
					<h1 class="text-5xl font-black tracking-tight text-white lg:text-6xl">Zheon</h1>
				</div>
				<p class="text-xl leading-relaxed opacity-80 lg:text-2xl">
					유튜브 영상의 스크립트를 마치 책처럼 펼쳐 보여주는 요약 서비스. 핵심만 빠르게 이해하고,
					키워드별로 내용을 탐색하세요.
				</p>
			</div>

			<div class="space-y-6">
				<div class="h-px bg-gradient-to-r from-transparent via-current/30 to-transparent"></div>
				<p class="text-lg opacity-70">
					자동 생성된 자막 기반 AI 요약, 깔끔하고 구조적인 정보 제공.
				</p>

				<a
					href="dashboard"
					class="group preset-filled-primary-500 inline-flex items-center gap-3 rounded-full px-8 py-4 text-lg font-semibold text-white shadow-xl transition-all hover:scale-105 focus:outline-none focus:ring-2">
					<span>시작하기</span>
					<svg
						class="h-5 w-5 transition-transform group-hover:translate-x-1"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 7l5 5m0 0l-5 5m5-5H6" />
					</svg>
				</a>
			</div>
		</div>

		<!-- Live Demo -->
		<div class="relative">
			<div class="relative mx-auto h-96 w-full max-w-lg">
				<div class="absolute inset-0 rounded-3xl preset-glass-primary blur-3xl"></div>

				<div
					class="relative h-full overflow-hidden rounded-3xl preset-tonal-surface backdrop-blur-xl">
					<div class="flex items-center justify-between p-4">
                        <div class="flex items-center space-x-2">
                            <div class="h-3 w-3 rounded-full preset-filled-error-500"></div>
                            <div class="h-3 w-3 rounded-full preset-filled-warning-500"></div>
                            <div class="h-3 w-3 rounded-full preset-filled-success-500"></div>
                        </div>
						<div class="text-sm font-medium opacity-80">Zheon Demo</div>
					</div>

					<div class="flex h-full flex-col p-6">
						<div class="mb-4">
							<div class="relative">
								<div
									class="flex items-center rounded-2xl preset-tonal-surface p-3 backdrop-blur-sm">
									<svg
										class="h-5 w-5 opacity-60 mr-3"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
									</svg>
									<div class="text-sm opacity-80 font-mono">youtube.com/watch?v=...</div>
								</div>
							</div>
						</div>

						<div class="flex-1 space-y-4">
							<div class="flex items-center gap-3">
								<div
									class="h-8 w-8 rounded-full preset-filled-primary-500 flex items-center justify-center animate-pulse">
									<svg
										class="h-4 w-4 text-white"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
								</div>
								<div class="text-sm opacity-90">자막 추출 완료</div>
							</div>

							<div class="flex items-center gap-3">
								<div
									class="h-8 w-8 rounded-full preset-filled-secondary-500 flex items-center justify-center animate-pulse">
									<svg
										class="h-4 w-4 text-white"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M13 10V3L4 14h7v7l9-11h-7z" />
									</svg>
								</div>
								<div class="text-sm opacity-90">AI 분석 중...</div>
							</div>

							<div class="flex items-center gap-3 opacity-50">
								<div
									class="h-8 w-8 rounded-full preset-filled-success-500 flex items-center justify-center">
									<svg
										class="h-4 w-4 text-white"
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
								<div class="text-sm opacity-60">요약 완성</div>
							</div>
						</div>

						<div class="rounded-2xl preset-tonal-surface p-4 backdrop-blur-sm">
							<div class="space-y-3">
								<div class="flex items-center gap-2">
									<div class="h-2 w-2 rounded-full preset-filled-success-500 animate-pulse"></div>
									<div class="text-xs font-medium opacity-80">요약 결과</div>
								</div>
								<div class="space-y-2">
									<div class="h-2 w-full rounded-full opacity-20 animate-pulse preset-tonal"></div>
									<div class="h-2 w-4/5 rounded-full opacity-15 animate-pulse preset-tonal"></div>
									<div class="h-2 w-3/4 rounded-full opacity-10 animate-pulse preset-tonal"></div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Features Section -->
<section class="relative preset-tonal-surface px-6 py-32 lg:px-8">
	<div class="absolute inset-0 preset-glass-primary opacity-10"></div>

	<div class="relative grid items-center gap-16 md:grid-cols-2">
		<div class="space-y-8 animate-fade-in">
			<div class="space-y-6">
				<h2 class="h1">
					알고 보면 더 흥미로운
					<span class="gradient-text">Zheon의 작동 방식</span>
				</h2>
				<p class="text-xl leading-relaxed opacity-80">
					Zheon은 유튜브 영상의 자막 데이터를 분석해 문맥 흐름을 파악하고, 사용자가 원하는 주제별로
					내용을 재구성합니다.
				</p>
				<p class="text-lg opacity-70">
					AI 요약 모델과 자연어 처리 기술이 결합되어, 수동 편집 없이도 완성도 높은 전개형 요약을
					제공합니다.
				</p>
			</div>

			<!-- Feature Highlights -->
			<div class="grid gap-4 sm:grid-cols-2">
				<div
					class="card group p-6 preset-tonal-surface backdrop-blur-sm transition-all hover:preset-tonal-primary hover:shadow-lg">
					<div class="mb-3 inline-flex rounded-full preset-tonal-primary p-3">
						<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 10V3L4 14h7v7l9-11h-7z" />
						</svg>
					</div>
					<h3 class="h4 font-semibold">실시간 처리</h3>
					<p class="text-sm opacity-70">빠른 AI 분석으로 즉시 요약 제공</p>
				</div>

				<div
					class="card group p-6 preset-tonal-surface backdrop-blur-sm transition-all hover:preset-tonal-secondary hover:shadow-lg">
					<div class="mb-3 inline-flex rounded-full preset-tonal-secondary p-3">
						<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
						</svg>
					</div>
					<h3 class="h4 font-semibold">스마트 분석</h3>
					<p class="text-sm opacity-70">문맥을 이해하는 고도화된 요약</p>
				</div>
			</div>
		</div>

		<!-- Interactive Demo Card -->
		<div class="relative animate-fade-in">
			<div class="relative mx-auto h-96 w-full max-w-md">
				<div class="absolute inset-0 rounded-3xl preset-glass-primary blur-2xl"></div>

				<div
					class="card relative h-full overflow-hidden preset-tonal-surface shadow-2xl backdrop-blur-xl">
					<div class="p-8">
						<!-- Header -->
						<div class="mb-6 flex items-center justify-between">
							<div class="flex items-center space-x-3">
                            <div class="h-3 w-3 rounded-full preset-filled-error-500"></div>
                            <div class="h-3 w-3 rounded-full preset-filled-warning-500"></div>
                            <div class="h-3 w-3 rounded-full preset-filled-success-500"></div>
							</div>
							<div class="text-sm font-medium opacity-70">Zheon AI</div>
						</div>

						<!-- Process Visualization -->
						<div class="space-y-6">
							<div class="space-y-3">
								<div class="flex items-center gap-3">
									<div
										class="h-8 w-8 rounded-full preset-filled-primary-500 flex items-center justify-center">
										<span class="text-xs font-bold text-white">1</span>
									</div>
									<div class="text-sm font-medium">영상 분석</div>
								</div>
								<div class="ml-11 h-2 w-3/4 rounded-full preset-tonal-primary"></div>
							</div>

							<div class="space-y-3">
								<div class="flex items-center gap-3">
									<div
										class="h-8 w-8 rounded-full preset-filled-secondary-500 flex items-center justify-center">
										<span class="text-xs font-bold text-white">2</span>
									</div>
									<div class="text-sm font-medium">내용 구조화</div>
								</div>
								<div class="ml-11 h-2 w-2/3 rounded-full preset-tonal-secondary"></div>
							</div>

							<div class="space-y-3">
								<div class="flex items-center gap-3">
									<div
										class="h-8 w-8 rounded-full preset-filled-success-500 flex items-center justify-center">
										<span class="text-xs font-bold text-white">3</span>
									</div>
									<div class="text-sm font-medium">요약 완성</div>
								</div>
								<div class="ml-11 h-2 w-5/6 rounded-full preset-tonal-success"></div>
							</div>
						</div>

						<!-- Result Preview -->
						<div class="mt-8 card p-4 preset-tonal-surface">
							<div class="text-center">
								<div class="mb-2 h4 font-bold gradient-text">"Zheon은 영상의 흐름을</div>
								<div class="h4 font-bold gradient-text">텍스트로 재해석합니다."</div>
								<div class="mt-3 flex justify-center gap-1">
									<div class="h-1 w-6 rounded-full preset-filled-primary-500"></div>
									<div class="h-1 w-4 rounded-full preset-filled-secondary-500"></div>
									<div class="h-1 w-8 rounded-full preset-filled-success-500"></div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>
