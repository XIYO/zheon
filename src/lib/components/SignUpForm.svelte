<script>
	import { applyAction, enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { signUpSchema } from './signUpSchema';

	/** @type {{ onsuccess?: () => void }} */
	const { onsuccess } = $props();

	/** @type {import('@sveltejs/kit').SubmitFunction} */
	const handleEnhance = (args) => {
		const { action, formData, formElement, submitter, cancel } = args;
		
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
	class="max-w-md space-y-6 rounded-lg bg-white p-6 shadow-sm border border-gray-200"
	method="POST"
	use:enhance={handleEnhance}
>
	<label class="block after:block after:mb-1 after:text-sm after:text-red-600 after:min-h-[1.5em] after:content-[attr(data-error)]" data-error={page.form?.failure?.email ?? ''}>
		<span class="mb-1 block text-sm font-medium text-gray-700">Email</span>
		<input
			autocomplete="email"
			class="w-full border border-gray-300 bg-transparent px-3 py-2 text-sm rounded-md focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
			name="email"
			required
			type="email"
		/>
	</label>

	<label class="block after:block after:mb-1 after:text-sm after:text-red-600 after:min-h-[1.5em] after:content-[attr(data-error)]" data-error={page.form?.failure?.name ?? ''}>
		<span class="mb-1 block text-sm font-medium text-gray-700">Name</span>
		<input
			autocomplete="name"
			class="w-full border border-gray-300 bg-transparent px-3 py-2 text-sm rounded-md focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
			name="name"
			required
			type="text"
		/>
	</label>

	<label class="block after:block after:mb-1 after:text-sm after:text-red-600 after:min-h-[1.5em] after:content-[attr(data-error)]" data-error={page.form?.failure?.password ?? ''}>
		<span class="mb-1 block text-sm font-medium text-gray-700">Password</span>
		<input
			autocomplete="new-password"
			class="w-full border border-gray-300 bg-transparent px-3 py-2 text-sm rounded-md focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
			name="password"
			required
			type="password"
		/>
	</label>

	<label class="block after:block after:mb-1 after:text-sm after:text-red-600 after:min-h-[1.5em] after:content-[attr(data-error)]" data-error={page.form?.failure?.confirmPassword ?? ''}>
		<span class="mb-1 block text-sm font-medium text-gray-700">Confirm&nbsp;Password</span>
		<input
			autocomplete="new-password"
			class="w-full border border-gray-300 bg-transparent px-3 py-2 text-sm rounded-md focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
			name="confirmPassword"
			required
			type="password"
		/>
	</label>

	<button type="submit"
		class="w-full rounded-md px-4 py-2 font-semibold transition-colors
			bg-gray-900 text-white
			disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed disabled:border disabled:border-gray-300
			hover:bg-black"
	>
		Sign Up
	</button>
</form>

<!-- 🙈 -->
