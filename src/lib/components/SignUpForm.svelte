<!-- 🙈 Sign-up form with clean monochromatic design -->
<script>
	import { applyAction, enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { signUpSchema } from './signUpSchema';

	/** @type {{ onsuccess?: () => void }} */
	const { onsuccess } = $props();

	/** @type {import('@sveltejs/kit').SubmitFunction} */
	const handleEnhance = ({ action, formData, formElement, submitter, cancel }) => {
		const parsed = Object.fromEntries(formData);
		const validatedSignIn = signUpSchema.safeParse(parsed);
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

		return ({ result, update }) => {
			// 요청 완료 시 버튼 활성화
			if (result.type === 'redirect') {
				onsuccess?.();
				goto(result.location);
			} else {
				applyAction(result);
			}
			submitter?.removeAttribute('disabled');
		};
	};
</script>

<form
	action="/auth/sign-up/"
	class="max-w-md space-y-6 rounded-lg bg-gray-50 p-6 shadow-sm border border-gray-200"
	method="POST"
	use:enhance={handleEnhance}
>
	<label class="block after:block after:mb-1 after:text-sm after:text-red-600 after:min-h-[1.5em] after:content-[attr(data-error)]" data-error={page.form?.failure?.email ?? ''}>
		<span class="mb-1 block text-sm font-medium text-gray-600">Email</span>
		<input
			type="email"
			name="email"
			class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-black focus:border-black"
		/>
	</label>

	<label class="block after:block after:mb-1 after:text-sm after:text-red-600 after:min-h-[1.5em] after:content-[attr(data-error)]" data-error={page.form?.failure?.name ?? ''}>
		<span class="mb-1 block text-sm font-medium text-gray-600">Name</span>
		<input
			type="text"
			name="name"
			class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-black focus:border-black"
		/>
	</label>

	<label class="block after:block after:mb-1 after:text-sm after:text-red-600 after:min-h-[1.5em] after:content-[attr(data-error)]" data-error={page.form?.failure?.password ?? ''}>
		<span class="mb-1 block text-sm font-medium text-gray-600">Password</span>
		<input
			type="password"
			name="password"
			class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-black focus:border-black"
		/>
	</label>

	<label class="block after:block after:mb-1 after:text-sm after:text-red-600 after:min-h-[1.5em] after:content-[attr(data-error)]" data-error={page.form?.failure?.confirmPassword ?? ''}>
		<span class="mb-1 block text-sm font-medium text-gray-600">Confirm Password</span>
		<input
			type="password"
			name="confirmPassword"
			class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-black focus:border-black"
		/>
	</label>

	<button type="submit"
		class="w-full rounded-md bg-black px-4 py-2 font-semibold text-white hover:bg-gray-600"
	>
		Sign Up
	</button>
</form>
