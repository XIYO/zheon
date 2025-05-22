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
  회원가입이 완료되었습니다.<br />
  이메일을 확인하여 인증을 진행해 주세요.<br />
  {timer}초 후 홈으로 돌아갑니다.
</p>

<p class="text-center mt-4">
  <a href="/" class="underline hover:text-gray-700">지금 바로 홈으로 이동하기</a>
</p>
