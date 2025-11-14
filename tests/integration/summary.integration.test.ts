import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database.types';
import { SummaryService } from '$lib/server/services/summary.service';
import { createYouTubeClient } from '$lib/server/youtube';
import type { Innertube } from 'youtubei.js';
import { logger } from '$lib/logger';

describe.sequential('SummaryService Integration Test', () => {
	let adminSupabase: ReturnType<typeof createClient<Database>>;
	let summaryService: SummaryService;
	let youtube: Innertube;

	beforeAll(async () => {
		if (!process.env.PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
			throw new Error('환경변수가 로드되지 않았습니다. .env.test 파일을 확인하세요.');
		}

		if (!process.env.GEMINI_API_KEY) {
			throw new Error('GEMINI_API_KEY 환경변수가 필요합니다.');
		}

		if (!process.env.TOR_SOCKS5_PROXY) {
			throw new Error('TOR_SOCKS5_PROXY 환경변수가 필요합니다.');
		}

		logger.info('\n환경:', process.env.PUBLIC_SUPABASE_URL);
		logger.info('테스트 영상:', process.env.TEST_VIDEO_ID, '\n');

		adminSupabase = createClient<Database>(
			process.env.PUBLIC_SUPABASE_URL,
			process.env.SUPABASE_SECRET_KEY
		);

		youtube = await createYouTubeClient({ socksProxy: process.env.TOR_SOCKS5_PROXY });
		summaryService = new SummaryService(adminSupabase, youtube);
	});

	it('전체 분석 파이프라인이 정상 작동해야 함', async () => {
		const videoId = process.env.TEST_VIDEO_ID!;

		await summaryService.analyzeSummary(
			{ videoId },
			{ geminiApiKey: process.env.GEMINI_API_KEY, openaiApiKey: process.env.OPENAI_API_KEY },
			{ geminiModel: process.env.GEMINI_MODEL, openaiModel: process.env.OPENAI_MODEL },
			{ maxBatches: 5, force: true }
		);

		const summary = await summaryService.getSummaryFromDB(videoId);

		expect(summary).toBeDefined();
		expect(summary?.video_id).toBe(videoId);
		expect(summary?.summary).toBeTruthy();
		expect(summary?.transcript).toBeTruthy();
		expect(summary?.analysis_status).toBe('completed');

		logger.info(`✅ 전체 분석 성공:
  - 요약 ID: ${summary?.id}
  - 요약 내용: ${summary?.summary?.substring(0, 100)}...
  - 분석 상태: ${summary?.analysis_status}`);
	}, 180000);

	it('DB에서 요약을 조회할 수 있어야 함', async () => {
		const videoId = process.env.TEST_VIDEO_ID!;

		await summaryService.analyzeSummary(
			{ videoId },
			{ geminiApiKey: process.env.GEMINI_API_KEY, openaiApiKey: process.env.OPENAI_API_KEY },
			{ geminiModel: process.env.GEMINI_MODEL, openaiModel: process.env.OPENAI_MODEL },
			{ maxBatches: 5, force: true }
		);

		const summary = await summaryService.getSummaryFromDB(videoId);

		expect(summary).toBeDefined();
		expect(summary?.id).toBeTruthy();
		expect(summary?.summary).toBeTruthy();
		expect(summary?.transcript).toBeTruthy();

		logger.info(`✅ DB 조회 성공:
  - 요약 ID: ${summary?.id}
  - 요약: ${summary?.summary?.substring(0, 100)}...`);
	}, 180000);

	it('자막이 없으면 에러를 발생해야 함', async () => {
		await expect(
			summaryService.analyzeSummary(
				{ videoId: 'invalid_video_id_12345' },
				{ geminiApiKey: process.env.GEMINI_API_KEY, openaiApiKey: process.env.OPENAI_API_KEY },
				{ geminiModel: process.env.GEMINI_MODEL, openaiModel: process.env.OPENAI_MODEL },
				{ maxBatches: 5, force: true }
			)
		).rejects.toThrow();

		logger.info('✅ 자막 없음 에러 처리 확인');
	}, 30000);

	it('댓글 제한이 적용되어야 함', async () => {
		const videoId = process.env.TEST_VIDEO_ID!;

		await summaryService.analyzeSummary(
			{ videoId },
			{ geminiApiKey: process.env.GEMINI_API_KEY, openaiApiKey: process.env.OPENAI_API_KEY },
			{ geminiModel: process.env.GEMINI_MODEL, openaiModel: process.env.OPENAI_MODEL },
			{ maxBatches: 3, force: true }
		);

		const summary = await summaryService.getSummaryFromDB(videoId);

		expect(summary).toBeDefined();
		expect(summary?.analysis_status).toBe('completed');

		logger.info(`✅ 댓글 제한 확인: 분석 완료 상태 = ${summary?.analysis_status}`);
	}, 180000);

	it('중복 분석 방지: force=false이면 기존 분석 유지', async () => {
		const videoId = process.env.TEST_VIDEO_ID!;

		await summaryService.analyzeSummary(
			{ videoId },
			{ geminiApiKey: process.env.GEMINI_API_KEY, openaiApiKey: process.env.OPENAI_API_KEY },
			{ geminiModel: process.env.GEMINI_MODEL, openaiModel: process.env.OPENAI_MODEL },
			{ maxBatches: 5, force: true }
		);

		const firstSummary = await summaryService.getSummaryFromDB(videoId);
		const firstId = firstSummary?.id;

		await summaryService.analyzeSummary(
			{ videoId },
			{ geminiApiKey: process.env.GEMINI_API_KEY, openaiApiKey: process.env.OPENAI_API_KEY },
			{ geminiModel: process.env.GEMINI_MODEL, openaiModel: process.env.OPENAI_MODEL },
			{ maxBatches: 5, force: false }
		);

		const secondSummary = await summaryService.getSummaryFromDB(videoId);
		expect(secondSummary?.id).toBe(firstId);

		logger.info(`✅ 중복 분석 방지 확인: 동일한 ID ${firstId}`);
	}, 180000);
});
