import { query, getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import * as v from 'valibot';

/**
 * 현재 사용자 프로필 조회
 */
export const getProfile = query(async () => {
	const { locals } = getRequestEvent();
	const { supabase, safeGetSession } = locals;
	const { session, user } = await safeGetSession();

	if (!session) throw error(401, '로그인이 필요합니다');

	const { data: profile, error: profileError } = await supabase
		.from('profiles')
		.select('*')
		.eq('id', user.id)
		.single();

	if (profileError) throw error(500, profileError.message);

	return profile;
});
