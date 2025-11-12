import prettier from 'eslint-config-prettier';
import js from '@eslint/js';
import { includeIgnoreFile } from '@eslint/compat';
import svelte from 'eslint-plugin-svelte';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import { fileURLToPath } from 'node:url';
import svelteConfig from './svelte.config.js';
import tseslint from 'typescript-eslint';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default [
	{
		ignores: [
			'**/database.types.ts',
			'**/database.ts',
			'**/*.d.ts',
			'**/MetricsRadarChart.svelte',
			'**/PieChart.svelte',
			'**/RadarChart.svelte',
			'**/SummaryDetail.svelte',
			'**/SummaryList.svelte',
			'**/YouTubePlayer.svelte',
			'**/SignOutForm.svelte'
		]
	},
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	...tseslint.configs.recommended,
	...svelte.configs.recommended,
	prettier,
	...svelte.configs.prettier,
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node }
		}
	},
	{
		files: ['**/*.ts', '**/*.tsx'],
		ignores: ['e2e/**/*.ts'],
		languageOptions: {
			parser: tseslint.parser,
			parserOptions: {
				project: true
			}
		}
	},
	{
		files: ['e2e/**/*.ts'],
		languageOptions: {
			parser: tseslint.parser
		}
	},
	{
		files: ['**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx'],
		plugins: { 'unused-imports': unusedImports },
		rules: {
			'unused-imports/no-unused-imports': 'error',
			'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
		}
	},
	{
		files: [
			'**/audio-cache.ts',
			'**/audio-cache.worker.ts',
			'**/youtubeApi.ts',
			'**/transcription.remote.ts',
			'**/comment.remote.ts',
			'**/channel.remote.ts',
			'**/subscription.remote.ts',
			'**/channel_video.remote.ts'
		],
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unsafe-function-type': 'off'
		}
	},
	{
		files: ['**/services/**/*.ts'],
		rules: {
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': 'off'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.js'],
		languageOptions: { parserOptions: { svelteConfig } },
		rules: {
			'svelte/no-navigation-without-resolve': 'off',
			'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
			'@typescript-eslint/no-unsafe-member-access': 'off',
			'@typescript-eslint/no-unsafe-call': 'off',
			'@typescript-eslint/no-unsafe-assignment': 'off',
			'no-undef': 'off'
		}
	}
];
