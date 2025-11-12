import { createServerClient } from '@supabase/ssr';
import { redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { createClient } from '@supabase/supabase-js';
import type { Handle } from '@sveltejs/kit';
import { getYouTube } from '$lib/server/youtube-proxy';
import { logger } from '$lib/logger';
import type { Database } from '$lib/types/database.types';

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

	try {
		console.time(`[hooks.youtube.getYouTube] ${event.url.pathname}`);
		event.locals.youtube = await getYouTube(env.TOR_SOCKS5_PROXY);
		console.timeEnd(`[hooks.youtube.getYouTube] ${event.url.pathname}`);
	} catch (error) {
		logger.error('[youtube] Error getting YouTube client:', error);
	}

	const result = await resolve(event);
	console.timeEnd(timerLabel);
	return result;
};

export const handle = sequence(adminSupabase, authGuard, youtube);
