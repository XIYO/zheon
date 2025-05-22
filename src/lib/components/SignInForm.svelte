<script>
	import { applyAction, enhance } from '$app/forms';
	import { goto, invalidate } from '$app/navigation';
	import { page } from '$app/state';

	const { successAfter = () => {} } = $props();

	const handleSignInSubmit = ({ formElement, formData, action, cancel }) => {
		return async ({ result }) => {
			if (result.type === 'redirect') {
				await invalidate('supabase:auth');
				await goto(result.location);
				successAfter();
			} else {
				await applyAction(result);
			}
		};
	};
</script>

<p class="text-red-600 text-sm px-3 py-2">
	{page.form?.message || ' '}
</p>

<form
	action="/auth/sign-in/" class="space-y-6 bg-white p-6 rounded shadow-md max-w-md" method="POST"
	use:enhance={handleSignInSubmit}>


	<label class="block">
		<span class="block text-sm font-medium mb-1">Email</span>
		<input
			autocomplete="username"
			class="w-full border border-black bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-gray-700"
			name="email"
			type="email" />
	</label>

	<label class="block">
		<span class="block text-sm font-medium mb-1">Password</span>
		<input
			autocomplete="current-password"
			class="w-full border border-black bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-gray-700"
			name="password"
			type="password" />
	</label>

	<button
		class="w-full bg-black hover:bg-gray-900 text-white font-semibold py-2 px-4 rounded"
		type="submit">
		Sign In
	</button>
</form>