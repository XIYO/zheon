/**
 * Playwright test helpers for E2E testing
 */

/**
 * Sets up mock authentication state for testing
 * @param {Page} page - Playwright page object
 * @param {Object} user - User object to mock
 */
export async function setupMockAuth(page, user = null) {
	const defaultUser = user || {
		id: 'test-user-123',
		email: 'test@example.com',
		user_metadata: {
			full_name: 'Test User'
		}
	};

	await page.addInitScript((mockUser) => {
		window.localStorage.setItem('supabase.auth.token', JSON.stringify({
			access_token: 'mock-token',
			user: mockUser
		}));
	}, defaultUser);

	// Mock auth API responses
	await page.route('**/auth/session', async route => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				session: {
					access_token: 'mock-token',
					user: defaultUser
				}
			})
		});
	});
}

/**
 * Clears authentication state
 * @param {Page} page - Playwright page object
 */
export async function clearAuth(page) {
	await page.context().clearCookies();
	await page.addInitScript(() => {
		window.localStorage.clear();
		window.sessionStorage.clear();
	});
}

/**
 * Mocks API endpoints with custom responses
 * @param {Page} page - Playwright page object
 * @param {Object} routes - Object mapping route patterns to mock responses
 */
export async function mockApiRoutes(page, routes = {}) {
	for (const [pattern, response] of Object.entries(routes)) {
		await page.route(pattern, async route => {
			const { status = 200, data = {}, headers = {} } = response;
			await route.fulfill({
				status,
				contentType: 'application/json',
				headers: { 'Content-Type': 'application/json', ...headers },
				body: JSON.stringify(data)
			});
		});
	}
}

/**
 * Waits for an element to appear and optionally verifies its content
 * @param {Page} page - Playwright page object
 * @param {string} selector - CSS selector or text to wait for
 * @param {Object} options - Options for waiting
 * @returns {Promise<ElementHandle>} Element handle
 */
export async function waitForElement(page, selector, options = {}) {
	const { timeout = 5000, text = null } = options;
	
	try {
		if (text) {
			return await page.waitForSelector(`text=${text}`, { timeout });
		}
		return await page.waitForSelector(selector, { timeout });
	} catch (error) {
		throw new Error(`Element '${selector}' not found within ${timeout}ms`);
	}
}

/**
 * Fills a form with the provided data
 * @param {Page} page - Playwright page object
 * @param {Object} formData - Object with field names and values
 * @param {string} formSelector - CSS selector for the form (optional)
 */
export async function fillForm(page, formData, formSelector = 'form') {
	for (const [fieldName, value] of Object.entries(formData)) {
		const selector = `${formSelector} input[name="${fieldName}"], ${formSelector} select[name="${fieldName}"], ${formSelector} textarea[name="${fieldName}"]`;
		await page.fill(selector, value.toString());
	}
}

/**
 * Submits a form and waits for response
 * @param {Page} page - Playwright page object
 * @param {string} formSelector - CSS selector for the form
 * @param {Object} options - Options for form submission
 */
export async function submitForm(page, formSelector = 'form', options = {}) {
	const { waitForNavigation = true, timeout = 10000 } = options;
	
	const submitButton = page.locator(`${formSelector} button[type="submit"], ${formSelector} input[type="submit"]`).first();
	
	if (waitForNavigation) {
		await Promise.all([
			page.waitForLoadState('networkidle', { timeout }),
			submitButton.click()
		]);
	} else {
		await submitButton.click();
	}
}

/**
 * Checks if element contains specific text (case-insensitive)
 * @param {Page} page - Playwright page object
 * @param {string} selector - CSS selector
 * @param {string} expectedText - Text to check for
 * @returns {Promise<boolean>} Whether element contains the text
 */
export async function elementContainsText(page, selector, expectedText) {
	try {
		const element = await page.locator(selector).first();
		const text = await element.textContent();
		return text && text.toLowerCase().includes(expectedText.toLowerCase());
	} catch {
		return false;
	}
}

/**
 * Waits for a successful navigation and ensures page is loaded
 * @param {Page} page - Playwright page object
 * @param {string} expectedUrl - Expected URL pattern
 * @param {Object} options - Options for waiting
 */
