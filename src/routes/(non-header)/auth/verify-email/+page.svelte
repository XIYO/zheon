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

<p class="mt-20 text-center text-lg font-semibold">
	이메일 인증이 완료되었습니다.<br />이제 사인인하여 서비스를 이용하실 수 있습니다.
</p>

<p class="mt-4 text-center text-sm text-gray-500">{timer}초 후에 메인 페이지로 이동합니다...</p>

<div class="mt-4 text-center">
	<a href="/" class="inline-block rounded bg-black px-4 py-2 text-sm font-medium text-white">
		바로 이동하기
	</a>
</div>
