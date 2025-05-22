import { redirect, error } from '@sveltejs/kit';

/**  @type {import('../../../../../.svelte-kit/types/src/routes').PageServerLoad} */
export async function load({ url, locals }) {
	const code = url.searchParams.get('code')?.trim();
	const type = url.searchParams.get('type')?.trim();

	if (!code || !type) {
		error(400, { message: '코드 또는 타입이 누락되었습니다.' });
	}

	const supabase = locals.supabase;

	const { error: supabaseError } = await supabase.auth.exchangeCodeForSession(code);
	if (supabaseError) {
		return supabaseError;
	}

	redirect(303, '/dashboard');
}