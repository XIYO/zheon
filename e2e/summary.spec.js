import { test, expect } from '@playwright/test';

test.describe('YouTube 요약 기능', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
	});

	test('루트 페이지에 요약 폼이 표시되어야 함', async ({ page }) => {
		const input = page.locator('input[placeholder*="YouTube URL"]');
		await expect(input).toBeVisible();

		const submitButton = page.locator('button[type="submit"]:has-text("생성")');
		await expect(submitButton).toBeVisible();
	});

	test('유튜브 URL 입력 후 제출 시 낙관적 업데이트가 표시되어야 함', async ({ page }) => {
		const testUrl = 'https://www.youtube.com/watch?v=w7lLqpcBwb0';

		const input = page.locator('input[placeholder*="YouTube URL"]');
		await input.fill(testUrl);

		const submitButton = page.locator('button[type="submit"]:has-text("생성")');
		await submitButton.click();

		const pendingIndicator = page.locator('.bg-warning-500.animate-pulse');
		await expect(pendingIndicator).toBeVisible({ timeout: 10000 });
	});

	test('빈 URL 제출 시 유효성 검증 메시지가 표시되어야 함', async ({ page }) => {
		const submitButton = page.locator('button[type="submit"]:has-text("생성")');
		await submitButton.click();

		const errorMessage = page.locator('.text-error-500').first();
		await expect(errorMessage).toBeVisible({ timeout: 5000 });
	});

	test('잘못된 형식의 URL 입력 시 유효성 검증 메시지가 표시되어야 함', async ({ page }) => {
		const input = page.locator('input[placeholder*="YouTube URL"]');
		await input.fill('invalid-url');

		const submitButton = page.locator('button[type="submit"]:has-text("생성")');
		await submitButton.click();

		const errorMessage = page.locator('.text-error-500').first();
		await expect(errorMessage).toBeVisible({ timeout: 5000 });
	});
});
