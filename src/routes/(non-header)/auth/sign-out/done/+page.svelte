<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let timer = $state(5);
	onMount(() => {
		const interval = setInterval(() => {
			if (--timer <= 0) {
				clearInterval(interval);
				goto('/', { replaceState: true });
			}
		}, 1000);

		return () => clearInterval(interval);
	});
</script>

<svelte:head>
	<noscript>
		<meta content="5; url=/" http-equiv="refresh" />
	</noscript>
</svelte:head>

<p class="text-center text-lg font-semibold mt-20">
	성공적으로 사인아웃되었습니다.<br />
	{timer}초 후 홈으로 돌아갑니다.
</p>

<p class="text-center mt-4">
	<a class="underline hover:text-gray-700" href="/">지금 바로 홈으로 이동하기</a>
</p>
