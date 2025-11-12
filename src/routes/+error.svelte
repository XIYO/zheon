<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { ServerCrash, FileQuestion, AlertTriangle, Home, ArrowLeft } from '@lucide/svelte';

	const status = $derived(page?.status ?? 500);
	const message = $derived(page?.error?.message ?? '알 수 없는 오류가 발생했습니다.');

	const statusConfig = $derived.by(() => {
		if (status >= 500) {
			return {
				title: '서버 오류',
				description: '서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
				Icon: ServerCrash,
				badgePreset: 'preset-filled-error-500',
				borderClass: 'border-error-600-400'
			};
		}
		if (status === 404) {
			return {
				title: '페이지를 찾을 수 없습니다',
				description: '요청하신 페이지가 존재하지 않습니다.',
				Icon: FileQuestion,
				badgePreset: 'preset-filled-warning-500',
				borderClass: 'border-warning-600-400'
			};
		}
		if (status >= 400) {
			return {
				title: '잘못된 요청',
				description: '요청을 처리할 수 없습니다.',
				Icon: AlertTriangle,
				badgePreset: 'preset-filled-warning-500',
				borderClass: 'border-warning-600-400'
			};
		}
		return {
			title: '오류',
			description: '문제가 발생했습니다.',
			Icon: AlertTriangle,
			badgePreset: 'preset-filled-surface-500',
			borderClass: 'border-surface-600-400'
		};
	});
</script>

<div class="min-h-screen preset-tonal-surface flex items-center justify-center p-6">
	<div class="w-full max-w-2xl">
		<div
			class={[
				'card preset-filled-surface-50-950 overflow-hidden rounded-xl',
				'border-4',
				statusConfig.borderClass
			]}>
			<header class="space-y-6 p-8 text-center">
				<div class="flex justify-center">
					<span class={['badge-icon', statusConfig.badgePreset]}>
						<statusConfig.Icon class="size-10" />
					</span>
				</div>
				<div class="space-y-2">
					<span class={['badge text-lg px-4 py-2', statusConfig.badgePreset]}>{status}</span>
					<h1 class="h2">{statusConfig.title}</h1>
				</div>
				<p class="text-surface-700-300 text-lg">{statusConfig.description}</p>
			</header>

			<article class="p-8 pt-0">
				<div class="card preset-tonal-surface p-6 rounded-lg">
					<h2 class="h6 mb-3 text-surface-900-100">오류 상세</h2>
					<p class="break-words text-surface-700-300">{message}</p>
				</div>
			</article>

			<footer class="flex flex-col gap-4 p-8 sm:flex-row sm:justify-center">
				<a href={resolve('/')} class="btn preset-filled-primary-500">
					<Home class="size-5" />
					<span>홈으로 돌아가기</span>
				</a>
				<button onclick={() => window.history.back()} class="btn preset-outlined-surface-500-400">
					<ArrowLeft class="size-5" />
					<span>이전 페이지</span>
				</button>
			</footer>
		</div>
	</div>
</div>
