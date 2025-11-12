import { test, expect } from '@playwright/test';

test.describe('분리된 데이터 로딩 테스트', () => {
	test.use({ baseURL: 'http://localhost:7777' });

	test('카테고리, 태그, 메트릭, 커뮤니티가 독립적으로 로드되어야 함', async ({ page }) => {
		await page.goto('/d1JlNifdnsw');

		await page.waitForTimeout(2000);

		const hasSummarySection = await page.locator('section').filter({ hasText: 'AI 요약' }).count();
		expect(hasSummarySection).toBeGreaterThan(0);

		const hasCategorySection = await page.getByText('카테고리', { exact: true }).count();
		expect(hasCategorySection).toBeGreaterThan(0);

		const hasTagSection = await page.getByText('태그', { exact: true }).count();
		expect(hasTagSection).toBeGreaterThan(0);

		const hasMetricsSection = await page.getByText('콘텐츠 특성 분석').count();
		expect(hasMetricsSection).toBeGreaterThan(0);

		const hasCommunitySection = await page.getByText('커뮤니티 분석').count();
		expect(hasCommunitySection).toBeGreaterThan(0);
	});

	test('카테고리 영역이 표시되어야 함', async ({ page }) => {
		await page.goto('/d1JlNifdnsw');

		const categorySection = page.locator('h3').filter({ hasText: '카테고리' }).locator('..');

		await expect(categorySection).toBeVisible();

		await page.waitForTimeout(2000);

		const categoryChips = await categorySection.locator('.chip.preset-filled-primary-500').count();
		const categoryPlaceholders = await categorySection.locator('.placeholder').count();

		expect(categoryChips + categoryPlaceholders).toBeGreaterThan(0);
	});

	test('태그 영역이 표시되어야 함', async ({ page }) => {
		await page.goto('/d1JlNifdnsw');

		const tagSection = page.locator('h3').filter({ hasText: '태그' }).locator('..');

		await expect(tagSection).toBeVisible();

		await page.waitForTimeout(2000);

		const tagChips = await tagSection.locator('.chip.preset-tonal-secondary').count();
		const tagPlaceholders = await tagSection.locator('.placeholder').count();

		expect(tagChips + tagPlaceholders).toBeGreaterThan(0);
	});

	test('메트릭 데이터가 표시되어야 함', async ({ page }) => {
		await page.goto('/d1JlNifdnsw');

		const metricsSection = page.locator('h3').filter({ hasText: '콘텐츠 특성 분석' });

		await expect(metricsSection).toBeVisible();

		const metricsCards = page.locator('.card.preset-tonal-surface');
		await expect(metricsCards.first()).toBeVisible({ timeout: 5000 });
	});

	test('커뮤니티 분석 완료되어야 함', async ({ page }) => {
		await page.goto('/d1JlNifdnsw');

		const communitySection = page.locator('section').filter({ hasText: '커뮤니티 분석' });
		await communitySection.scrollIntoViewIfNeeded();
		await expect(communitySection).toBeVisible();

		await page.waitForTimeout(10000);

		const loadingText = await communitySection.getByText('커뮤니티 분석 중...').count();
		expect(loadingText).toBe(0);

		const hasWarning = (await communitySection.locator('.card.preset-tonal-warning').count()) > 0;
		const hasChart = (await communitySection.getByText('감정 분포', { exact: true }).count()) > 0;

		expect(hasWarning || hasChart).toBe(true);
	});
});
