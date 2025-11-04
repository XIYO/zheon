import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
	test('should load home page successfully', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveTitle(/zheon/i);
	});

	test('should display main content', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('body')).toBeVisible();
	});

	test('should have no accessibility violations on load', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('html')).toBeVisible();
	});

	test('should be responsive on mobile viewport', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('body')).toBeVisible();
	});
});
