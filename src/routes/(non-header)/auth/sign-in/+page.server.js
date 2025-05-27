import { fail, redirect } from '@sveltejs/kit';
import { signInSchema } from '$lib/components/signInSchema.js';

export const actions = {
	// 기존 이메일/패스워드 로그인
	'sign-in': async ({ request, url, locals: { supabase } }) => {
		const formData = Object.fromEntries(await request.formData());
		const validatedSignIn = signInSchema.safeParse(formData);
		if (!validatedSignIn.success) {
			let failure = Object.create(null);
			for (const err of validatedSignIn.error.errors) {
				const key = String(err.path[0]);
				failure[key] = err.message;
			}
			return fail(400, { failure });
		}
		const { email, password } = validatedSignIn.data;
		const redirectTo = url.searchParams.get('redirectTo') || '/';
		const { error } = await supabase.auth.signInWithPassword({ email, password });
		if (error) {
			const failure = Object.create(null);
			failure.message = error.message;
			return fail(400, { failure });
		}
		throw redirect(303, redirectTo);
	},

	// 구글 OAuth 로그인
	google: async ({ url, locals: { supabase } }) => {
		console.log('Google OAuth 요청 시작');
		const redirectTo = url.searchParams.get('redirectTo') || '/dashboard';

		const baseUrl = url.origin;
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
