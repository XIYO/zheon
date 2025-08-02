import { fail, redirect } from '@sveltejs/kit';

export const actions = {
	// 구글 OAuth 로그인 (유일한 인증 방법)
	google: async ({ url, locals: { supabase } }) => {
		const baseUrl = url.origin;
		const redirectTo = url.searchParams.get('redirectTo') || '/dashboard';
		const callbackUrl = `${baseUrl}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`;

		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: callbackUrl
			}
		});

		if (error) {
			return fail(400, {
				message: error.message
			});
		}

		if (data?.url) {
			throw redirect(303, data.url);
		} else {
			return fail(400, {
				message: 'OAuth 인증 URL을 가져올 수 없습니다.'
			});
		}
	}
};
