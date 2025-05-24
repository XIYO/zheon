<script>
	import { applyAction, enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	/** @type {{ onsuccess?: () => void }} */
	const { onsuccess } = $props();

	/** @type {import('@sveltejs/kit').SubmitFunction} */
	const handleEnhance = ({}) => {
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

<form
	action="/auth/sign-out/"
	class="max-w-md space-y-6 rounded-lg bg-white p-6 shadow-sm border border-gray-200"
	method="POST"
	use:enhance={handleEnhance}
>
	<p class="mb-4 text-sm text-gray-700">정말로 사인아웃 하시겠습니까?</p>
	<button
		class="w-full rounded-md bg-gray-900 px-4 py-2 font-semibold text-white hover:bg-black transition-colors"
		type="submit"
	>
		Sign Out
	</button>
</form>
