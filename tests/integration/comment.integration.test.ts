import { describe, it, expect, beforeAll } from 'vitest';
import { CommentService } from '$lib/server/services/youtube/comment.service';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database.types';

/**
 * CommentService 통합 테스트
 * 실제 YouTube API + Supabase 호출
 *
 * 실행: pnpm vitest run tests/integration/comment.integration.test.ts
 */

describe('CommentService Integration Test', () => {
	let service: CommentService;
	let supabase: ReturnType<typeof createClient<Database>>;

	const TEST_VIDEO_ID = process.env.TEST_VIDEO_ID || 'dQw4w9WgXcQ';
	const TIMEOUT = 60000;

	beforeAll(() => {
		const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
		const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
		const proxyUrl = process.env.HTTP_PROXY_URL;

		if (!supabaseUrl || !supabaseSecretKey) {
			throw new Error('Supabase 환경 변수가 필요합니다');
		}

		if (!proxyUrl) {
			throw new Error('HTTP_PROXY_URL 환경 변수가 필요합니다');
		}

		supabase = createClient<Database>(supabaseUrl, supabaseSecretKey);

		service = new CommentService(supabase);

		console.log(`\n프록시 URL: ${proxyUrl}`);
		console.log(`테스트 영상 ID: ${TEST_VIDEO_ID}\n`);
	});

	it(
		'1배치 수집 (약 20개)',
		async () => {
			const result = await service.collectComments(TEST_VIDEO_ID, { maxBatches: 1 });

			expect(result.success).toBe(true);
			expect(result.videoId).toBe(TEST_VIDEO_ID);
			expect(result.collected).toBeGreaterThan(0);
			expect(result.batches).toBe(1);

			console.log(`✅ 1배치 수집: ${result.collected}개`);
		},
		TIMEOUT
	);

	it(
		'5배치 수집 (약 100개)',
		async () => {
			const result = await service.collectComments(TEST_VIDEO_ID, { maxBatches: 5 });

			expect(result.success).toBe(true);
			expect(result.batches).toBeLessThanOrEqual(5);

			console.log(`✅ 5배치 수집: ${result.batches}배치, ${result.collected}개`);
		},
		TIMEOUT
	);

	it(
		'10배치 수집 (약 200개)',
		async () => {
			const result = await service.collectComments(TEST_VIDEO_ID, { maxBatches: 10 });

			expect(result.success).toBe(true);
			expect(result.batches).toBeLessThanOrEqual(10);

			console.log(`✅ 10배치 수집: ${result.batches}배치, ${result.collected}개`);
		},
		TIMEOUT
	);

	it(
		'20배치 수집 (약 400개)',
		async () => {
			const result = await service.collectComments(TEST_VIDEO_ID, { maxBatches: 20 });

			expect(result.success).toBe(true);
			expect(result.batches).toBeLessThanOrEqual(20);

			console.log(`✅ 20배치 수집: ${result.batches}배치, ${result.collected}개`);
		},
		TIMEOUT
	);

	it(
		'DB에서 댓글을 조회할 수 있어야 함',
		async () => {
			await service.collectComments(TEST_VIDEO_ID, { maxBatches: 1 });

			const result = await service.getCommentsFromDB(TEST_VIDEO_ID);

			expect(result.success).toBe(true);
			expect(result.videoId).toBe(TEST_VIDEO_ID);
			expect(result.count).toBeGreaterThan(0);
			expect(Array.isArray(result.comments)).toBe(true);

			console.log(`✅ DB 조회 성공: ${result.count}개`);
		},
		TIMEOUT
	);
});
