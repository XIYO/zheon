<script>
	import { goto } from '$app/navigation';
	
	let { data } = $props();
	let summary = $derived(data.summary);

	function extractYoutubeId(url) {
		const match = new URL(url).searchParams.get('v');
		return match || '';
	}

	function extractThumbnail(url) {
		const id = extractYoutubeId(url);
		return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
	}

	function goBack() {
		goto('/dashboard');
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

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 py-8 px-4">
	<div class="max-w-4xl mx-auto">
		<!-- Header with back button -->
		<div class="mb-6">
			<button 
				on:click={goBack}
				class="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
				</svg>
				대시보드로 돌아가기
			</button>
		</div>

		<!-- Main content -->
		<div class="bg-white rounded-lg shadow-lg overflow-hidden">
			<!-- Video thumbnail and basic info -->
			<div class="relative">
				<img 
					src={extractThumbnail(summary.youtube_url)} 
					alt="Video thumbnail" 
					class="w-full h-64 sm:h-80 object-cover"
				/>
				<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
					<h1 class="text-2xl sm:text-3xl font-bold text-white mb-2">{summary.title}</h1>
					<p class="text-gray-200 text-sm">
						생성일: {formatDate(summary.created_at)} | 언어: {summary.lang === 'ko' ? '한국어' : 'English'}
					</p>
				</div>
			</div>

			<div class="p-6 space-y-8">
				<!-- Summary section -->
				<section>
					<h2 class="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
						<svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
						</svg>
						요약
					</h2>
					<div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
						<p class="text-gray-800 leading-relaxed whitespace-pre-line">{summary.summary}</p>
					</div>
				</section>

				<!-- Content section -->
				<section>
					<h2 class="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
						<svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
						</svg>
						전체 내용
					</h2>
					<div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
						<p class="text-gray-800 leading-relaxed whitespace-pre-line text-sm sm:text-base">{summary.content}</p>
					</div>
				</section>

				<!-- YouTube link -->
				<section>
					<h2 class="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
						<svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
						</svg>
						원본 영상
					</h2>
					<a 
						href={summary.youtube_url} 
						target="_blank" 
						rel="noopener noreferrer"
						class="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
					>
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
							<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
						</svg>
						YouTube에서 보기
					</a>
				</section>
			</div>
		</div>
	</div>
</div>
