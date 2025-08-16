import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr';
import { env } from '$env/dynamic/public';

/** @type {import('./$types').LayoutServerLoad} */
export const load = async ({ depends, fetch, data }) => {
	/**
	 * Declare a dependency so the layout can be invalidated, for example, on
	 * session refresh.
	 */
	depends('supabase:auth');

	const supabase = isBrowser()
		? createBrowserClient(env.PUBLIC_SUPABASE_URL, env.PUBLIC_SUPABASE_ANON_KEY, {
				global: {
					fetch
				}
			})
		: createServerClient(env.PUBLIC_SUPABASE_URL, env.PUBLIC_SUPABASE_ANON_KEY, {
				global: {
					fetch
				},
				cookies: {
					getAll: () => data.cookies
				}
			});

	const {
		data: { session }
	} = await supabase.auth.getSession();

	const {
		data: { user }
	} = await supabase.auth.getUser();

	return { session, supabase, user };
};
