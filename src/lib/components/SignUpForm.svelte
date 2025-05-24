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
	class="max-w-md space-y-6 rounded-lg bg-white p-6 shadow-sm border border-gray-200"
	method="POST"
	use:enhance={handleEnhance}
>
	<label class="block">
		<span class="mb-1 block text-sm font-medium text-gray-700">Email</span>
		<input
			autocomplete="email"
			class="w-full border border-gray-300 bg-transparent px-3 py-2 text-sm rounded-md focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
			name="email"
			required
			type="email"
		/>
	</label>

	<label class="block">
		<span class="mb-1 block text-sm font-medium text-gray-700">Name</span>
		<input
			autocomplete="name"
			class="w-full border border-gray-300 bg-transparent px-3 py-2 text-sm rounded-md focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
			name="name"
			required
			type="text"
		/>
	</label>

	<label class="block">
		<span class="mb-1 block text-sm font-medium text-gray-700">Password</span>
		<input
			autocomplete="new-password"
			class="w-full border border-gray-300 bg-transparent px-3 py-2 text-sm rounded-md focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
			name="password"
			required
			type="password"
		/>
	</label>

	<label class="block">
		<span class="mb-1 block text-sm font-medium text-gray-700">Confirm&nbsp;Password</span>
		<input
			autocomplete="new-password"
			class="w-full border border-gray-300 bg-transparent px-3 py-2 text-sm rounded-md focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
			name="confirm-password"
			required
			type="password"
		/>
	</label>

	<button
		class="w-full rounded-md bg-gray-900 px-4 py-2 font-semibold text-white hover:bg-black transition-colors"
		type="submit"
	>
		Sign&nbsp;Up
	</button>
</form>
