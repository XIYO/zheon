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

<div class="min-h-screen bg-gray-50 px-4 py-8">
	<div class="mx-auto max-w-4xl">
		<!-- Header with back button -->
		<div class="mb-6">
			<a
				href="/dashboard/"
				class="inline-flex items-center gap-2 text-gray-600 transition-colors hover:text-gray-900"
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"
					></path>
				</svg>
				대시보드로 돌아가기
			</a>
		</div>

		<!-- Main content -->
		<div class="overflow-hidden rounded-lg bg-white shadow-sm border border-gray-200">
			<!-- Video thumbnail and basic info -->
			<div class="relative">
				<img
					src={extractThumbnail(summary.youtube_url)}
					alt="Video thumbnail"
					class="h-64 w-full object-cover sm:h-80"
				/>
				<div
					class="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/70 to-transparent p-6"
				>
					<h1 class="mb-2 text-2xl font-bold text-white sm:text-3xl">{summary.title}</h1>
					<p class="text-sm text-gray-200">
						생성일: {formatDate(summary.created_at)} | 언어: {summary.lang === 'ko'
							? '한국어'
							: 'English'}
					</p>
				</div>
			</div>

			<div class="space-y-8 p-6">
				<!-- Summary section -->
				<section>
					<h2 class="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900">
						<svg
							class="h-5 w-5 text-gray-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							></path>
						</svg>
						요약
					</h2>
					<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
						<p class="leading-relaxed whitespace-pre-line text-gray-800">{summary.summary}</p>
					</div>
				</section>

				<!-- Content section -->
				<section>
					<h2 class="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900">
						<svg
							class="h-5 w-5 text-gray-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 6h16M4 12h16M4 18h16"
							></path>
						</svg>
						전체 내용
					</h2>
					<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
						<p class="text-sm leading-relaxed whitespace-pre-line text-gray-700 sm:text-base">
							{summary.content}
						</p>
					</div>
				</section>

				<!-- YouTube link -->
				<section>
					<h2 class="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900">
						<svg class="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
							></path>
						</svg>
						원본 영상
					</h2>
					<a
						href={summary.youtube_url}
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-white transition-colors hover:bg-black"
					>
						<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
							<path
								d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
							/>
						</svg>
						YouTube에서 보기
					</a>
				</section>
			</div>
		</div>
	</div>
</div>
