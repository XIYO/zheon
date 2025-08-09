import { fail, redirect } from '@sveltejs/kit';
import { signInSchema } from '$lib/schemas/auth.js';

export const actions = {
	// 구글 OAuth 로그인
	google: async ({ url, locals: { supabase } }) => {
		const baseUrl = url.origin;
		const redirectTo = url.searchParams.get('redirectTo') || '/';
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
	
	// 이메일/패스워드 로그인
	email: async ({ request, url, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = formData.get('email');
		const password = formData.get('password');
		
		// Zod 유효성 검사
		const validation = signInSchema.safeParse({
			email,
			password
		});
		
		if (!validation.success) {
			const errors = validation.error.format();
			return fail(400, {
				message: errors.email?._errors[0] || errors.password?._errors[0] || '입력 정보를 확인해주세요.',
				errors: {
					email: errors.email?._errors,
					password: errors.password?._errors
				}
			});
		}
		
		const redirectTo = url.searchParams.get('redirectTo') || '/';
		
		// Supabase 이메일/패스워드 로그인
		const { data, error } = await supabase.auth.signInWithPassword({
			email: validation.data.email,
			password: validation.data.password
		});
		
		if (error) {
			return fail(400, {
				message: error.message
			});
		}
		
		if (data?.user) {
			redirect(303, redirectTo);
		} else {
			return fail(400, {
				message: '로그인에 실패했습니다.'
			});
		}
	}
};
