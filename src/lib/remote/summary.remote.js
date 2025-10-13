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
 * - DB INSERT → Webhook → insight Edge Function 자동 트리거
 */
export const createSummary = form(SummarySchema, async ({ url }) => {
	const { locals } = getRequestEvent();
	const { supabase } = locals;

	// summary 테이블에 직접 INSERT (Webhook이 insight 트리거)
	const { error: dbError } = await supabase
		.from('summary')
		.insert({
			url,
			title: '정리 중...',
			summary: '영상을 분석하고 있습니다',
			processing_status: 'pending'
		});

	if (dbError) {
		console.error('DB insert failed:', dbError);
		throw error(500, dbError.message || '요약 생성 실패');
	}

	// Query 갱신
	await getRecentSummaries().refresh();
});
