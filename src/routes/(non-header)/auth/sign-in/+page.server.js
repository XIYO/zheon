import { fail, redirect } from '@sveltejs/kit';

export const actions = {
	default: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData()
		const email = formData.get('email')
		const password = formData.get('password')

		const { error } = await supabase.auth.signInWithPassword({ email, password })
		if (error) {
			return fail(error.status, {
        message: error.message
      })
		} else {
			throw redirect(303, '/dashboard')
		}
	},
}