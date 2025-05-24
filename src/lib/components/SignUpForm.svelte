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
	action="/auth/sign-up/"
	class="max-w-md space-y-6 rounded bg-white p-6 shadow-md"
	method="POST"
	use:enhance={handleEnhance}
>
	<label class="block">
		<span class="mb-1 block text-sm font-medium">Email</span>
		<input
			autocomplete="email"
			class="w-full border border-black bg-transparent px-3 py-2 text-sm focus:border-gray-700 focus:outline-none"
			name="email"
			required
			type="email"
		/>
	</label>

	<label class="block">
		<span class="mb-1 block text-sm font-medium">Name</span>
		<input
			autocomplete="name"
			class="w-full border border-black bg-transparent px-3 py-2 text-sm focus:border-gray-700 focus:outline-none"
			name="name"
			required
			type="text"
		/>
	</label>

	<label class="block">
		<span class="mb-1 block text-sm font-medium">Password</span>
		<input
			autocomplete="new-password"
			class="w-full border border-black bg-transparent px-3 py-2 text-sm focus:border-gray-700 focus:outline-none"
			name="password"
			required
			type="password"
		/>
	</label>

	<label class="block">
		<span class="mb-1 block text-sm font-medium">Confirm&nbsp;Password</span>
		<input
			autocomplete="new-password"
			class="w-full border border-black bg-transparent px-3 py-2 text-sm focus:border-gray-700 focus:outline-none"
			name="confirm-password"
			required
			type="password"
		/>
	</label>

	<button
		class="w-full rounded bg-black px-4 py-2 font-semibold text-white hover:bg-gray-900"
		type="submit"
	>
		Sign&nbsp;Up
	</button>
</form>
