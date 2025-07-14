<script>
	import { page } from '$app/state';
</script>

<div class="min-h-screen bg-gray-50 flex items-center justify-center p-6">
	<div class="max-w-md w-full text-center">
		<h1 class="text-4xl font-bold text-gray-900 mb-4">{page?.status ?? 500}</h1>
		<p class="text-lg text-gray-700 mb-6">{page?.error?.message ?? '알 수 없는 오류입니다.'}</p>
		<a
			href="/"
			class="inline-block rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black transition-colors">
			홈으로 돌아가기
		</a>
	</div>
</div>
