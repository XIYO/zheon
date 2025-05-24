import { fail, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';

export const actions = {
	// 기존 이메일/패스워드 로그인
	'sign-in': async ({ request, url, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = formData.get('email')?.toString();
		const password = formData.get('password')?.toString();
		const redirectTo = url.searchParams.get('redirectTo') || '/';

		if (!email || !password) {
			return fail(400, {
				message: '이메일과 패스워드를 입력해주세요.'
			});
		}

		const { error } = await supabase.auth.signInWithPassword({ email, password });
		if (error) {
			return fail(400, { message: error.message });
		} else {
			throw redirect(303, redirectTo);
		}
	},

	// 구글 OAuth 로그인
	google: async ({ url, locals: { supabase } }) => {
		console.log('Google OAuth 요청 시작');
		const redirectTo = url.searchParams.get('redirectTo') || '/dashboard';

		// 환경에 따라 동적으로 리디렉트 URL 설정
		const baseUrl = dev ? 'http://localhost:5173' : url.origin;
		const callbackUrl = `${baseUrl}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`;

		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: callbackUrl
			}
		});

		if (error) {
			console.error('Google OAuth 에러:', error);
			return fail(400, {
				message: error.message
			});
		}

		console.log('Google OAuth 응답 데이터:', data);

		if (data?.url) {
			console.log('Google OAuth 성공, 리디렉트 URL:', data.url);
			throw redirect(303, data.url);
		} else {
			console.error('OAuth URL이 없습니다:', data);
			return fail(400, {
				message: 'OAuth 인증 URL을 가져올 수 없습니다.'
			});
		}
	}
};
