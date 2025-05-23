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

<p class="text-center text-lg font-semibold mt-20">
	성공적으로 사인아웃되었습니다.
	{#if show}
		<span in:slide={{delay : 500}} class="block">잠시 후 홈으로 이동합니다.	</span>
	{/if}
</p>

<p class="text-center mt-4">
	<a class="underline hover:text-gray-700" href="/">홈으로 이동하기</a>
</p>
