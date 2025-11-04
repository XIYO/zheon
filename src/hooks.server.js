import { paraglideMiddleware } from '$lib/paraglide/server';
import { createServerClient } from '@supabase/ssr';
import { redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { createClient } from '@supabase/supabase-js';

process.on('unhandledRejection', (reason, promise) => {
	console.error('=== UNHANDLED REJECTION ===');
	console.error('Reason:', reason);
	console.error('Promise:', promise);
	if (reason && typeof reason === 'object') {
		console.error('Reason details:', JSON.stringify(reason, null, 2));
	}
});

/** @type {import('@sveltejs/kit').Handle} */
const handleParaglide = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
		});
	});

/** @type {import('@sveltejs/kit').Handle} */
const supabase = async ({ event, resolve }) => {
	/**
	 * Creates a Supabase client specific to this server request.
	 *
	 * The Supabase client gets the Auth token from the request cookies.
	 */
	console.log('[hooks.server.js] SUPABASE_URL:', publicEnv.PUBLIC_SUPABASE_URL);
	console.log('[hooks.server.js] SUPABASE_KEY:', publicEnv.PUBLIC_SUPABASE_PUBLISHABLE_KEY);
	event.locals.supabase = createServerClient(
		publicEnv.PUBLIC_SUPABASE_URL,
		publicEnv.PUBLIC_SUPABASE_PUBLISHABLE_KEY,
		{
			cookies: {
				getAll: () => event.cookies.getAll(),
				/**
				 * SvelteKit's cookies API requires `path` to be explicitly set in
				 * the cookie options. Setting `path` to `/` replicates previous/
				 * standard behavior.
				 */
				setAll: (cookiesToSet) => {
					cookiesToSet.forEach(({ name, value, options }) => {
						event.cookies.set(name, value, { ...options, path: '/' });
					});
				}
			},
			db: {
				schema: 'zheon'
			}
		}
	);

	/**
	 * Unlike `supabase.auth.getSession()`, which returns the session _without_
	 * validating the JWT, this function also calls `getUser()` to validate the
	 * JWT before returning the session.
	 *
	 * If provider_token is missing (OAuth token expired), automatically refreshes the session.
	 */
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
				// JWT validation has failed
				return { session: null, user: null };
			}

			// provider_token이 없으면 세션 refresh 시도
			if (session.provider_token === undefined || session.provider_token === null) {
				try {
					const { data: refreshData, error: refreshError } =
						await event.locals.supabase.auth.refreshSession();

					if (!refreshError && refreshData.session) {
						// refresh 성공 시 쿠키 자동 업데이트됨
						return { session: refreshData.session, user: refreshData.user };
					}

					// refresh 실패 시 기존 세션 반환
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
			/**
			 * Supabase libraries use the `content-range` and `x-supabase-api-version`
			 * headers, so we need to tell SvelteKit to pass it through.
			 */
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};

/** @type {import('@sveltejs/kit').Handle} */
const adminSupabase = async ({ event, resolve }) => {
	try {
		event.locals.adminSupabase = createClient(publicEnv.PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
			auth: {
				persistSession: false,
				autoRefreshToken: false
			},
			db: {
				schema: 'zheon'
			}
		});
	} catch (error) {
		console.error('[adminSupabase] Error creating admin client:', error);
	}

	return resolve(event);
};

/** @type {import('@sveltejs/kit').Handle} */
const authGuard = async ({ event, resolve }) => {
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

export const handle = sequence(handleParaglide, supabase, adminSupabase, authGuard);
