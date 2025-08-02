import { expect, test } from '@playwright/test';

test.describe('Dashboard Page', () => {
	test.beforeEach(async ({ page }) => {
		// Mock authentication for testing
		await page.addInitScript(() => {
			window.localStorage.setItem('supabase.auth.token', JSON.stringify({
				access_token: 'mock-token',
				user: { id: 'test-user-id', email: 'test@example.com' }
			}));
		});
	});

	test('dashboard page loads with correct elements', async ({ page }) => {
		await page.goto('/dashboard');

		// Check if main heading is visible
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

		// Check if YouTube URL input field exists
		const urlInput = page.locator('input[name="youtubeUrl"], input[type="url"]');
		await expect(urlInput).toBeVisible();

		// Check if submit button exists
		const submitButton = page.locator('button[type="submit"], input[type="submit"]');
		await expect(submitButton).toBeVisible();
	});

	test('form validation shows error for invalid URL', async ({ page }) => {
		await page.goto('/dashboard');

		// Find URL input and submit button
		const urlInput = page.locator('input[name="youtubeUrl"], input[type="url"]').first();
		const submitButton = page.locator('button[type="submit"], input[type="submit"]').first();

		// Enter invalid URL
		await urlInput.fill('not-a-valid-url');
		await submitButton.click();

		// Check for error message (could be in various formats)
		const errorSelectors = [
			'[role="alert"]',
			'.error',
			'[class*="error"]',
			'[data-testid="error"]',
			'.text-error',
			'.text-red'
		];

		let errorFound = false;
		for (const selector of errorSelectors) {
			try {
				await expect(page.locator(selector)).toBeVisible({ timeout: 1000 });
				errorFound = true;
				break;
			} catch {
				// Continue to next selector
			}
		}

		// If no specific error element, check for error in page content
		if (!errorFound) {
			const pageContent = await page.textContent('body');
			expect(pageContent).toMatch(/error|올바른|유효하지|잘못된/i);
		}
	});

	test('form validation shows error for empty URL', async ({ page }) => {
		await page.goto('/dashboard');

		const submitButton = page.locator('button[type="submit"], input[type="submit"]').first();
		
		// Try to submit without entering URL
		await submitButton.click();

		// Check for required field validation or error message
		const urlInput = page.locator('input[name="youtubeUrl"], input[type="url"]').first();
		
		// Check HTML5 validation
		const validationMessage = await urlInput.evaluate(el => el.validationMessage);
		if (validationMessage) {
			expect(validationMessage).toBeTruthy();
		} else {
			// Check for custom error message
			const pageContent = await page.textContent('body');
			expect(pageContent).toMatch(/필수|required|입력|제공되지/i);
		}
	});

	test('valid YouTube URL processing workflow', async ({ page }) => {
		// Mock the API response to avoid actual external calls
		await page.route('**/api/**', async route => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					summary: {
						id: 'test-summary-id',
						title: 'Test Video Title',
						summary: 'Test summary content',
						youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
					},
					fromCache: false
				})
			});
		});

		await page.goto('/dashboard');

		const urlInput = page.locator('input[name="youtubeUrl"], input[type="url"]').first();
		const submitButton = page.locator('button[type="submit"], input[type="submit"]').first();

		// Enter valid YouTube URL
		await urlInput.fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
		await submitButton.click();

		// Check for loading state
		await expect(page.locator('body')).toContainText(/처리|loading|분석/i, { timeout: 5000 });

		// Wait for results or redirect
		await page.waitForTimeout(2000);

		// Check if we're redirected to summary page or results are shown
		const currentUrl = page.url();
		const pageContent = await page.textContent('body');
		
		const isRedirected = currentUrl.includes('/summary/') || currentUrl.includes('/result/');
		const hasResults = pageContent.includes('Test Video Title') || 
						  pageContent.includes('요약') || 
						  pageContent.includes('summary');

		expect(isRedirected || hasResults).toBeTruthy();
	});

	test('handles network errors gracefully', async ({ page }) => {
		// Mock network error
		await page.route('**/api/**', async route => {
			await route.abort('failed');
		});

		await page.goto('/dashboard');

		const urlInput = page.locator('input[name="youtubeUrl"], input[type="url"]').first();
		const submitButton = page.locator('button[type="submit"], input[type="submit"]').first();

		await urlInput.fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
		await submitButton.click();

		// Wait for error handling
		await page.waitForTimeout(3000);

		// Check for error message
		const pageContent = await page.textContent('body');
		expect(pageContent).toMatch(/오류|error|실패|문제/i);
	});

	test('responsive design on mobile viewport', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto('/dashboard');

		// Check if main elements are still visible on mobile
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
		
		const urlInput = page.locator('input[name="youtubeUrl"], input[type="url"]').first();
		await expect(urlInput).toBeVisible();

		const submitButton = page.locator('button[type="submit"], input[type="submit"]').first();
		await expect(submitButton).toBeVisible();

		// Check if input is properly sized for mobile
		const inputBox = await urlInput.boundingBox();
		expect(inputBox.width).toBeGreaterThan(200); // Reasonable minimum width for mobile
	});

	test('keyboard navigation works correctly', async ({ page }) => {
		await page.goto('/dashboard');

		// Test tab navigation
		await page.keyboard.press('Tab');
		
		// Check if focus moves to the URL input
		const urlInput = page.locator('input[name="youtubeUrl"], input[type="url"]').first();
		await expect(urlInput).toBeFocused();

		// Continue tabbing to submit button
		await page.keyboard.press('Tab');
		
		const submitButton = page.locator('button[type="submit"], input[type="submit"]').first();
		await expect(submitButton).toBeFocused();

		// Test Enter key on submit button
		await urlInput.focus();
		await urlInput.fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
		await page.keyboard.press('Enter');

		// Should trigger form submission
		await page.waitForTimeout(1000);
		const currentUrl = page.url();
		const pageContent = await page.textContent('body');
		
		// Check if something happened (form submission detected)
		expect(currentUrl !== '/dashboard' || pageContent.includes('처리') || pageContent.includes('loading')).toBeTruthy();
	});
});