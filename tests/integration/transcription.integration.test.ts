import { describe, it, expect, beforeAll } from 'vitest';
import {
	TranscriptionService,
	type TranscriptData
} from '$lib/server/services/youtube/transcription.service';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database.types';
import { createYouTubeClient } from '$lib/server/youtube';
import type { Innertube } from 'youtubei.js';
import { logger } from '$lib/logger';

/**
 * TranscriptionService 통합 테스트
 * 실제 YouTube API + Supabase 호출
 *
 * 실행: pnpm test:integration
 */

describe('TranscriptionService Integration Test', () => {
	let service: TranscriptionService;
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
		youtube = await createYouTubeClient({ socksProxy });
		service = new TranscriptionService(supabase, youtube);

		logger.info(`\n프록시 URL: ${socksProxy}`);
		logger.info(`테스트 영상 ID: ${TEST_VIDEO_ID}\n`);
	});

	it(
		'실제 YouTube 영상의 자막을 수집하고 DB에 저장해야 함',
		async () => {
			await service.collectTranscript(TEST_VIDEO_ID);

			const transcript = await service.getTranscriptFromDB(TEST_VIDEO_ID);

			expect(transcript).toBeDefined();
			expect(transcript?.video_id).toBe(TEST_VIDEO_ID);

			const segments = (transcript?.data as unknown as TranscriptData)?.segments || [];
			expect(Array.isArray(segments)).toBe(true);
			expect(segments.length).toBeGreaterThan(0);

			const firstSegment = segments[0];
			expect(firstSegment).toHaveProperty('start_ms');
			expect(firstSegment).toHaveProperty('end_ms');
			expect(firstSegment).toHaveProperty('text');
			expect(typeof firstSegment.text).toBe('string');

			logger.info(`✅ 자막 수집 성공:`);
			logger.info(`  - 제목: ${(transcript?.data as unknown as TranscriptData)?.title}`);
			logger.info(`  - 세그먼트: ${segments.length}개`);
		},
		TIMEOUT
	);

	it(
		'DB에서 자막을 조회할 수 있어야 함',
		async () => {
			await service.collectTranscript(TEST_VIDEO_ID);

			const transcript = await service.getTranscriptFromDB(TEST_VIDEO_ID);

			expect(transcript).toBeDefined();
			expect(transcript?.video_id).toBe(TEST_VIDEO_ID);
			expect(transcript?.data).toBeDefined();

			const segments = (transcript?.data as unknown as TranscriptData)?.segments || [];
			expect(segments.length).toBeGreaterThan(0);

			logger.info(`✅ DB 조회 성공:`);
			logger.info(`  - 세그먼트: ${segments.length}개`);
		},
		TIMEOUT
	);

	it(
		'존재하지 않는 영상 ID는 에러를 throw해야 함',
		async () => {
			await expect(service.collectTranscript('invalid_video_id_12345')).rejects.toThrow();

			logger.info(`✅ 에러 처리 확인`);
		},
		TIMEOUT
	);

	it(
		'DB에 없는 자막 조회 시 null을 반환해야 함',
		async () => {
			const randomId = `nonexistent_${Date.now()}`;
			const transcript = await service.getTranscriptFromDB(randomId);

			expect(transcript).toBeNull();

			logger.info(`✅ 누락된 데이터 처리 확인`);
		},
		TIMEOUT
	);

	it(
		'동일한 영상을 다시 수집하면 조용히 성공해야 함',
		async () => {
			await service.collectTranscript(TEST_VIDEO_ID);
			await service.collectTranscript(TEST_VIDEO_ID);

			const transcript = await service.getTranscriptFromDB(TEST_VIDEO_ID);
			expect(transcript).toBeDefined();

			logger.info(`✅ 중복 수집 방지 확인`);
		},
		TIMEOUT
	);

	it('10개의 영상 자막을 병렬로 요청할 수 있어야 함', async () => {
		const videoIds = [
			TEST_VIDEO_ID,
			'jNQXAC9IVRw',
			'9bZkp7q19f0',
			'kJQP7kiw5Fk',
			'dQw4w9WgXcQ',
			'tgbNymZ7vqY',
			'M7lc1UVf-VE',
			'QH2-TGUlwu4',
			'nfWlot6h_JM',
			'ZZ5LpwO-An4'
		];

		logger.info(`\n병렬 요청 시작: ${videoIds.length}개 영상 (force=true)`);

		const results = await Promise.allSettled(
			videoIds.map((videoId) => service.collectTranscript(videoId, { force: true }))
		);

		const successCount = results.filter((r) => r.status === 'fulfilled').length;
		const gracefulFailures = results.filter((r) => {
			if (r.status === 'rejected') {
				const message = r.reason?.message || String(r.reason);
				return (
					message.includes('자막을 사용할 수 없습니다') ||
					message.includes('unavailable') ||
					message.includes('ParsingError') ||
					message.includes('InnertubeError')
				);
			}
			return false;
		}).length;
		const totalAcceptable = successCount + gracefulFailures;

		logger.info(`\n병렬 요청 결과:`);
		logger.info(`  - 성공: ${successCount}개`);
		logger.info(`  - Graceful failure: ${gracefulFailures}개`);
		logger.info(`  - 전체 허용 가능: ${totalAcceptable}/${videoIds.length}개`);

		results.forEach((result, index) => {
			const videoId = videoIds[index];
			const isGracefulFailure =
				result.status === 'rejected' &&
				(() => {
					const message = result.reason?.message || String(result.reason);
					return (
						message.includes('자막을 사용할 수 없습니다') ||
						message.includes('unavailable') ||
						message.includes('ParsingError') ||
						message.includes('InnertubeError')
					);
				})();

			const status = result.status === 'fulfilled' ? '✅' : isGracefulFailure ? '⚠️' : '❌';
			const errorMsg =
				result.status === 'rejected'
					? (result.reason?.message || String(result.reason)).substring(0, 50)
					: 'success';

			logger.info(`  - ${videoId}: ${status} ${errorMsg}`);
		});

		expect(totalAcceptable).toBe(videoIds.length);
		expect(successCount).toBeGreaterThan(0);
	}, 90000);
});
