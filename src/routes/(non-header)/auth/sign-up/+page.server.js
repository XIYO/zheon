import { fail, redirect } from '@sveltejs/kit';
import { signUpSchema } from '$lib/components/signUpSchema.js';

export const actions = {
	default: async ({ request, url, locals: { supabase } }) => {
		const formData = Object.fromEntries(await request.formData());
		const result = signUpSchema.safeParse(formData);
		if (!result.success) {
			let failure = Object.create(null);
			for (const err of result.error.errors) {
				const key = String(err.path[0]);
				failure[key] = err.message;
			}
			return fail(400, { failure });
		}
		const { email, password, name } = result.data;
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
			return fail(error.status ?? 400, { error: error.message });
		}
		redirect(303, '/auth/sign-up/done');
	}
};
