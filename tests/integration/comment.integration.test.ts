import { describe, it, expect, beforeAll } from 'vitest';
import { CommentService } from '$lib/server/services/youtube/comment.service';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database.types';
import { getYouTube } from '$lib/server/youtube-proxy';
import type { Innertube } from 'youtubei.js';
import { logger } from '$lib/logger';

/**
 * CommentService 통합 테스트
 * 실제 YouTube API + Supabase 호출
 *
 * 실행: pnpm vitest run tests/integration/comment.integration.test.ts
 */

describe('CommentService Integration Test', () => {
	let service: CommentService;
	let supabase: ReturnType<typeof createClient<Database>>;
	let youtube: Innertube;

	const TEST_VIDEO_ID = process.env.TEST_VIDEO_ID || 'dQw4w9WgXcQ';
	const TIMEOUT = 60000;

	beforeAll(async () => {
		const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
		const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
		const socksProxy = process.env.TOR_SOCKS5_PROXY;

		if (!supabaseUrl || !supabaseSecretKey) {
			throw new Error('Supabase 환경 변수가 필요합니다');
		}

		if (!socksProxy) {
			throw new Error('TOR_SOCKS5_PROXY 환경 변수가 필요합니다');
		}

		supabase = createClient<Database>(supabaseUrl, supabaseSecretKey);
		youtube = await getYouTube(socksProxy);
		service = new CommentService(supabase, youtube);

		logger.info(`\n프록시 URL: ${socksProxy}`);
		logger.info(`테스트 영상 ID: ${TEST_VIDEO_ID}\n`);
	});

	it(
		'1배치 수집 (약 20개)',
		async () => {
			await service.collectComments(TEST_VIDEO_ID, { maxBatches: 1, force: true });

			const comments = await service.getCommentsFromDB(TEST_VIDEO_ID);

			expect(Array.isArray(comments)).toBe(true);
			expect(comments.length).toBeGreaterThan(0);

			logger.info(`✅ 1배치 수집: ${comments.length}개`);
		},
		TIMEOUT
	);

	it(
		'5배치 수집 (약 100개)',
		async () => {
			await service.collectComments(TEST_VIDEO_ID, { maxBatches: 5 });

			const comments = await service.getCommentsFromDB(TEST_VIDEO_ID);

			expect(comments.length).toBeGreaterThan(0);

			logger.info(`✅ 5배치 수집: ${comments.length}개`);
		},
		TIMEOUT
	);

	it(
		'10배치 수집 (약 200개)',
		async () => {
			await service.collectComments(TEST_VIDEO_ID, { maxBatches: 10 });

			const comments = await service.getCommentsFromDB(TEST_VIDEO_ID);

			expect(comments.length).toBeGreaterThan(0);

			logger.info(`✅ 10배치 수집: ${comments.length}개`);
		},
		TIMEOUT
	);

	it(
		'20배치 수집 (약 400개)',
		async () => {
			await service.collectComments(TEST_VIDEO_ID, { maxBatches: 20 });

			const comments = await service.getCommentsFromDB(TEST_VIDEO_ID);

			expect(comments.length).toBeGreaterThan(0);

			logger.info(`✅ 20배치 수집: ${comments.length}개`);
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

			logger.info(`✅ DB 조회 성공: ${comments.length}개`);
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

			logger.info(`✅ 증분 수집: 기존 댓글 확인 후 중지 (${secondComments.length}개)`);
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

			logger.info(`✅ 강제 재수집: ${comments.length}개`);
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

			logger.info(`✅ 기본값: ${comments.length}개`);
		},
		TIMEOUT
	);
});
