<script>
	import { page } from '$app/state';
	import { localizeHref } from '$lib/paraglide/runtime';
</script>

<div class="min-h-screen preset-tonal-surface flex items-center justify-center p-6">
	<div class="max-w-md w-full text-center">
		<h1 class="h1 text-surface-900-100 mb-4">{page?.status ?? 500}</h1>
		<p class="text-surface-700-300 mb-6">
			{page?.error?.message ?? '알 수 없는 오류입니다.'}
		</p>
		<a href={localizeHref('/')} class="btn preset-filled-primary btn-sm">홈으로 돌아가기</a>
	</div>
</div>
