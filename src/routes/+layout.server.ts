import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { safeGetSession }, url, cookies }) => {
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
