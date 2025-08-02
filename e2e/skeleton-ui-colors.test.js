import { expect, test } from '@playwright/test';

test.describe('Skeleton UI Color System', () => {
	test('landing page renders with correct Skeleton UI color classes', async ({ page }) => {
		await page.goto('/');

		// Check if main heading is visible
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

		// Check gradient text elements (should have proper styling)
		const gradientElements = page.locator('.gradient-text');
		await expect(gradientElements.first()).toBeVisible();

		// Check if surface background colors are applied
		const surfaceElements = page.locator('[class*="bg-surface-"]');
		await expect(surfaceElements.first()).toBeVisible();

		// Check if text surface colors are applied
		const textSurfaceElements = page.locator('[class*="text-surface-"]');
		await expect(textSurfaceElements.first()).toBeVisible();

		// Check primary button styling (specifically the call-to-action button)
		const primaryButton = page.getByRole('link', { name: '시작하기' });
		await expect(primaryButton).toBeVisible();
	});

	test('landing page surface color classes are properly formatted', async ({ page }) => {
		await page.goto('/');

		// Check if proper Skeleton UI color format is used (should include light-dark pairs)
		const elementWithSurfaceColor = page.locator('[class*="text-surface-300-600"]').first();
		await expect(elementWithSurfaceColor).toBeVisible();

		// Check background gradient classes
		const gradientBg = page.locator('[class*="bg-gradient-to-br"][class*="from-surface-900-50"]');
		await expect(gradientBg).toBeVisible();
	});

	test('header component renders with correct Skeleton UI styling', async ({ page }) => {
		await page.goto('/');

		// Check main header (not dialog headers)
		const mainHeader = page.locator('header').first();
		await expect(mainHeader).toBeVisible();

		// Check if header has backdrop blur and surface background
		const headerWithBackdrop = page.locator(
			'header[class*="backdrop-blur"][class*="bg-surface-50-900"]'
		);
		await expect(headerWithBackdrop).toBeVisible();

		// Check logo/brand text
		const brandText = page.locator('header .gradient-text').first();
		await expect(brandText).toBeVisible();
	});

	test('color system consistency across components', async ({ page }) => {
		await page.goto('/');

		// Check if consistent color naming is used throughout
		const surfaceTextElements = page.locator('[class*="text-surface-"]:visible');
		const count = await surfaceTextElements.count();
		expect(count).toBeGreaterThan(0);

		// Check if background surface colors are consistent
		const surfaceBgElements = page.locator('[class*="bg-surface-"]:visible');
		const bgCount = await surfaceBgElements.count();
		expect(bgCount).toBeGreaterThan(0);
	});

	test('responsive design with color system', async ({ page }) => {
		// Test mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto('/');

		// Check if color classes work on mobile
		const colorElements = page.locator('[class*="text-surface-"], [class*="bg-surface-"]');
		await expect(colorElements.first()).toBeVisible();

		// Check main heading still visible on mobile
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

		// Test desktop viewport
		await page.setViewportSize({ width: 1280, height: 720 });
		await page.reload();

		// Check if desktop layout still has proper colors
		await expect(colorElements.first()).toBeVisible();
	});

	test('skeleton UI theme integration', async ({ page }) => {
		await page.goto('/');

		// Check if cerberus theme is applied
		const htmlElement = page.locator('html');
		await expect(htmlElement).toHaveAttribute('data-theme', 'cerberus');

		// Check if gradient text utility is working
		const gradientElements = page.locator('.gradient-text');
		await expect(gradientElements.first()).toBeVisible();

		// Verify CSS custom properties are loaded
		const styles = await page.evaluate(() => {
			const element = document.querySelector('.gradient-text');
			return window.getComputedStyle(element);
		});

		// Should have gradient background
		expect(styles.background).toContain('gradient');
	});
});
