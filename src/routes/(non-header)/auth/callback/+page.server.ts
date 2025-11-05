import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals: { supabase } }) => {
	const code = url.searchParams.get('code');
	const error_code = url.searchParams.get('error');
	const error_description = url.searchParams.get('error_description');
	const redirectTo = url.searchParams.get('redirectTo') || '/';

	if (error_code) {
		throw redirect(
			303,
			`/auth/sign-in?error=oauth_failed&description=${encodeURIComponent(error_description || '')}`
		);
	}

	if (code) {
		const { data, error } = await supabase.auth.exchangeCodeForSession(code);

		if (error) {
			throw redirect(
				303,
				`/auth/sign-in?error=session_failed&description=${encodeURIComponent(error.message)}`
			);
		}

		if (data?.session && data?.user) {
			throw redirect(303, redirectTo);
		} else {
			throw redirect(303, '/auth/sign-in?error=invalid_session');
		}
	}

	throw redirect(303, '/auth/sign-in?error=no_code');
};
