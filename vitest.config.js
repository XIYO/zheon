import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide'
		})
	],
	test: {
		projects: [
			{
				extends: './vitest.config.js',
				test: {
					name: 'client',
					setupFiles: ['vitest-browser-svelte'],
					browser: {
						enabled: true,
						provider: 'playwright',
						instances: [
							{
								browser: 'chromium'
							}
						],
						headless: process.env.CI ? true : false,
						screenshotFailures: true
					},
					include: ['tests/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**', 'tests/lib/server/**']
				}
			},
			{
				extends: './vitest.config.js',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}', 'tests/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}', 'tests/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
