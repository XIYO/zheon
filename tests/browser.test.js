import { expect, test, describe } from 'vitest';
import { page } from '@vitest/browser/context';

describe('Browser Mode Smoke Test', () => {
	test('browser APIs are available', () => {
		// 브라우저 API가 실제로 동작하는지 확인
		expect(window).toBeDefined();
		expect(document).toBeDefined();
		expect(localStorage).toBeDefined();
	});

	test('can manipulate DOM', async () => {
		// DOM 조작이 가능한지 확인
		document.body.innerHTML = '<h1>Hello Vitest Browser Mode</h1>';

		const heading = page.getByRole('heading', { level: 1 });
		await expect.element(heading).toHaveTextContent('Hello Vitest Browser Mode');
	});

	test('localStorage works', () => {
		// 실제 localStorage 동작 확인
		localStorage.setItem('test', 'value');
		expect(localStorage.getItem('test')).toBe('value');
		localStorage.removeItem('test');
	});
});
