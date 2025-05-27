import { redirect, error } from '@sveltejs/kit';

export async function load({ url, locals: { supabase } }) {
	// Supabase OTP 에러 파라미터 처리
	const otpError = url.searchParams.get('error');
	if (otpError) {
		const errorCode = url.searchParams.get('error_code');
		const errorDescription = url.searchParams.get('error_description');
		console.error('OTP 에러:', { otpError, errorCode, errorDescription });
		// 에러 페이지로 전파
		throw error(400, `${errorCode ?? otpError} - ${errorDescription ?? ''}`);
	}
	const code = url.searchParams.get('code')?.trim();

	if (!code) {
		throw error(400, { message: '코드가 누락되었습니다.' });
	}

	const { error: supabaseError } = await supabase.auth.exchangeCodeForSession(code);
	if (supabaseError) {
		return supabaseError;
	}

	redirect(303, '/dashboard');
}
