import { test, expect } from '@playwright/test';

test.describe('기본 동작 테스트', () => {
	test('URL 제출 후 새로고침해도 데이터 유지', async ({ page }) => {
		// 콘솔 로그 캡처
		page.on('console', (msg) => {
			const text = msg.text();
			if (text.includes('[SummaryForm]') || text.includes('[SummaryList]')) {
				console.log(`[BROWSER] ${text}`);
			}
		});

		await page.goto('/');

		const testUrl = 'https://www.youtube.com/watch?v=w7lLqpcBwb0';

		// 1. URL 입력 및 제출
		const input = page.locator('input[placeholder*="YouTube URL"]');
		await input.fill(testUrl);

		const submitButton = page.locator('button[type="submit"]:has-text("생성")');
		await submitButton.click();

		// 2. 낙관적 업데이트 확인: 항목이 리스트에 표시됨
		const listItem = page.locator('tbody tr').first();
		await expect(listItem).toBeVisible({ timeout: 5000 });
		console.log('[TEST] ✅ 낙관적 업데이트: 항목이 리스트에 추가됨');

		// 서버 응답 대기 (3초)
		await page.waitForTimeout(3000);
		console.log('[TEST] ⏳ 서버 응답 대기 완료');

		// 3. 새로고침
		console.log('[TEST] 🔄 페이지 새로고침...');
		await page.reload();
		await page.waitForLoadState('networkidle');

		// 4. 새로고침 후에도 항목이 남아있는지 확인
		const reloadedItem = page.locator('tbody tr').first();
		await expect(reloadedItem).toBeVisible({ timeout: 10000 });
		console.log('[TEST] ✅ 새로고침 후 데이터 유지: 항목이 여전히 표시됨');

		// 5. URL 링크가 제대로 있는지 확인
		const linkElement = page.locator('a[href*="/summaries/"]').first();
		await expect(linkElement).toBeVisible();
		const href = await linkElement.getAttribute('href');
		console.log('[TEST] ✅ 링크 확인: ' + href);
	});
});
