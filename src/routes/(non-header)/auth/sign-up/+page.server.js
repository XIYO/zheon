import { fail, redirect } from '@sveltejs/kit';
import { signUpSchema } from '$lib/schemas/auth.js';

export const actions = {
	// 구글 OAuth 회원가입
	google: async ({ url, locals: { supabase } }) => {
		const baseUrl = url.origin;
		const redirectTo = url.searchParams.get('redirectTo') || '/auth/sign-up/done';
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
	},

	// 이메일/패스워드 회원가입
	email: async ({ request, url, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = formData.get('email');
		const password = formData.get('password');
		const confirmPassword = formData.get('password-confirm');

		// Zod 유효성 검사
		const validation = signUpSchema.safeParse({
			email,
			password,
			confirmPassword
		});

		if (!validation.success) {
			const errors = validation.error.format();
			return fail(400, {
				message:
					errors.email?._errors[0] ||
					errors.password?._errors[0] ||
					errors.confirmPassword?._errors[0] ||
					'입력 정보를 확인해주세요.',
				errors: {
					email: errors.email?._errors,
					password: errors.password?._errors,
					confirmPassword: errors.confirmPassword?._errors
				}
			});
		}

		const baseUrl = url.origin;
		const redirectTo = url.searchParams.get('redirectTo') || '/auth/sign-up/done';
		const callbackUrl = `${baseUrl}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`;

		// Supabase 회원가입
		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				emailRedirectTo: callbackUrl
			}
		});

		if (error) {
			return fail(400, {
				message: error.message
			});
		}

		if (data?.user) {
			// 이메일 확인이 필요한 경우
			if (data.user.identities?.length === 0) {
				throw redirect(303, '/auth/sign-up/done?email-verification=pending');
			}
			// 바로 로그인 가능한 경우
			throw redirect(303, redirectTo);
		} else {
			return fail(400, {
				message: '회원가입에 실패했습니다.'
			});
		}
	}
};
