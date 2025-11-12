import { test } from '@playwright/test';
import { logger } from '../src/lib/logger';

test.describe('커뮤니티 데이터 상태 확인', () => {
	test.use({ baseURL: 'http://localhost:7777' });

	test('실제 데이터 상태 출력', async ({ page }) => {
		await page.goto('/d1JlNifdnsw');

		await page.waitForTimeout(3000);

		const htmlContent = await page.content();
		logger.info('\n=== 페이지 HTML 일부 ===');
		const communityMatch = htmlContent.match(/커뮤니티 분석[\s\S]{0,500}/);
		logger.info(communityMatch?.[0] || '커뮤니티 섹션 없음');

		const hasWarningCard = await page.locator('.card.preset-tonal-warning').count();
		logger.info('\n=== 경고 카드 개수 ===', hasWarningCard);

		const hasCommunityAnalyzing = await page.getByText('커뮤니티 분석 중...').count();
		logger.info('커뮤니티 분석 중 메시지:', hasCommunityAnalyzing);

		const hasEmotionChart = await page.getByText('감정 분포').count();
		logger.info('감정 분포 텍스트:', hasEmotionChart);

		const hasInsufficientData = await page
			.getByText('커뮤니티 분석할 충분한 데이터가 없습니다')
			.count();
		logger.info('데이터 부족 메시지:', hasInsufficientData);
	});
});
