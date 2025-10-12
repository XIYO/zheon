import { query, form, getRequestEvent } from '$app/server';
import { SummarySchema } from '$lib/schemas/summary-schema.js';
import { error } from '@sveltejs/kit';

/**
 * Query: 최근 요약 목록 조회
 * - 모든 사용자: 모든 요약 조회 가능 (공개 캐시)
 */
export const getRecentSummaries = query(async () => {
	const { locals } = getRequestEvent();
	const { supabase } = locals;

	const { data, error: dbError } = await supabase
		.from('summary')
		.select('id, url, title, summary, processing_status, thumbnail_url, created_at, updated_at')
		.order('updated_at', { ascending: false })
		.limit(10);

	if (dbError) {
		console.error('Failed to load summaries:', dbError);
		throw error(500, dbError.message);
	}

	return data ?? [];
});

/**
 * Form: 요약 제출
 * - 익명 사용자 포함 모두 가능
 * - Valibot 자동 검증
 * - Edge Function이 모든 것 처리 (upsert, 메타데이터 추출, 요약 생성)
 */
export const createSummary = form(SummarySchema, async ({ url }) => {
	const { locals } = getRequestEvent();
	const { supabase } = locals;

	// Edge Function 호출 - 모든 처리 위임
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
