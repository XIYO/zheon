<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { slide } from 'svelte/transition';

	let timer = $state(5);
	onMount(() => {
		const interval = setInterval(() => {
			if (--timer <= 0) {
				clearInterval(interval);
				goto('/');
			}
		}, 1000);

		return () => clearInterval(interval);
	});

	let show = $state(false);

	onMount(() => {
		show = true;
	});
</script>

<div class="min-h-screen preset-tonal-surface flex items-center justify-center p-6">
    <div class="max-w-md w-full text-center">
        <p class="text-lg font-semibold text-surface-900-100">
            성공적으로 사인아웃되었습니다.
            {#if show}
                <span in:slide={{ delay: 500 }} class="block text-surface-600-400 text-base font-normal mt-2">
                    잠시 후 홈으로 이동합니다.
                </span>
            {/if}
        </p>

        <p class="mt-6">
            <a class="btn variant-filled-primary btn-sm" href="/">
                홈으로 이동하기
            </a>
        </p>
    </div>
</div>
