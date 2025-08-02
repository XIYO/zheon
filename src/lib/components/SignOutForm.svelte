<!-- 🙈 Sign-out form with Skeleton UI -->
<script>
	import { applyAction, enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	/** @type {{ onsuccess?: () => void }} */
	const { onsuccess } = $props();

	/** @type {import('@sveltejs/kit').SubmitFunction} */
	const handleEnhance = () => {
		return ({ result }) => {
			if (result.type === 'redirect') {
				onsuccess?.();
				goto(result.location, { invalidateAll: true });
			} else {
				applyAction(result);
			}
		};
	};
</script>

<div class="space-y-4">
	<div class="text-center space-y-2">
		<div class="flex justify-center">
			<svg class="h-12 w-12 text-error-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
			</svg>
		</div>
		<p class="text-surface-600">정말로 로그아웃 하시겠습니까?</p>
		<p class="text-sm text-surface-500">현재 세션이 종료되고 로그인 페이지로 이동합니다.</p>
	</div>
	
	<form action="/auth/sign-out/" method="POST" use:enhance={handleEnhance} class="space-y-3">
		<button
			type="submit"
			class="btn variant-filled-error btn-lg w-full">
			로그아웃
		</button>
		<button
			type="button"
			onclick={() => document.querySelector('dialog[open]')?.close()}
			class="btn variant-ghost-surface btn-lg w-full">
			취소
		</button>
	</form>
</div>