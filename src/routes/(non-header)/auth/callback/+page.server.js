import { redirect } from '@sveltejs/kit';

export async function load({ url, locals: { supabase } }) {
	const code = url.searchParams.get('code');
	const error_code = url.searchParams.get('error');
	const error_description = url.searchParams.get('error_description');
	const redirectTo = url.searchParams.get('redirectTo') || '/dashboard';

	console.log('OAuth 콜백 처리:', { code: !!code, error_code, error_description, redirectTo });

	if (error_code) {
		console.error('OAuth 에러:', error_code, error_description);
		throw redirect(303, '/auth/sign-in?error=oauth_failed');
	}

	if (code) {
		const { data, error } = await supabase.auth.exchangeCodeForSession(code);
		
		if (error) {
			console.error('세션 교환 에러:', error);
			throw redirect(303, '/auth/sign-in?error=session_failed');
		}

		console.log('OAuth 로그인 성공:', data.user?.email);
		// 로그인 성공 시 redirect 파라미터로 지정된 페이지 또는 대시보드로 리다이렉트
		throw redirect(303, redirectTo);
	}

	// 코드가 없는 경우
	console.error('OAuth 콜백에 코드가 없음');
	throw redirect(303, '/auth/sign-in?error=no_code');
}
