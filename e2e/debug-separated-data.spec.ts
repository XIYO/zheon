import { test } from '@playwright/test';
import { logger } from '../src/lib/logger';

test.describe('분리된 데이터 디버깅', () => {
	test.use({ baseURL: 'http://localhost:7777' });

	test('카테고리와 태그 데이터 상태 확인', async ({ page }) => {
		await page.goto('/d1JlNifdnsw');

		await page.waitForTimeout(3000);

		const categoryPlaceholders = await page
			.locator('h3')
			.filter({ hasText: '카테고리' })
			.locator('..')
			.locator('.placeholder')
			.count();
		logger.info('카테고리 placeholder 개수:', categoryPlaceholders);

		const categoryChips = await page
			.locator('h3')
			.filter({ hasText: '카테고리' })
			.locator('..')
			.locator('.chip')
			.count();
		logger.info('카테고리 chip 개수:', categoryChips);

		const tagPlaceholders = await page
			.locator('h3')
			.filter({ hasText: '태그' })
			.locator('..')
			.locator('.placeholder')
			.count();
		logger.info('태그 placeholder 개수:', tagPlaceholders);

		const tagChips = await page
			.locator('h3')
			.filter({ hasText: '태그' })
			.locator('..')
			.locator('.chip')
			.count();
		logger.info('태그 chip 개수:', tagChips);

		await page.screenshot({ path: 'test-results/debug-separated-data.png', fullPage: true });
	});
});
