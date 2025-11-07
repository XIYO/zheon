import { createServerClient } from '@supabase/ssr';
import { redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { createClient } from '@supabase/supabase-js';
import type { Handle } from '@sveltejs/kit';
import { createYouTube } from '$lib/server/youtube-proxy';

process.on('unhandledRejection', (reason, promise) => {
	console.error('=== UNHANDLED REJECTION ===');
	console.error('Reason:', reason);
	console.error('Promise:', promise);
	if (reason && typeof reason === 'object') {
		console.error('Reason details:', JSON.stringify(reason, null, 2));
	}
});

const supabase: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient(
		publicEnv.PUBLIC_SUPABASE_URL,
		publicEnv.PUBLIC_SUPABASE_PUBLISHABLE_KEY,
		{
			cookies: {
				getAll: () => event.cookies.getAll(),
				setAll: (cookiesToSet) => {
					cookiesToSet.forEach(({ name, value, options }) => {
						event.cookies.set(name, value, { ...options, path: '/' });
					});
				}
			}
		}
	);

	event.locals.safeGetSession = async () => {
		try {
			const {
				data: { session }
			} = await event.locals.supabase.auth.getSession();
			if (!session) {
				return { session: null, user: null };
			}

			const {
				data: { user },
				error
			} = await event.locals.supabase.auth.getUser();
			if (error) {
				return { session: null, user: null };
			}

			if (session.provider_token === undefined || session.provider_token === null) {
				try {
					const { data: refreshData, error: refreshError } =
						await event.locals.supabase.auth.refreshSession();

					if (!refreshError && refreshData.session) {
						return { session: refreshData.session, user: refreshData.user };
					}

					console.warn('[safeGetSession] refresh 실패 - 재로그인 필요:', refreshError?.message);
				} catch (refreshError) {
					console.error('[safeGetSession] refresh exception:', refreshError);
				}
			}

			return { session, user };
		} catch (error) {
			console.error('[safeGetSession] Error:', error);
			return { session: null, user: null };
		}
	};

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};

const adminSupabase: Handle = async ({ event, resolve }) => {
	try {
		event.locals.adminSupabase = createClient(
			publicEnv.PUBLIC_SUPABASE_URL,
			env.SUPABASE_SECRET_KEY,
			{
				auth: {
					persistSession: false,
					autoRefreshToken: false
				}
			}
		);
	} catch (error) {
		console.error('[adminSupabase] Error creating admin client:', error);
	}

	return resolve(event);
};

const authGuard: Handle = async ({ event, resolve }) => {
	try {
		const { session, user } = await event.locals.safeGetSession();
		event.locals.session = session;
		event.locals.user = user;

		if (!event.locals.session && event.url.pathname.startsWith('/private')) {
			redirect(303, '/auth');
		}

		if (event.locals.session && event.url.pathname === '/auth') {
			redirect(303, '/private');
		}
	} catch (error) {
		console.error('[authGuard] Error:', error);
	}

	return resolve(event);
};

const youtube: Handle = async ({ event, resolve }) => {
	try {
		event.locals.youtube = await createYouTube(env.TOR_SOCKS5_PROXY);
	} catch (error) {
		console.error('[youtube] Error creating YouTube client:', error);
	}

	return resolve(event);
};

export const handle = sequence(supabase, adminSupabase, authGuard, youtube);
