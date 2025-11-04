import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr';
import { env } from '$env/dynamic/public';

/** @typedef {import('$lib/types/database.types').Database} Database */

/** @type {import('./$types').LayoutLoad} */
export const load = async ({ depends, fetch, data }) => {
	/**
	 * Declare a dependency so the layout can be invalidated, for example, on
	 * session refresh.
	 */
	depends('supabase:auth');

	/** @type {import('@supabase/supabase-js').SupabaseClient<Database>} */
	const supabase = isBrowser()
		? createBrowserClient(env.PUBLIC_SUPABASE_URL, env.PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
				global: {
					fetch
				},
				db: {
					schema: 'zheon'
				}
			})
		: createServerClient(env.PUBLIC_SUPABASE_URL, env.PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
				global: {
					fetch
				},
				cookies: {
					getAll: () => data.cookies
				},
				db: {
					schema: 'zheon'
				}
			});

	let user = null;
	try {
		const {
			data: { user: fetchedUser }
		} = await supabase.auth.getUser();
		user = fetchedUser;
	} catch (error) {
		console.error('[Layout] Failed to get user:', error);
	}

	return {
		supabase,
		user
	};
};
