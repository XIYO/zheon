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
			await service.collectComments(TEST_VIDEO_ID, { maxBatches: 1, force: true });

			const comments = await service.getCommentsFromDB(TEST_VIDEO_ID);

			expect(Array.isArray(comments)).toBe(true);
			expect(comments.length).toBeGreaterThan(0);

			console.log(`✅ 1배치 수집: ${comments.length}개`);
		},
		TIMEOUT
	);

	it(
		'5배치 수집 (약 100개)',
		async () => {
			await service.collectComments(TEST_VIDEO_ID, { maxBatches: 5 });

			const comments = await service.getCommentsFromDB(TEST_VIDEO_ID);

			expect(comments.length).toBeGreaterThan(0);

			console.log(`✅ 5배치 수집: ${comments.length}개`);
		},
		TIMEOUT
	);

	it(
		'10배치 수집 (약 200개)',
		async () => {
			await service.collectComments(TEST_VIDEO_ID, { maxBatches: 10 });

			const comments = await service.getCommentsFromDB(TEST_VIDEO_ID);

			expect(comments.length).toBeGreaterThan(0);

			console.log(`✅ 10배치 수집: ${comments.length}개`);
		},
		TIMEOUT
	);

	it(
		'20배치 수집 (약 400개)',
		async () => {
			await service.collectComments(TEST_VIDEO_ID, { maxBatches: 20 });

			const comments = await service.getCommentsFromDB(TEST_VIDEO_ID);

			expect(comments.length).toBeGreaterThan(0);

			console.log(`✅ 20배치 수집: ${comments.length}개`);
		},
		TIMEOUT
	);

	it(
		'DB에서 댓글을 조회할 수 있어야 함',
		async () => {
			await service.collectComments(TEST_VIDEO_ID, { maxBatches: 1 });

			const comments = await service.getCommentsFromDB(TEST_VIDEO_ID);

			expect(Array.isArray(comments)).toBe(true);
			expect(comments.length).toBeGreaterThan(0);

			console.log(`✅ DB 조회 성공: ${comments.length}개`);
		},
		TIMEOUT
	);

	it(
		'증분 수집: 이미 댓글이 있으면 중지 (force=false)',
		async () => {
			await supabase.from('comments').delete().eq('video_id', TEST_VIDEO_ID);

			await service.collectComments(TEST_VIDEO_ID, {
				maxBatches: 1,
				force: true
			});

			const firstComments = await service.getCommentsFromDB(TEST_VIDEO_ID);
			const firstCount = firstComments.length;

			await service.collectComments(TEST_VIDEO_ID, {
				maxBatches: 5,
				force: false
			});

			const secondComments = await service.getCommentsFromDB(TEST_VIDEO_ID);
			expect(secondComments.length).toBe(firstCount);

			console.log(`✅ 증분 수집: 기존 댓글 확인 후 중지 (${secondComments.length}개)`);
		},
		TIMEOUT
	);

	it(
		'강제 재수집: force=true이면 기존 댓글 무시하고 새로 수집',
		async () => {
			await service.collectComments(TEST_VIDEO_ID, { maxBatches: 1, force: true });

			await service.collectComments(TEST_VIDEO_ID, {
				maxBatches: 5,
				force: true
			});

			const comments = await service.getCommentsFromDB(TEST_VIDEO_ID);
			expect(comments.length).toBeGreaterThan(0);

			console.log(`✅ 강제 재수집: ${comments.length}개`);
		},
		TIMEOUT
	);

	it(
		'기본값 테스트: maxBatches=5, force=false',
		async () => {
			await supabase.from('comments').delete().eq('video_id', TEST_VIDEO_ID);

			await service.collectComments(TEST_VIDEO_ID);

			const comments = await service.getCommentsFromDB(TEST_VIDEO_ID);
			expect(comments.length).toBeGreaterThan(0);

			console.log(`✅ 기본값: ${comments.length}개`);
		},
		TIMEOUT
	);
});
