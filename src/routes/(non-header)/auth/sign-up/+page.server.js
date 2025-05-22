import { fail, redirect } from '@sveltejs/kit'

/** @type {import('../../../../../.svelte-kit/types/src/routes').Actions} */
export const actions = {
	default: async ({ request, url, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = formData.get('email');
		const password = formData.get('password');
		const confirmPassword = formData.get('confirm-password');
		const name = formData.get('name');

		if (password !== confirmPassword) {
			return fail(400, { 'confirm-password': 'Passwords do not match' });
		}

		const redirectTo = `${url.origin}/auth/verify-email`;
		const { error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				data: { name },
				emailRedirectTo: redirectTo
			}
		});

		if (error) {
			console.error(error);
			return fail(error.status, { error: error.message });
		}

		redirect(303, '/auth/sign-up/done');
	}
};