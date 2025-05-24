<script>
	import { applyAction, enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	/** @type {{ onsuccess?: () => void }} */
	const { onsuccess } = $props();
	const redirectToQuery = $derived.by(() => {
		const redirectTo = page.url.searchParams.get('redirectTo');
		return redirectTo
			? `&redirectTo=${encodeURIComponent(redirectTo)}`
			: `&redirectTo=${encodeURIComponent(page.url.pathname)}`;
	});

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

<p class="px-3 py-2 text-sm text-red-600">
	{page.form?.message || ' '}
</p>

<!-- Google OAuth Form -->
<form
	action={`/auth/sign-in/?/google${redirectToQuery}`}
	method="POST"
	class="max-w-md space-y-4 rounded-lg bg-white p-6 shadow-sm border border-gray-200"
	use:enhance
>
	<button
		type="submit"
		class="flex w-full items-center justify-center gap-3 rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50"
	>
		<svg width="18" height="18" viewBox="0 0 24 24">
			<path
				fill="#4285F4"
				d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
			/>
			<path
				fill="#34A853"
				d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
			/>
			<path
				fill="#FBBC05"
				d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
			/>
			<path
				fill="#EA4335"
				d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
			/>
		</svg>
		Google로 로그인
	</button>
</form>

<!-- Divider -->
<div class="relative my-6">
	<div class="absolute inset-0 flex items-center">
		<div class="w-full border-t border-gray-300"></div>
	</div>
	<div class="relative flex justify-center text-sm">
		<span class="bg-gray-50 px-2 text-gray-500">또는</span>
	</div>
</div>

<!-- Email/Password Form -->
<form
	action={`/auth/sign-in/?/sign-in${redirectToQuery}`}
	class="max-w-md space-y-6 rounded-lg bg-white p-6 shadow-sm border border-gray-200"
	method="POST"
	use:enhance={handleEnhance}
>
	<label class="block">
		<span class="mb-1 block text-sm font-medium text-gray-700">Email</span>
		<input
			autocomplete="username"
			class="w-full border border-gray-300 bg-transparent px-3 py-2 text-sm rounded-md focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
			name="email"
			type="email"
		/>
	</label>

	<label class="block">
		<span class="mb-1 block text-sm font-medium text-gray-700">Password</span>
		<input
			autocomplete="current-password"
			class="w-full border border-gray-300 bg-transparent px-3 py-2 text-sm rounded-md focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
			name="password"
			type="password"
		/>
	</label>

	<button
		class="w-full rounded-md bg-gray-900 px-4 py-2 font-semibold text-white hover:bg-black transition-colors"
		type="submit"
	>
		Sign In
	</button>
</form>
