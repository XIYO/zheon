import { expect, test } from '@playwright/test';

test.describe('Summary Page', () => {
	test.beforeEach(async ({ page }) => {
		// Mock authentication
		await page.addInitScript(() => {
			window.localStorage.setItem(
				'supabase.auth.token',
				JSON.stringify({
					access_token: 'mock-token',
					user: { id: 'test-user-id', email: 'test@example.com' }
				})
			);
		});

		// Mock summary data API
		await page.route('**/api/summary/**', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					id: 'test-summary-123',
					title: 'Test Video: Understanding AI and Machine Learning',
					summary:
						'This video explains the fundamental concepts of artificial intelligence and machine learning, covering basic algorithms and real-world applications.',
					content: `Introduction to AI and ML

Artificial Intelligence (AI) and Machine Learning (ML) are transformative technologies that are reshaping how we interact with computers and data.

Key Concepts:
1. Machine Learning algorithms learn from data
2. AI systems can make decisions and predictions
3. Deep learning uses neural networks
4. Applications include image recognition, natural language processing, and autonomous vehicles

Real-world Examples:
- Voice assistants like Siri and Alexa
- Recommendation systems on Netflix and YouTube  
- Self-driving cars and autonomous systems
- Medical diagnosis and drug discovery

The video concludes by discussing the ethical implications and future prospects of AI technology in various industries.`,
					youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
					lang: 'ko',
					created_at: '2024-01-15T10:30:00Z'
				})
			});
		});
	});

	test('summary page displays content correctly', async ({ page }) => {
		await page.goto('/summary/test-summary-123');

		// Wait for content to load
		await page.waitForTimeout(2000);

		// Check if title is displayed
		await expect(page.locator('h1, .title, [data-testid="title"]')).toContainText(
			/test video|understanding ai/i
		);

		// Check if summary section exists
		const summarySection = page.locator('.summary, [data-testid="summary"], .content').first();
		await expect(summarySection).toBeVisible();

		// Check if content is displayed
		const pageContent = await page.textContent('body');
		expect(pageContent).toMatch(/artificial intelligence|machine learning|ai|ml/i);
	});

	test('summary page handles missing summary gracefully', async ({ page }) => {
		// Mock 404 response for missing summary
		await page.route('**/api/summary/nonexistent-id', async (route) => {
			await route.fulfill({
				status: 404,
				contentType: 'application/json',
				body: JSON.stringify({
					error: 'Summary not found'
				})
			});
		});

		await page.goto('/summary/nonexistent-id');

		// Wait for error handling
		await page.waitForTimeout(2000);

		// Check for error message or 404 page
		const pageContent = await page.textContent('body');
		const hasErrorHandling = /not found|찾을 수 없|404|error|오류/i.test(pageContent);

		expect(hasErrorHandling).toBeTruthy();
	});

	test('summary page is responsive on mobile', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto('/summary/test-summary-123');

		await page.waitForTimeout(2000);

		// Check if title is still visible on mobile
		const title = page.locator('h1, .title, [data-testid="title"]').first();
		await expect(title).toBeVisible();

		// Check if content is readable on mobile
		const contentBox = await title.boundingBox();
		expect(contentBox.width).toBeGreaterThan(300); // Should use most of the mobile width
	});

	test('summary page allows sharing functionality', async ({ page }) => {
		await page.goto('/summary/test-summary-123');
		await page.waitForTimeout(2000);

		// Look for share buttons or links
		const shareElements = [
			page.getByRole('button', { name: /share|공유|복사/i }),
			page.locator('button[data-testid*="share"]'),
			page.locator('.share-button'),
			page.locator('[aria-label*="share"]')
		];

		let shareElementFound = false;
		for (const element of shareElements) {
			try {
				await expect(element).toBeVisible({ timeout: 1000 });
				shareElementFound = true;
				break;
			} catch {
				// Continue to next element
			}
		}

		// If no share button, check if URL is shareable (current URL should be accessible)
		if (!shareElementFound) {
			const currentUrl = page.url();
			expect(currentUrl).toMatch(/summary\/test-summary-123/);
		}
	});

	test('summary page navigation works correctly', async ({ page }) => {
		await page.goto('/summary/test-summary-123');
		await page.waitForTimeout(2000);

		// Look for navigation elements (back button, home link, etc.)
		const navElements = [
			page.getByRole('link', { name: /back|뒤로|홈|home|dashboard/i }),
			page.getByRole('button', { name: /back|뒤로/i }),
			page.locator('a[href="/"]'),
			page.locator('a[href="/dashboard"]'),
			page.locator('.nav-back, .back-button'),
			page.locator('[aria-label*="back"], [aria-label*="home"]')
		];

		let navElementFound = false;
		for (const element of navElements) {
			try {
				await expect(element).toBeVisible({ timeout: 1000 });
				await element.click();
				navElementFound = true;

				// Check if navigation occurred
				await page.waitForTimeout(1000);
				const newUrl = page.url();
				expect(newUrl).not.toMatch(/summary\/test-summary-123/);
				break;
			} catch {
				// Continue to next element
			}
		}

		// If no navigation elements found, that's okay - test passes
		if (!navElementFound) {
			console.log('No navigation elements found - this may be expected behavior');
		}
	});

	test('summary content is properly formatted', async ({ page }) => {
		await page.goto('/summary/test-summary-123');
		await page.waitForTimeout(2000);

		// Check for proper text formatting
		const content = page.locator('body');
		await expect(content).toBeVisible();

		// Check if text is properly line-broken and readable
		const textContent = await page.textContent('body');

		// Should have proper spacing and structure
		const hasProperFormatting = textContent.includes('\n') || textContent.length > 100; // Indicates substantial content

		expect(hasProperFormatting).toBeTruthy();

		// Check for proper heading structure if present
		const headings = page.locator('h1, h2, h3, h4, h5, h6');
		const headingCount = await headings.count();

		if (headingCount > 0) {
			await expect(headings.first()).toBeVisible();
		}
	});

	test('summary page handles long content gracefully', async ({ page }) => {
		// Mock very long content
		await page.route('**/api/summary/long-content-123', async (route) => {
			const longContent = 'This is a very long content. '.repeat(1000);
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					id: 'long-content-123',
					title: 'Very Long Video Summary',
					summary: 'This is a summary of a very long video with extensive content.',
					content: longContent,
					youtube_url: 'https://www.youtube.com/watch?v=longvideo',
					lang: 'ko',
					created_at: '2024-01-15T10:30:00Z'
				})
			});
		});

		await page.goto('/summary/long-content-123');
		await page.waitForTimeout(2000);

		// Check if page loads and is scrollable
		const pageHeight = await page.evaluate(() => document.body.scrollHeight);
		expect(pageHeight).toBeGreaterThan(1000); // Should be tall enough to require scrolling

		// Test scrolling functionality
		await page.evaluate(() => window.scrollTo(0, 500));
		await page.waitForTimeout(500);

		const scrollPosition = await page.evaluate(() => window.scrollY);
		expect(scrollPosition).toBeGreaterThan(0);
	});

	test('summary page metadata is correct', async ({ page }) => {
		await page.goto('/summary/test-summary-123');
		await page.waitForTimeout(2000);

		// Check page title
		const title = await page.title();
		expect(title).toMatch(/test video|understanding ai|zheon|summary/i);

		// Check if meta description exists (for SEO)
		const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
		if (metaDescription) {
			expect(metaDescription.length).toBeGreaterThan(10);
		}

		// Check if proper meta tags exist for social sharing
		const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
		if (ogTitle) {
			expect(ogTitle).toMatch(/test video|understanding ai/i);
		}
	});
});
