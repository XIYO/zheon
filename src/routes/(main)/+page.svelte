<section class="relative overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
	<!-- 배경 패턴 -->
	<div class="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
	<div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
	
	<div class="relative grid items-center gap-16 px-6 py-32 md:grid-cols-2 lg:px-8">
		<div class="space-y-8">
			<div class="space-y-4">
				<div class="flex items-center space-x-3">
					<div class="relative">
						<span class="text-6xl font-black tracking-tight text-white">展</span>
						<div class="absolute -inset-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-20 blur-xl"></div>
					</div>
					<h1 class="text-5xl font-black tracking-tight text-white lg:text-6xl">Zheon</h1>
				</div>
				<p class="text-xl leading-relaxed text-neutral-300 lg:text-2xl">
					유튜브 영상의 스크립트를 마치 책처럼 펼쳐 보여주는 요약 서비스. 핵심만 빠르게 이해하고,
					키워드별로 내용을 탐색하세요.
				</p>
			</div>
			
			<div class="space-y-6">
				<div class="h-px bg-gradient-to-r from-transparent via-neutral-600 to-transparent"></div>
				<p class="text-lg text-neutral-400">
					자동 생성된 자막 기반 AI 요약, 깔끔하고 구조적인 정보 제공.
				</p>
				
				<a
					href="dashboard"
					class="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-blue-600/25 transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-blue-600/40 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-neutral-900">
					<span>시작하기</span>
					<svg class="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
					</svg>
					<div class="absolute inset-0 rounded-full bg-white/10 opacity-0 transition-opacity group-hover:opacity-100"></div>
				</a>
			</div>
		</div>
		
		<!-- 라이브 데모 -->
		<div class="relative">
			<div class="relative mx-auto h-96 w-full max-w-lg">
				<!-- 글로우 효과 -->
				<div class="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-600/30 to-purple-600/30 blur-3xl"></div>
				
				<!-- 데모 인터페이스 -->
				<div class="relative h-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
					<!-- 헤더 -->
					<div class="flex items-center justify-between border-b border-white/10 p-4">
						<div class="flex items-center space-x-2">
							<div class="h-3 w-3 rounded-full bg-red-400"></div>
							<div class="h-3 w-3 rounded-full bg-yellow-400"></div>
							<div class="h-3 w-3 rounded-full bg-green-400"></div>
						</div>
						<div class="text-sm font-medium text-white/80">Zheon Demo</div>
					</div>
					
					<!-- 컨텐츠 -->
					<div class="flex h-full flex-col p-6">
						<!-- URL 입력 -->
						<div class="mb-4">
							<div class="relative">
								<div class="flex items-center rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
									<svg class="h-5 w-5 text-white/60 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
									</svg>
									<div class="text-sm text-white/80 font-mono">
										youtube.com/watch?v=...
									</div>
								</div>
							</div>
						</div>
						
						<!-- 처리 과정 -->
						<div class="flex-1 space-y-4">
							<div class="flex items-center gap-3">
								<div class="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center animate-pulse">
									<svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
									</svg>
								</div>
								<div class="text-sm text-white/90">자막 추출 완료</div>
							</div>
							
							<div class="flex items-center gap-3">
								<div class="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center animate-pulse">
									<svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
									</svg>
								</div>
								<div class="text-sm text-white/90">AI 분석 중...</div>
							</div>
							
							<div class="flex items-center gap-3 opacity-50">
								<div class="h-8 w-8 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
									<svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
									</svg>
								</div>
								<div class="text-sm text-white/60">요약 완성</div>
							</div>
						</div>
						
						<!-- 결과 미리보기 -->
						<div class="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
							<div class="space-y-3">
								<div class="flex items-center gap-2">
									<div class="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
									<div class="text-xs font-medium text-white/80">요약 결과</div>
								</div>
								<div class="space-y-2">
									<div class="h-2 w-full rounded-full bg-white/20 animate-pulse"></div>
									<div class="h-2 w-4/5 rounded-full bg-white/15 animate-pulse"></div>
									<div class="h-2 w-3/4 rounded-full bg-white/10 animate-pulse"></div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>
