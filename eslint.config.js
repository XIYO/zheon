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
	{ ignores: ['**/database.types.ts', '**/database.ts', '**/*.d.ts'] },
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
		languageOptions: {
			parser: tseslint.parser,
			parserOptions: {
				project: true
			}
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
			'**/transcription.remote.ts'
		],
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unsafe-function-type': 'off'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.js'],
		languageOptions: { parserOptions: { svelteConfig } },
		rules: {
			'svelte/no-navigation-without-resolve': 'off',
			'no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
		}
	}
];
