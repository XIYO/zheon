import { createServerClient, type CookieMethodsServer } from '@supabase/ssr';
import { redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { createClient } from '@supabase/supabase-js';
import type { Handle } from '@sveltejs/kit';
import { createYouTubeClient } from '$lib/server/youtube';
import { logger } from '$lib/logger';
import type { Database } from '$lib/types/database.types';
import type { Innertube } from 'youtubei.js';

const supabase: Handle = async ({ event, resolve }) => {
	const timerLabel = `[hooks.supabase] ${event.url.pathname}`;
	console.time(timerLabel);

	const cookieMethods: CookieMethodsServer = {
		getAll: () => event.cookies.getAll(),
		setAll: (cookiesToSet) => {
			cookiesToSet.forEach(({ name, value, options }) => {
				event.cookies.set(name, value, { ...options, path: '/' });
			});
		}
	};

	event.locals.supabase = createServerClient<Database>(
		publicEnv.PUBLIC_SUPABASE_URL,
		publicEnv.PUBLIC_SUPABASE_PUBLISHABLE_KEY,
		{
			cookies: cookieMethods
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

const adminSupabaseClient = createClient<Database>(
	publicEnv.PUBLIC_SUPABASE_URL,
	env.SUPABASE_SECRET_KEY
);

const adminSupabase: Handle = async ({ event, resolve }) => {
	event.locals.adminSupabase = adminSupabaseClient;
	return resolve(event);
};

const youtubeClient: Innertube = await createYouTubeClient({ socksProxy: env.TOR_SOCKS5_PROXY });

const youtube: Handle = async ({ event, resolve }) => {
	event.locals.youtube = youtubeClient;
	return resolve(event);
};

export const handle = sequence(supabase, adminSupabase, youtube);
