import { redirect } from '@sveltejs/kit';

/** @type {import('../../../../../.svelte-kit/types/src/routes').Actions} */
export const actions = {
	default: async ({ locals: { supabase } }) => {
		await supabase.auth.signOut();
		redirect(303, '/');
	}
};
