import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: 'e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	reporter: [
		['html', { open: 'never', port: 27777 }],
		['line']
	],
	timeout: 30000,
	use: {
		baseURL: 'http://localhost:17777',
		trace: 'on-first-retry',
		screenshot: 'on'
	},
	webServer: {
		command: 'pnpm build && pnpm preview',
		port: 17777,
		reuseExistingServer: !process.env.CI
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		},
		{
			name: 'webkit',
			use: { ...devices['Desktop Safari'] }
		}
	]
});
