<!-- 🙈 Sign-in form with monochromatic design and clean styling -->
<script>
	import { applyAction, deserialize, enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { signInSchema } from './signInSchema.js';

	/** @type {{ onsuccess?: () => void }} */
	const { onsuccess } = $props();
	const redirectToQuery = $derived.by(() => {
		const redirectTo = page.url.searchParams.get('redirectTo');
		return redirectTo
			? `&redirectTo=${encodeURIComponent(redirectTo)}`
			: `&redirectTo=${encodeURIComponent(page.url.pathname)}`;
	});

	/** @type {import('@sveltejs/kit').SubmitFunction} */
	const handleEnhance = ({ action, formData, formElement, submitter, cancel }) => {
		const parsed = Object.fromEntries(formData);
		const validatedSignIn = signInSchema.safeParse(parsed);
		if (!validatedSignIn.success) {
			let failure = Object.create(null);
			for (const err of validatedSignIn.error.errors) {
				const key = String(err.path[0]);
				failure[key] = err.message;
			}

			/** @type {import('@sveltejs/kit').ActionResult} */
			const failureResult = {
				type: 'failure',
				status: 400,
				data: { failure }
			};
			cancel();
			return applyAction(failureResult);
		}

		submitter?.setAttribute('disabled', 'true');

		return ({ result }) => {
			if (result.type === 'redirect') {
				onsuccess?.();
				goto(result.location, { invalidateAll: true });
			} else {
				applyAction(result);
			}
			submitter?.removeAttribute('disabled');
		};
	};
</script>

<div>
	<!-- Google OAuth Form -->
	<form
		action={`/auth/sign-in/?/google${redirectToQuery}`}
		method="POST"
		class="max-w-md space-y-4 rounded-lg bg-gray-50 p-6 shadow-sm border border-gray-200"
		use:enhance>
		<button
			type="submit"
			class="flex w-full items-center justify-center gap-3 rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-600 hover:border-gray-400 hover:bg-gray-200">
			Sign in with Google
		</button>
	</form>

	<hr class="my-6" />

	<!-- Email/Password Form -->
	<form
		action={`/auth/sign-in/?/sign-in${redirectToQuery}`}
		class="max-w-md space-y-6 rounded-lg bg-gray-50 p-6 shadow-sm border border-gray-200"
		method="POST"
		use:enhance={handleEnhance}>
		<label
			class="block after:block after:mb-1 after:text-sm after:text-red-600 after:min-h-[1.5em] after:content-[attr(data-error)]"
			data-error={page.form?.failure?.email ?? ''}>
			<span class="mb-1 block text-sm font-medium text-gray-600">Email</span>
			<input
				type="email"
				name="email"
				class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-black focus:border-black" />
		</label>

		<label
			class="block after:block after:mb-1 after:text-sm after:text-red-600 after:min-h-[1.5em] after:content-[attr(data-error)]"
			data-error={page.form?.failure?.password ?? ''}>
			<span class="mb-1 block text-sm font-medium text-gray-600">Password</span>
			<input
				type="password"
				name="password"
				class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-black focus:border-black" />
		</label>

		<button
			type="submit"
			disabled={page.form?.pending}
			class="w-full rounded-md bg-black px-4 py-2 font-semibold text-white hover:bg-gray-600">
			Sign In
		</button>
	</form>
</div>
