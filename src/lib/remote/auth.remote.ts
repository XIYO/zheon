import { form, getRequestEvent } from '$app/server';
import { redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import { signInSchema, signUpSchema } from './auth.schema';

// 📧 이메일 로그인
export const signInEmail = form(signInSchema, async (data, invalid) => {
	const { locals, url } = getRequestEvent();

	const { error } = await locals.supabase.auth.signInWithPassword({
		email: data.email,
		password: data.password
	});

	if (error) {
		invalid.email('이메일 또는 비밀번호가 올바르지 않습니다');
		return;
	}

	const redirectTo = url.searchParams.get('redirectTo') || '/';
	redirect(303, redirectTo);
});

// 🔵 구글 로그인
export const signInGoogle = form(v.object({}), async (data, invalid) => {
	const { locals, url } = getRequestEvent();

	const redirectTo = url.searchParams.get('redirectTo') || '/';
	const callbackUrl = `${url.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`;

	const { data: oauthData, error } = await locals.supabase.auth.signInWithOAuth({
		provider: 'google',
		options: {
			redirectTo: callbackUrl,
			scopes: 'https://www.googleapis.com/auth/youtube.readonly',
			queryParams: {
				access_type: 'offline',
				prompt: 'consent'
			}
		}
	});

	if (error || !oauthData?.url) {
		invalid('OAuth URL을 가져올 수 없습니다');
		return;
	}

	redirect(303, oauthData.url);
});

// 📧 이메일 회원가입
export const signUpEmail = form(signUpSchema, async (data, invalid) => {
	const { locals, url } = getRequestEvent();

	const { data: userData, error } = await locals.supabase.auth.signUp({
		email: data.email,
		password: data.password,
		options: {
			emailRedirectTo: `${url.origin}/auth/callback`
		}
	});

	if (error) {
		if (error.message.includes('already registered')) {
			invalid.email('이미 가입된 이메일입니다');
		} else {
			invalid('회원가입에 실패했습니다');
		}
		return;
	}

	// 이메일 확인 필요 여부에 따라 리다이렉트
	if (userData.user?.identities?.length === 0) {
		redirect(303, '/auth/sign-up/done?email-verification=pending');
	} else {
		redirect(303, '/');
	}
});

// 🔵 구글 회원가입
export const signUpGoogle = form(v.object({}), async (data, invalid) => {
	const { locals, url } = getRequestEvent();

	const callbackUrl = `${url.origin}/auth/callback?redirectTo=/auth/sign-up/done`;

	const { data: oauthData, error } = await locals.supabase.auth.signInWithOAuth({
		provider: 'google',
		options: {
			redirectTo: callbackUrl,
			scopes: 'https://www.googleapis.com/auth/youtube.readonly',
			queryParams: {
				access_type: 'offline',
				prompt: 'consent'
			}
		}
	});

	if (error || !oauthData?.url) {
		invalid('OAuth URL을 가져올 수 없습니다');
		return;
	}

	redirect(303, oauthData.url);
});
