<script>
	import { page } from '$app/state';
</script>

<h1>{page?.status ?? 500}</h1>
<p>{page?.error?.message ?? '알 수 없는 오류입니다.'}</p>
