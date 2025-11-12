import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr';
import { env } from '$env/dynamic/public';
import type { LayoutLoad } from './$types';
import type { Database } from '$lib/types/database.types';
import { logger } from '$lib/logger';

export const load = (async ({ depends, fetch, data }) => {
	depends('supabase:auth');

	const supabase = isBrowser()
		? createBrowserClient<Database>(env.PUBLIC_SUPABASE_URL, env.PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
				global: {
					fetch
				},
				db: {}
			})
		: createServerClient<Database>(env.PUBLIC_SUPABASE_URL, env.PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
				global: {
					fetch
				},
				cookies: {
					getAll: () => data.cookies
				},
				db: {}
			});

	let user = null;
	if (process.env.DISABLE_AUTH !== '1' && process.env.DISABLE_AUTH !== 'true') {
		try {
			const {
				data: { user: fetchedUser }
			} = await supabase.auth.getUser();
			user = fetchedUser;
		} catch (error) {
			logger.error('[Layout] Failed to get user:', error);
		}
	}

	return {
		supabase,
		user,
		session: null
	};
}) satisfies LayoutLoad;