<section class="relative bg-gradient-to-br from-neutral-50 to-neutral-100 px-6 py-32 lg:px-8">
	<!-- 배경 패턴 -->
	<div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_80%,rgba(59,130,246,0.15),transparent_50%)]"></div>
	<div class="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.15),transparent_50%)]"></div>
	
	<div class="relative grid items-center gap-16 md:grid-cols-2">
		<div class="space-y-8">
			<div class="space-y-6">
				<h2 class="text-4xl font-bold text-neutral-900 lg:text-5xl">
					알고 보면 더 흥미로운
					<span class="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
						Zheon의 작동 방식
					</span>
				</h2>
				<p class="text-xl leading-relaxed text-neutral-700">
					Zheon은 유튜브 영상의 자막 데이터를 분석해 문맥 흐름을 파악하고, 사용자가 원하는 주제별로
					내용을 재구성합니다.
				</p>
				<p class="text-lg text-neutral-600">
					AI 요약 모델과 자연어 처리 기술이 결합되어, 수동 편집 없이도 완성도 높은 전개형 요약을
					제공합니다.
				</p>
			</div>
			
			<!-- 기능 하이라이트 -->
			<div class="grid gap-4 sm:grid-cols-2">
				<div class="group rounded-2xl border border-neutral-200 bg-white/60 p-6 backdrop-blur-sm transition-all hover:border-blue-300 hover:shadow-lg">
					<div class="mb-3 inline-flex rounded-full bg-blue-100 p-3">
						<svg class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
						</svg>
					</div>
					<h3 class="font-semibold text-neutral-900">실시간 처리</h3>
					<p class="text-sm text-neutral-600">빠른 AI 분석으로 즉시 요약 제공</p>
				</div>
				
				<div class="group rounded-2xl border border-neutral-200 bg-white/60 p-6 backdrop-blur-sm transition-all hover:border-purple-300 hover:shadow-lg">
					<div class="mb-3 inline-flex rounded-full bg-purple-100 p-3">
						<svg class="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
						</svg>
					</div>
					<h3 class="font-semibold text-neutral-900">스마트 분석</h3>
					<p class="text-sm text-neutral-600">문맥을 이해하는 고도화된 요약</p>
				</div>
			</div>
		</div>
		
		<!-- 인터랙티브 데모 카드 -->
		<div class="relative">
			<div class="relative mx-auto h-96 w-full max-w-md">
				<!-- 글로우 효과 -->
				<div class="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/30 to-purple-500/30 blur-2xl"></div>
				
				<!-- 메인 카드 -->
				<div class="relative h-full overflow-hidden rounded-3xl border border-white/20 bg-white/80 shadow-2xl backdrop-blur-xl">
					<div class="p-8">
						<!-- 헤더 -->
						<div class="mb-6 flex items-center justify-between">
							<div class="flex items-center space-x-3">
								<div class="h-3 w-3 rounded-full bg-red-400"></div>
								<div class="h-3 w-3 rounded-full bg-yellow-400"></div>
								<div class="h-3 w-3 rounded-full bg-green-400"></div>
							</div>
							<div class="text-sm font-medium text-neutral-500">Zheon AI</div>
						</div>
						
						<!-- 프로세스 시각화 -->
						<div class="space-y-6">
							<div class="space-y-3">
								<div class="flex items-center gap-3">
									<div class="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
										<span class="text-xs font-bold text-white">1</span>
									</div>
									<div class="text-sm font-medium text-neutral-700">영상 분석</div>
								</div>
								<div class="ml-11 h-2 w-3/4 rounded-full bg-gradient-to-r from-blue-200 to-blue-300"></div>
							</div>
							
							<div class="space-y-3">
								<div class="flex items-center gap-3">
									<div class="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
										<span class="text-xs font-bold text-white">2</span>
									</div>
									<div class="text-sm font-medium text-neutral-700">내용 구조화</div>
								</div>
								<div class="ml-11 h-2 w-2/3 rounded-full bg-gradient-to-r from-purple-200 to-purple-300"></div>
							</div>
							
							<div class="space-y-3">
								<div class="flex items-center gap-3">
									<div class="h-8 w-8 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
										<span class="text-xs font-bold text-white">3</span>
									</div>
									<div class="text-sm font-medium text-neutral-700">요약 완성</div>
								</div>
								<div class="ml-11 h-2 w-5/6 rounded-full bg-gradient-to-r from-green-200 to-green-300"></div>
							</div>
						</div>
						
						<!-- 결과 미리보기 -->
						<div class="mt-8 rounded-2xl bg-gradient-to-br from-neutral-50 to-neutral-100 p-4">
							<div class="text-center">
								<div class="mb-2 text-lg font-bold text-neutral-800">"Zheon은 영상의 흐름을</div>
								<div class="text-lg font-bold text-neutral-800">텍스트로 재해석합니다."</div>
								<div class="mt-3 flex justify-center gap-1">
									<div class="h-1 w-6 rounded-full bg-blue-400"></div>
									<div class="h-1 w-4 rounded-full bg-purple-400"></div>
									<div class="h-1 w-8 rounded-full bg-green-400"></div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- 🙈 -->
