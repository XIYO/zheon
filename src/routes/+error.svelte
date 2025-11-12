<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	const status = $derived(page?.status ?? 500);
	const message = $derived(page?.error?.message ?? '알 수 없는 오류가 발생했습니다.');

	const statusConfig = $derived.by(() => {
		if (status >= 500) {
			return {
				title: '서버 오류',
				description: '서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
				color: 'error',
				borderClass: 'border-error-600-400'
			};
		}
		if (status === 404) {
			return {
				title: '페이지를 찾을 수 없습니다',
				description: '요청하신 페이지가 존재하지 않습니다.',
				color: 'warning',
				borderClass: 'border-warning-600-400'
			};
		}
		if (status >= 400) {
			return {
				title: '잘못된 요청',
				description: '요청을 처리할 수 없습니다.',
				color: 'warning',
				borderClass: 'border-warning-600-400'
			};
		}
		return {
			title: '오류',
			description: '문제가 발생했습니다.',
			color: 'surface',
			borderClass: 'border-surface-600-400'
		};
	});
</script>

<div class="min-h-screen preset-tonal-surface flex items-center justify-center p-6">
	<div class="max-w-2xl w-full">
		<div
			class={[
				'card preset-filled-surface-50-900',
				'border-4 rounded-xl overflow-hidden',
				'transition-all hover:shadow-xl',
				statusConfig.borderClass
			]}>
			<header class="p-8 text-center border-b border-surface-300-700">
				<div class="mb-4">
					<span
						class={[
							'inline-flex items-center justify-center',
							'w-20 h-20 rounded-full',
							'text-4xl font-bold',
							{
								'bg-error-500/10 text-error-600-400': statusConfig.color === 'error',
								'bg-warning-500/10 text-warning-600-400': statusConfig.color === 'warning',
								'bg-surface-500/10 text-surface-600-400': statusConfig.color === 'surface'
							}
						]}>
						{status}
					</span>
				</div>
				<h1 class="h2 mb-2">{statusConfig.title}</h1>
				<p class="text-surface-700-300">{statusConfig.description}</p>
			</header>

			<section class="p-8 space-y-6">
				<div class="card preset-tonal-surface p-4 rounded-lg">
					<h2 class="text-sm font-semibold mb-2 text-surface-800-200">오류 메시지</h2>
					<p class="break-words text-surface-700-300">{message}</p>
				</div>

				<div class="divider"></div>

				<div class="flex flex-col sm:flex-row gap-4 justify-center">
					<a href={resolve('/')} class="btn preset-filled-primary-500"> 홈으로 돌아가기 </a>
					<button onclick={() => window.history.back()} class="btn preset-outlined-surface-500-400">
						이전 페이지
					</button>
				</div>
			</section>
		</div>
	</div>
</div>
