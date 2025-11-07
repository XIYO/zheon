import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database.types';
import { SummaryService } from '$lib/server/services/summary.service';
import { createYouTube } from '$lib/server/youtube-proxy';
import type { Innertube } from 'youtubei.js';

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

		console.log('\n환경:', process.env.PUBLIC_SUPABASE_URL);
		console.log('테스트 영상:', process.env.TEST_VIDEO_ID, '\n');

		adminSupabase = createClient<Database>(
			process.env.PUBLIC_SUPABASE_URL,
			process.env.SUPABASE_SECRET_KEY
		);

		youtube = await createYouTube(process.env.TOR_SOCKS5_PROXY);
		summaryService = new SummaryService(adminSupabase, youtube);
	});

	it('전체 분석 파이프라인이 정상 작동해야 함', async () => {
		const videoId = process.env.TEST_VIDEO_ID!;

		await summaryService.analyzeSummary(videoId, {
			maxBatches: 5,
			force: true,
			geminiApiKey: process.env.GEMINI_API_KEY!
		});

		const summary = await summaryService.getSummaryFromDB(videoId);

		expect(summary).toBeDefined();
		expect(summary?.url).toBe(`https://www.youtube.com/watch?v=${videoId}`);
		expect(summary?.summary).toBeTruthy();
		expect(summary?.transcript).toBeTruthy();
		expect(summary?.content_quality_score).toBeGreaterThan(0);
		expect(summary?.sentiment_overall_score).toBeGreaterThanOrEqual(-100);
		expect(summary?.community_quality_score).toBeGreaterThanOrEqual(-100);

		console.log(`✅ 전체 분석 성공:
  - 요약 ID: ${summary?.id}
  - 요약 내용: ${summary?.summary?.substring(0, 100)}...
  - 콘텐츠 점수: ${summary?.content_quality_score}
  - 감정 점수: ${summary?.sentiment_overall_score}
  - 커뮤니티 점수: ${summary?.community_quality_score}`);
	}, 180000);

	it('DB에서 요약을 조회할 수 있어야 함', async () => {
		const videoId = process.env.TEST_VIDEO_ID!;

		await summaryService.analyzeSummary(videoId, {
			maxBatches: 5,
			force: true,
			geminiApiKey: process.env.GEMINI_API_KEY!
		});

		const summary = await summaryService.getSummaryFromDB(videoId);

		expect(summary).toBeDefined();
		expect(summary?.id).toBeTruthy();
		expect(summary?.summary).toBeTruthy();
		expect(summary?.transcript).toBeTruthy();

		console.log(`✅ DB 조회 성공:
  - 요약 ID: ${summary?.id}
  - 요약: ${summary?.summary?.substring(0, 100)}...`);
	}, 180000);

	it('자막이 없으면 에러를 발생해야 함', async () => {
		await expect(
			summaryService.analyzeSummary('invalid_video_id_12345', {
				maxBatches: 5,
				force: true,
				geminiApiKey: process.env.GEMINI_API_KEY!
			})
		).rejects.toThrow();

		console.log('✅ 자막 없음 에러 처리 확인');
	}, 30000);

	it('댓글 제한이 적용되어야 함', async () => {
		const videoId = process.env.TEST_VIDEO_ID!;

		await summaryService.analyzeSummary(videoId, {
			maxBatches: 3,
			force: true,
			geminiApiKey: process.env.GEMINI_API_KEY!
		});

		const summary = await summaryService.getSummaryFromDB(videoId);

		expect(summary).toBeDefined();
		expect(summary?.total_comments_analyzed).toBeLessThanOrEqual(100);

		console.log(`✅ 댓글 제한 확인: ${summary?.total_comments_analyzed}개 분석됨 (최대 100개)`);
	}, 180000);

	it('중복 분석 방지: force=false이면 기존 분석 유지', async () => {
		const videoId = process.env.TEST_VIDEO_ID!;

		await summaryService.analyzeSummary(videoId, {
			maxBatches: 5,
			force: true,
			geminiApiKey: process.env.GEMINI_API_KEY!
		});

		const firstSummary = await summaryService.getSummaryFromDB(videoId);
		const firstId = firstSummary?.id;

		await summaryService.analyzeSummary(videoId, {
			maxBatches: 5,
			force: false,
			geminiApiKey: process.env.GEMINI_API_KEY!
		});

		const secondSummary = await summaryService.getSummaryFromDB(videoId);
		expect(secondSummary?.id).toBe(firstId);

		console.log(`✅ 중복 분석 방지 확인: 동일한 ID ${firstId}`);
	}, 180000);
});
