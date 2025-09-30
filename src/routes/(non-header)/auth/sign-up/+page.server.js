import { fail, redirect } from '@sveltejs/kit';
import { LuciaError } from 'lucia';
import { signUpSchema } from '$lib/schemas/auth.js';

const oauthRedirect = (url, defaultRedirect) => {
	const redirectTo = url.searchParams.get('redirectTo') ?? defaultRedirect;
	return {
		redirectTo,
		callbackUrl: new URL('/auth/sign-in/google/callback', url.origin).toString()
	};
};

export const actions = {
	google: async ({ locals, url }) => {
		const { redirectTo, callbackUrl } = oauthRedirect(url, '/auth/sign-up/done');
		const googleAuth = locals.getGoogleProvider(callbackUrl);
		const state = locals.issueOAuthState({ redirectTo });
		const [authorizationUrl] = await googleAuth.getAuthorizationUrl();

		authorizationUrl.searchParams.set('state', state);
		throw redirect(303, authorizationUrl.toString());
	},
	email: async ({ locals, request, url }) => {
		const formData = await request.formData();
		const email = formData.get('email');
		const password = formData.get('password');
		const confirmPassword = formData.get('password-confirm');

		const validation = signUpSchema.safeParse({ email, password, confirmPassword });
		if (!validation.success) {
			const errors = validation.error.format();
			return fail(400, {
				message:
					errors.email?._errors?.[0] ||
					errors.password?._errors?.[0] ||
					errors.confirmPassword?._errors?.[0] ||
					'입력 정보를 확인해주세요.',
				errors: {
					email: errors.email?._errors ?? [],
					password: errors.password?._errors ?? [],
					confirmPassword: errors.confirmPassword?._errors ?? []
				}
			});
		}

		try {
			const user = await locals.lucia.createUser({
				key: {
					providerId: 'email',
					providerUserId: validation.data.email,
					password: validation.data.password
				},
				attributes: {
					email: validation.data.email,
					email_verified: 0,
					display_name: null,
					picture_url: null,
					locale: null
				}
			});

			const session = await locals.lucia.createSession({
				userId: user.userId,
				attributes: {}
			});
			locals.auth.setSession(session);

			const redirectTo = url.searchParams.get('redirectTo') ?? '/auth/sign-up/done';
			throw redirect(303, redirectTo);
		} catch (error) {
			if (error && typeof error === 'object' && 'location' in error && 'status' in error) {
				throw error;
			}

			if (error instanceof LuciaError) {
				if (error.message === 'AUTH_DUPLICATE_KEY_ID') {
					return fail(400, {
						message: '이미 가입된 이메일입니다.'
					});
				}
			}

			console.error('Email 회원가입 실패:', error);
			return fail(500, {
				message: '회원가입 중 문제가 발생했습니다.'
			});
		}
	}
};
