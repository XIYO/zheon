import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { safeGetSession }, url, cookies }) => {
	// Skip auth network calls for non-interactive environments (e.g., docs/screenshots)
	if (process.env.DISABLE_AUTH === '1' || process.env.DISABLE_AUTH === 'true') {
		return {
			user: null,
			cookies: cookies.getAll()
		};
	}
	const code = url.searchParams.get('code');
	if (code && url.pathname === '/') {
		const searchParams = new URLSearchParams(url.searchParams);
		throw redirect(303, `/auth/callback?${searchParams.toString()}`);
	}

	const { user } = await safeGetSession();
	return {
		user,
		cookies: cookies.getAll()
	};
};
