import { fail, redirect } from '@sveltejs/kit';
import { LuciaError } from 'lucia';
import { signInSchema } from '$lib/schemas/auth.js';

const oauthRedirect = (url, defaultRedirect) => {
	const redirectTo = url.searchParams.get('redirectTo') ?? defaultRedirect;
	return {
		redirectTo,
		callbackUrl: new URL('/auth/sign-in/google/callback', url.origin).toString()
	};
};

export const actions = {
	google: async ({ locals, url }) => {
		const { redirectTo, callbackUrl } = oauthRedirect(url, '/');
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

		const validation = signInSchema.safeParse({ email, password });
		if (!validation.success) {
			const errors = validation.error.format();
			return fail(400, {
				message:
					errors.email?._errors?.[0] ||
					errors.password?._errors?.[0] ||
					'이메일과 비밀번호를 확인해주세요.',
				errors: {
					email: errors.email?._errors ?? [],
					password: errors.password?._errors ?? []
				}
			});
		}

		try {
			const key = await locals.lucia.useKey(
				'email',
				validation.data.email,
				validation.data.password
			);
			const session = await locals.lucia.createSession({
				userId: key.userId,
				attributes: {}
			});
			locals.auth.setSession(session);

			const redirectTo = url.searchParams.get('redirectTo') ?? '/';
			throw redirect(303, redirectTo);
		} catch (error) {
			if (error && typeof error === 'object' && 'location' in error && 'status' in error) {
				throw error;
			}

			if (error instanceof LuciaError) {
				if (error.message === 'AUTH_INVALID_KEY_ID' || error.message === 'AUTH_INVALID_PASSWORD') {
					return fail(400, {
						message: '이메일 또는 비밀번호가 올바르지 않습니다.'
					});
				}
			}

			console.error('Email 로그인 실패:', error);
			return fail(500, {
				message: '로그인 중 문제가 발생했습니다.'
			});
		}
	}
};
