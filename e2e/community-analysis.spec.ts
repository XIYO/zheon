import { test, expect } from '@playwright/test';

test.describe('커뮤니티 분석 데이터 부족 케이스', () => {
	test.use({ baseURL: 'http://localhost:7777' });

	test('댓글 50개 미만일 때 데이터 부족 메시지 표시', async ({ page }) => {
		await page.goto('/d1JlNifdnsw');

		const communitySection = page.locator('section').filter({ hasText: '커뮤니티 분석' });
		await communitySection.scrollIntoViewIfNeeded();
		await expect(communitySection).toBeVisible();

		const warningCard = communitySection.locator('.card.preset-tonal-warning');
		await expect(warningCard).toBeVisible();

		await expect(warningCard.getByText('커뮤니티 분석할 충분한 데이터가 없습니다')).toBeVisible();

		await expect(warningCard.getByText(/댓글 수: \d+개 \(최소 50개 필요\)/)).toBeVisible();
	});

	test('차트가 표시되지 않아야 함', async ({ page }) => {
		await page.goto('/d1JlNifdnsw');

		const communitySection = page.locator('section').filter({ hasText: '커뮤니티 분석' });
		await communitySection.scrollIntoViewIfNeeded();

		await expect(communitySection.getByText('감정 분포', { exact: true })).not.toBeVisible();
		await expect(communitySection.getByText('연령 분포', { exact: true })).not.toBeVisible();
	});

	test('다른 섹션은 정상 표시되어야 함', async ({ page }) => {
		await page.goto('/d1JlNifdnsw');

		await expect(page.locator('section').filter({ hasText: 'AI 요약' })).toBeVisible();

		const categorySection = page.locator('h3').filter({ hasText: '카테고리' });
		await expect(categorySection).toBeVisible();

		const tagSection = page.locator('h3').filter({ hasText: '태그' });
		await expect(tagSection).toBeVisible();

		const metricsSection = page.locator('h3').filter({ hasText: '콘텐츠 특성 분석' });
		await expect(metricsSection).toBeVisible();
	});
});