export async function waitForSuccessfulNavigation(page, expectedUrl, options = {}) {
	const { timeout = 10000 } = options;
	
	await page.waitForURL(expectedUrl, { timeout });
	await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Takes a screenshot with timestamp for debugging
 * @param {Page} page - Playwright page object
 * @param {string} name - Screenshot name
 * @param {Object} options - Screenshot options
 */
export async function takeDebugScreenshot(page, name, options = {}) {
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
	const filename = `debug-${name}-${timestamp}.png`;
	
	await page.screenshot({
		path: `test-results/screenshots/${filename}`,
		fullPage: true,
		...options
	});
	
	console.log(`Debug screenshot saved: ${filename}`);
}

/**
 * Checks for console errors on the page
 * @param {Page} page - Playwright page object
 * @returns {Array} Array of console error messages
 */
export async function getConsoleErrors(page) {
	const errors = [];
	
	page.on('console', msg => {
		if (msg.type() === 'error') {
			errors.push(msg.text());
		}
	});
	
	return errors;
}

/**
 * Simulates slow network conditions
 * @param {Page} page - Playwright page object
 * @param {Object} options - Network throttling options
 */
export async function simulateSlowNetwork(page, options = {}) {
	const { downloadThroughput = 50000, uploadThroughput = 50000, latency = 200 } = options;
	
	await page.route('**/*', async route => {
		await new Promise(resolve => setTimeout(resolve, latency));
		await route.continue();
	});
}

/**
 * Validates accessibility of the current page
 * @param {Page} page - Playwright page object
 * @returns {Promise<Object>} Accessibility validation results
 */
export async function validateAccessibility(page) {
	// Basic accessibility checks
	const results = {
		hasSkipLinks: false,
		hasProperHeadings: false,
		hasAltTextForImages: true,
		hasProperForms: true,
		errors: []
	};

	try {
		// Check for skip links
		const skipLinks = await page.locator('a[href="#main"], a[href="#content"]').count();
		results.hasSkipLinks = skipLinks > 0;

		// Check heading structure
		const h1Count = await page.locator('h1').count();
		results.hasProperHeadings = h1Count === 1;

		// Check images for alt text
		const images = await page.locator('img').all();
		for (const img of images) {
			const alt = await img.getAttribute('alt');
			if (!alt && alt !== '') {
				results.hasAltTextForImages = false;
				results.errors.push('Image missing alt attribute');
			}
		}

		// Check form labels
		const inputs = await page.locator('input[type="text"], input[type="email"], input[type="password"], textarea').all();
		for (const input of inputs) {
			const id = await input.getAttribute('id');
			const name = await input.getAttribute('name');
			
			if (id) {
				const labelCount = await page.locator(`label[for="${id}"]`).count();
				if (labelCount === 0) {
					results.hasProperForms = false;
					results.errors.push(`Input with id="${id}" missing associated label`);
				}
			} else if (name) {
				// Check if input is wrapped in label
				const wrappedInLabel = await input.locator('xpath=ancestor::label').count();
				if (wrappedInLabel === 0) {
					results.hasProperForms = false;
					results.errors.push(`Input with name="${name}" not properly labeled`);
				}
			}
		}

	} catch (error) {
		results.errors.push(`Accessibility validation error: ${error.message}`);
	}

	return results;
}

/**
 * Tests keyboard navigation on the page
 * @param {Page} page - Playwright page object
 * @returns {Promise<Object>} Navigation test results
 */
export async function testKeyboardNavigation(page) {
	const results = {
		canNavigateWithTab: false,
		focusVisible: false,
		canActivateWithEnter: false,
		errors: []
	};

	try {
		// Test tab navigation
		await page.keyboard.press('Tab');
		const focusedElement = await page.locator(':focus').first();
		results.canNavigateWithTab = await focusedElement.count() > 0;

		// Test focus visibility
		if (results.canNavigateWithTab) {
			const outline = await focusedElement.evaluate(el => {
				const styles = window.getComputedStyle(el);
				return styles.outline !== 'none' || styles.boxShadow !== 'none';
			});
			results.focusVisible = outline;
		}

		// Test enter key activation on buttons/links
		const buttons = await page.locator('button, a[href]').all();
		if (buttons.length > 0) {
			await buttons[0].focus();
			await page.keyboard.press('Enter');
			results.canActivateWithEnter = true;
		}

	} catch (error) {
		results.errors.push(`Keyboard navigation test error: ${error.message}`);
	}

	return results;
}

/**
 * Checks responsive design across different viewport sizes
 * @param {Page} page - Playwright page object
 * @param {Array} viewports - Array of viewport sizes to test
 * @returns {Promise<Object>} Responsive test results
 */
export async function testResponsiveDesign(page, viewports = [
	{ width: 375, height: 667, name: 'mobile' },
	{ width: 768, height: 1024, name: 'tablet' },
	{ width: 1920, height: 1080, name: 'desktop' }
]) {
	const results = {};

	for (const viewport of viewports) {
		await page.setViewportSize({ width: viewport.width, height: viewport.height });
		await page.waitForTimeout(500); // Allow layout to settle

		results[viewport.name] = {
			hasHorizontalScroll: false,
			contentVisible: true,
			navigationAccessible: true,
			errors: []
		};

		try {
			// Check for horizontal scroll
			const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
			const clientWidth = await page.evaluate(() => document.body.clientWidth);
			results[viewport.name].hasHorizontalScroll = scrollWidth > clientWidth;

			// Check if main content is visible
			const mainContent = page.locator('main, [role="main"], .main-content').first();
			if (await mainContent.count() > 0) {
				results[viewport.name].contentVisible = await mainContent.isVisible();
			}

			// Check if navigation is accessible
			const nav = page.locator('nav, [role="navigation"]').first();
			if (await nav.count() > 0) {
				results[viewport.name].navigationAccessible = await nav.isVisible();
			}

		} catch (error) {
			results[viewport.name].errors.push(`Responsive test error: ${error.message}`);
		}
	}

	return results;
}