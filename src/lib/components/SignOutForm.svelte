<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { SubmitFunction } from '@sveltejs/kit';

	interface Props {
		onsuccess?: () => void;
	}

	const { onsuccess }: Props = $props();

	const handleEnhance: SubmitFunction = () => {
		return (data) => {
			const result = data.result;
			if (result.type === 'redirect') {
				onsuccess?.();
				goto(result.location, { invalidateAll: true });
			} else {
				applyAction(result);
			}
		};
	};
</script>

<!-- Sign-out Form as root element -->
<form
	action="/auth/sign-out/"
	method="POST"
	use:enhance={handleEnhance}
	class="max-w-md w-full flex flex-col">
	<!-- Header Section -->
	<header class="p-6 text-center">
		<h2 class="text-xl font-bold text-error-400">로그아웃</h2>
		<p>정말로 로그아웃하시겠습니까?</p>
	</header>

	<hr class="border-surface-500/20" />

	<!-- Content Section -->
	<section class="p-6 space-y-6">
		<!-- Warning Message -->
		<div class="preset-tonal-warning-500 p-4 rounded-lg">
			<div class="flex items-start gap-3">
				<svg
					class="h-5 w-5 text-warning-400 mt-0.5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
				</svg>
				<div>
					<p class="text-sm font-medium text-warning-400">경고</p>
					<ul class="mt-2 space-y-1 text-sm">
						<li>• 현재 세션이 종료됩니다</li>
						<li>• 저장하지 않은 데이터는 손실될 수 있습니다</li>
						<li>• 다시 로그인해야 합니다</li>
					</ul>
				</div>
			</div>
		</div>
	</section>

	<hr class="border-surface-500/20" />

	<!-- Footer Section -->
	<footer class="p-6 flex gap-3">
		<!-- Cancel Button -->
		<a href={resolve('/')} class="btn preset-ghost-surface-500 btn-base flex-1">
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M6 18L18 6M6 6l12 12" />
			</svg>
			<span>취소</span>
		</a>

		<!-- Sign Out Button -->
		<button type="submit" class="btn preset-filled-error-500 btn-base flex-1">
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
			</svg>
			<span>로그아웃</span>
		</button>
	</footer>
</form>
