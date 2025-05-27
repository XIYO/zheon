import { redirect } from '@sveltejs/kit';

export const trailingSlash = 'always';

export async function load({ locals, url }) {
	// OAuth 콜백 처리: 메인 페이지에 code 파라미터가 있다면 콜백 페이지로 리디렉트
	const code = url.searchParams.get('code');
	if (code && url.pathname === '/') {
		console.log('메인 페이지에서 OAuth 코드 감지, 콜백 페이지로 리디렉트');
		const searchParams = new URLSearchParams(url.searchParams);
		throw redirect(303, `/auth/callback?${searchParams.toString()}`);
	}

	if (locals.session) {
		return {
			userMetadata: locals.user.user_metadata
		};
	}

	return {
		userMetadata: null
	};
}
