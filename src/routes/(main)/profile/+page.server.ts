import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { user } }) => {
	if (!user) {
		throw redirect(303, '/auth/sign-in');
	}
};
