import { redirect } from '@sveltejs/kit';

export async function load({ url, locals: { supabase } }) {
	const code = url.searchParams.get('code');
	const error_code = url.searchParams.get('error');
	const error_description = url.searchParams.get('error_description');
	const redirectTo = url.searchParams.get('redirectTo') || '/dashboard';

	console.log('OAuth 콜백 처리:', {
		code: !!code,
		error_code,
		error_description,
		redirectTo,
		fullUrl: url.toString()
	});

	if (error_code) {
		console.error('OAuth 에러:', error_code, error_description);
		throw redirect(
			303,
			`/auth/sign-in?error=oauth_failed&description=${encodeURIComponent(error_description || '')}`
		);
	}

	if (code) {
		console.log('OAuth 코드 교환 시작:', code.substring(0, 10) + '...');

		const { data, error } = await supabase.auth.exchangeCodeForSession(code);

		if (error) {
			console.error('세션 교환 에러:', error);
			throw redirect(
				303,
				`/auth/sign-in?error=session_failed&description=${encodeURIComponent(error.message)}`
			);
		}

		if (data?.session && data?.user) {
			console.log('OAuth 로그인 성공:', data.user.email);
			// 로그인 성공 시 redirect 파라미터로 지정된 페이지 또는 대시보드로 리다이렉트
			throw redirect(303, redirectTo);
		} else {
			console.error('세션 또는 사용자 정보가 없음:', data);
			throw redirect(303, '/auth/sign-in?error=invalid_session');
		}
	}

	// 코드가 없는 경우
	console.error('OAuth 콜백에 코드가 없음, URL:', url.toString());
	throw redirect(303, '/auth/sign-in?error=no_code');
}
