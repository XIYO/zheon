import { createServerClient } from '@supabase/ssr';
import { redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { createClient } from '@supabase/supabase-js';
import type { Handle } from '@sveltejs/kit';
import { createYouTube } from '$lib/server/youtube-proxy';
import { logger } from '$lib/logger';
import type { Database } from '$lib/types/database.types';

process.on('unhandledRejection', (reason, promise) => {
	logger.error('=== UNHANDLED REJECTION ===');
	logger.error('Reason:', reason);
	logger.error('Promise:', promise);
	if (reason && typeof reason === 'object') {
		logger.error('Reason details:', JSON.stringify(reason, null, 2));
	}
});

const supabase: Handle = async ({ event, resolve }) => {
	const timerLabel = `[hooks.supabase] ${event.url.pathname}`;
	console.time(timerLabel);

	event.locals.supabase = createServerClient<Database>(
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
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	) as any;

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

					logger.warn('[safeGetSession] refresh 실패 - 재로그인 필요:', refreshError?.message);
				} catch (refreshError) {
					logger.error('[safeGetSession] refresh exception:', refreshError);
				}
			}

			return { session, user };
		} catch (error) {
			logger.error('[safeGetSession] Error:', error);
			return { session: null, user: null };
		}
	};

	const result = await resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});

	console.timeEnd(timerLabel);
	return result;
};

const adminSupabase: Handle = async ({ event, resolve }) => {
	const timerLabel = `[hooks.adminSupabase] ${event.url.pathname}`;
	console.time(timerLabel);

	try {
		event.locals.adminSupabase = createClient<Database>(
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
		logger.error('[adminSupabase] Error creating admin client:', error);
	}

	const result = await resolve(event);
	console.timeEnd(timerLabel);
	return result;
};

const authGuard: Handle = async ({ event, resolve }) => {
	const timerLabel = `[hooks.authGuard] ${event.url.pathname}`;
	console.time(timerLabel);

	if (process.env.DISABLE_AUTH === '1' || process.env.DISABLE_AUTH === 'true') {
		const result = await resolve(event);
		console.timeEnd(timerLabel);
		return result;
	}
	try {
		console.time(`[hooks.authGuard.safeGetSession] ${event.url.pathname}`);
		const { session, user } = await event.locals.safeGetSession();
		console.timeEnd(`[hooks.authGuard.safeGetSession] ${event.url.pathname}`);

		event.locals.session = session;
		event.locals.user = user;

		if (!event.locals.session && event.url.pathname.startsWith('/private')) {
			redirect(303, '/auth');
		}

		if (event.locals.session && event.url.pathname === '/auth') {
			redirect(303, '/private');
		}
	} catch (error) {
		logger.error('[authGuard] Error:', error);
	}

	const result = await resolve(event);
	console.timeEnd(timerLabel);
	return result;
};

const youtube: Handle = async ({ event, resolve }) => {
	const timerLabel = `[hooks.youtube] ${event.url.pathname}`;
	console.time(timerLabel);

	if (process.env.DISABLE_REMOTE === '1' || process.env.DISABLE_REMOTE === 'true') {
		const result = await resolve(event);
		console.timeEnd(timerLabel);
		return result;
	}
	try {
		console.time(`[hooks.youtube.createYouTube] ${event.url.pathname}`);
		event.locals.youtube = await createYouTube(env.TOR_SOCKS5_PROXY);
		console.timeEnd(`[hooks.youtube.createYouTube] ${event.url.pathname}`);
	} catch (error) {
		logger.error('[youtube] Error creating YouTube client:', error);
	}

	const result = await resolve(event);
	console.timeEnd(timerLabel);
	return result;
};

export const handle = sequence(supabase, adminSupabase, authGuard, youtube);
