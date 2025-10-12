import { query, form, getRequestEvent } from '$app/server';
import { SummarySchema } from '$lib/schemas/summary-schema.js';
import { error } from '@sveltejs/kit';

/**
 * Query: 최근 요약 목록 조회
 * - 로그인 사용자: 자신의 pending/processing/failed + 모든 completed
 * - 비로그인: completed만
 */
export const getRecentSummaries = query(async () => {
	const { locals } = getRequestEvent();
	const { supabase, user } = locals;

	let query = supabase
		.from('summary')
		.select('id, url, title, summary, processing_status, thumbnail_url, created_at, updated_at')
		.order('updated_at', { ascending: false })
		.limit(10);

	// 로그인 사용자는 자신의 pending도 포함
	if (user) {
		query = query.or(
			`processing_status.eq.completed,and(user_id.eq.${user.id},processing_status.in.(pending,processing,failed))`
		);
	} else {
		query = query.eq('processing_status', 'completed');
	}

	const { data, error: dbError } = await query;

	if (dbError) {
		console.error('Failed to load summaries:', dbError);
		throw error(500, dbError.message);
	}

	return data ?? [];
});

/**
 * Form: 요약 제출
 * - 인증 필수
 * - Valibot 자동 검증
 * - Edge Function이 모든 것 처리 (upsert, 메타데이터 추출, 요약 생성)
 */
export const createSummary = form(SummarySchema, async ({ url }) => {
	const { locals } = getRequestEvent();
	const { supabase, user } = locals;

	if (!user) {
		throw error(401, '로그인이 필요합니다');
	}

	// Edge Function 호출 - 모든 처리 위임 (JWT 자동 전달)
	const { error: edgeError } = await supabase.functions.invoke('summary', {
		body: { url }
	});

	if (edgeError) {
		console.error('Edge function failed:', edgeError);
		throw error(500, edgeError.message || '요약 생성 실패');
	}

	// Query 갱신
	await getRecentSummaries().refresh();
});
