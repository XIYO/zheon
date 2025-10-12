import { redirect } from '@sveltejs/kit';

export async function load({ locals: { user } }) {
	if (!user) {
		throw redirect(303, '/auth/sign-in');
	}
};
