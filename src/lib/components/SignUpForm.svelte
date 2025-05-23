<script>
	import { enhance } from '$app/forms';

	const { onsubmit = () => {} } = $props();
</script>

<form {onsubmit} action="/auth/sign-up/" class="space-y-6 bg-white p-6 rounded shadow-md max-w-md" method="POST"
			use:enhance>
	<label class="block">
		<span class="block text-sm font-medium mb-1">Email</span>
		<input
			autocomplete="email"
			class="w-full border border-black bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-gray-700"
			name="email"
			required
			type="email" />
	</label>

	<label class="block">
		<span class="block text-sm font-medium mb-1">Name</span>
		<input
			autocomplete="name"
			class="w-full border border-black bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-gray-700"
			name="name"
			required
			type="text" />
	</label>

	<label class="block">
		<span class="block text-sm font-medium mb-1">Password</span>
		<input
			autocomplete="new-password"
			class="w-full border border-black bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-gray-700"
			name="password"
			required
			type="password" />
	</label>

	<label class="block">
		<span class="block text-sm font-medium mb-1">Confirm&nbsp;Password</span>
		<input
			autocomplete="new-password"
			class="w-full border border-black bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-gray-700"
			name="confirm-password"
			required
			type="password" />
	</label>

	<button
		class="w-full bg-black hover:bg-gray-900 text-white font-semibold py-2 px-4 rounded"
		type="submit">
		Sign&nbsp;Up
	</button>
</form>