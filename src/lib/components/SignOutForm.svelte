<script>
	import { enhance } from '$app/forms';
</script>

<form action="/auth/sign-out/" class="space-y-6 bg-white p-6 rounded shadow-md max-w-md" method="POST" use:enhance>
	<p class="text-black text-sm mb-4">
		정말로 사인아웃 하시겠습니까?
	</p>
	<button
		class="w-full bg-black hover:bg-gray-900 text-white font-semibold py-2 px-4 rounded"
		type="submit"
	>
		Sign Out
	</button>
</form>