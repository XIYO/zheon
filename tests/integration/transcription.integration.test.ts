import { describe, it, expect, beforeAll } from 'vitest';
import { TranscriptionService } from '$lib/server/services/youtube/transcription.service';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database.types';

/**
 * TranscriptionService 통합 테스트
 * 실제 YouTube API + Supabase 호출
 *
 * 실행: pnpm test:integration
 */

describe('TranscriptionService Integration Test', () => {
	let service: TranscriptionService;
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

		service = new TranscriptionService(supabase);

		console.log(`\n프록시 URL: ${proxyUrl}`);
		console.log(`테스트 영상 ID: ${TEST_VIDEO_ID}\n`);
	});

	it(
		'실제 YouTube 영상의 자막을 수집하고 DB에 저장해야 함',
		async () => {
			const result = await service.collectTranscript(TEST_VIDEO_ID);

			expect(result.success).toBe(true);
			expect(result.videoId).toBe(TEST_VIDEO_ID);
			expect(result.status).toMatch(/exists|created/);

			if (result.data) {
				expect(result.data.segments).toBeDefined();
				expect(Array.isArray(result.data.segments)).toBe(true);
				expect(result.data.segments.length).toBeGreaterThan(0);

				const firstSegment = result.data.segments[0];
				expect(firstSegment).toHaveProperty('start_ms');
				expect(firstSegment).toHaveProperty('end_ms');
				expect(firstSegment).toHaveProperty('text');
				expect(typeof firstSegment.text).toBe('string');

				console.log(`✅ 자막 수집 성공:`);
				console.log(`  - 상태: ${result.status}`);
				console.log(`  - 제목: ${result.data.title}`);
				console.log(`  - 세그먼트: ${result.data.segments.length}개`);
			}
		},
		TIMEOUT
	);

	it(
		'DB에서 자막을 조회할 수 있어야 함',
		async () => {
			await service.collectTranscript(TEST_VIDEO_ID);

			const result = await service.getTranscriptFromDB(TEST_VIDEO_ID);

			expect(result.success).toBe(true);
			expect(result.videoId).toBe(TEST_VIDEO_ID);
			expect(result.transcript).toBeDefined();
			expect(result.segmentCount).toBeGreaterThan(0);

			if (result.transcript) {
				expect(result.transcript.video_id).toBe(TEST_VIDEO_ID);
				expect(result.transcript.data).toBeDefined();

				console.log(`✅ DB 조회 성공:`);
				console.log(`  - 세그먼트: ${result.segmentCount}개`);
			}
		},
		TIMEOUT
	);

	it(
		'존재하지 않는 영상 ID는 no_transcript 상태를 반환해야 함',
		async () => {
			const result = await service.collectTranscript('invalid_video_id_12345');

			expect(result.success).toBe(false);
			expect(result.status).toBe('no_transcript');
			expect(result.message).toContain('자막');

			console.log(`✅ 에러 처리 확인: ${result.message}`);
		},
		TIMEOUT
	);

	it(
		'DB에 없는 자막 조회 시 실패를 반환해야 함',
		async () => {
			const randomId = `nonexistent_${Date.now()}`;
			const result = await service.getTranscriptFromDB(randomId);

			expect(result.success).toBe(false);
			expect(result.message).toContain('없습니다');

			console.log(`✅ 누락된 데이터 처리 확인`);
		},
		TIMEOUT
	);

	it(
		'동일한 영상을 다시 수집하면 exists 상태를 반환해야 함',
		async () => {
			await service.collectTranscript(TEST_VIDEO_ID);

			const result = await service.collectTranscript(TEST_VIDEO_ID);

			expect(result.success).toBe(true);
			expect(result.status).toBe('exists');
			expect(result.message).toContain('이미');

			console.log(`✅ 중복 수집 방지 확인`);
		},
		TIMEOUT
	);

	it(
		'10개의 영상 자막을 병렬로 요청할 수 있어야 함',
		async () => {
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

			console.log(`\n병렬 요청 시작: ${videoIds.length}개 영상 (force=true)`);

			const results = await Promise.all(
				videoIds.map(async (videoId) => {
					try {
						const result = await service.collectTranscript(videoId, { force: true });
						return { videoId, result };
					} catch (error) {
						return {
							videoId,
							result: {
								success: false,
								videoId,
								status: 'error',
								message: error instanceof Error ? error.message : '알 수 없는 오류'
							}
						};
					}
				})
			);

			const successCount = results.filter((r) => r.result.success).length;
			const gracefulFailures = results.filter(
				(r) => !r.result.success && r.result.status === 'no_transcript'
			).length;
			const totalAcceptable = successCount + gracefulFailures;

			console.log(`\n병렬 요청 결과:`);
			console.log(`  - 성공: ${successCount}개`);
			console.log(`  - Graceful failure: ${gracefulFailures}개`);
			console.log(`  - 전체 허용 가능: ${totalAcceptable}/${videoIds.length}개`);

			results.forEach(({ videoId, result }) => {
				console.log(`  - ${videoId}: ${result.status} ${result.success ? '✅' : result.status === 'no_transcript' ? '⚠️' : '❌'}`);
			});

			expect(totalAcceptable).toBe(videoIds.length);

			const hasSuccessfulTranscript = results.some(
				(r) => r.result.success && r.result.data?.segments && r.result.data.segments.length > 0
			);
			expect(hasSuccessfulTranscript).toBe(true);
		},
		90000
	);
});
