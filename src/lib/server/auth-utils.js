import { redirect } from '@sveltejs/kit';

/**
 * 인증 관련 유틸리티 함수들
 */

/**
 * 사용자 인증을 검증합니다
 * @param {object | null} user - locals에서 가져온 사용자 객체
 * @param {URL} url - 현재 URL 객체
 * @throws {Response} - 인증되지 않은 경우 로그인 페이지로 리다이렉트
 */
export function validateUser(user, url) {
	if (!user) {
		const currentPath = url.pathname + url.search;
		throw redirect(303, `/auth/sign-in/?redirectTo=${encodeURIComponent(currentPath)}`);
	}
}

/**
 * 사용자가 인증되었는지 확인합니다
 * @param {object | null} user - 확인할 사용자 객체
 * @returns {boolean} - 인증 여부
 */
export function isAuthenticated(user) {
	return user !== null && user !== undefined;
}

/**
 * 사용자 ID를 안전하게 가져옵니다
 * @param {object | null} user - 사용자 객체
 * @returns {string | null} - 사용자 ID 또는 null
 */
export function getUserId(user) {
	return user?.id || null;
}
