import { test, expect } from '@playwright/test';

test.describe('중복 비디오 분석 처리', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
	});

	test('동일한 YouTube URL을 두 번 제출해도 정상 처리되어야 함', async ({ page }) => {
		const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

		// 첫 번째 제출
		console.log('첫 번째 제출 시작');
		const input = page.locator('input[placeholder*="YouTube URL"]');
		await input.fill(testUrl);

		const submitButton = page.locator('button[type="submit"]:has-text("생성")');
		await submitButton.click();

		// 상태 표시기 확인 (로컬에서는 즉시 처리될 수 있으므로 모든 가능한 상태 체크)
		const statusIndicator = page.locator('.w-2.h-2.rounded-full').first();
		await expect(statusIndicator).toBeVisible({ timeout: 5000 });

		// 상태 표시기가 유효한 상태 중 하나를 가지는지 확인
		const classList = await statusIndicator.getAttribute('class');
		const hasValidStatus =
			classList?.includes('bg-warning-500') || // pending
			classList?.includes('bg-primary-500') || // processing
			classList?.includes('bg-success-500'); // completed

		expect(hasValidStatus).toBeTruthy();
		console.log('첫 번째 제출 상태 표시 확인:', classList);

		// 처리 완료 대기 (실제 서버 응답)
		await page.waitForTimeout(3000);

		// 페이지 새로고침
		await page.reload();

		// 두 번째 제출 (동일한 URL)
		console.log('두 번째 제출 시작 (중복)');
		await input.fill(testUrl);
		await submitButton.click();

		// 에러 메시지가 없어야 함
		const errorMessage = page.locator('.text-error-500');
		await expect(errorMessage).not.toBeVisible({ timeout: 5000 });

		// 정상적으로 처리되어야 함
		console.log('중복 제출 정상 처리 확인');
	});

	test('이미 분석된 비디오 URL 입력 시 처리되어야 함', async ({ page }) => {
		const testUrl = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';

		// URL 입력 및 제출
		const input = page.locator('input[placeholder*="YouTube URL"]');
		await input.fill(testUrl);

		const submitButton = page.locator('button[type="submit"]:has-text("생성")');
		await submitButton.click();

		// 처리 대기
		await page.waitForTimeout(2000);

		// 상태 표시기나 요약 페이지 중 하나가 나타나야 함
		const hasStatusIndicator = (await page.locator('.w-2.h-2.rounded-full').count()) > 0;
		const isOnSummaryPage = page.url().includes('/summaries/');

		expect(hasStatusIndicator || isOnSummaryPage).toBeTruthy();
		console.log('처리 결과 - 상태 표시기:', hasStatusIndicator, '요약 페이지:', isOnSummaryPage);
	});

	test('중복 댓글 저장 시 서버 에러가 발생하지 않아야 함', async ({ page }) => {
		// 실제 YouTube 비디오 URL 사용 (댓글이 있는 비디오)
		const testUrl = 'https://www.youtube.com/watch?v=ScMzIvxBSi4';

		// URL 입력 및 제출
		const input = page.locator('input[placeholder*="YouTube URL"]');
		await input.fill(testUrl);

		const submitButton = page.locator('button[type="submit"]:has-text("생성")');
		await submitButton.click();

		// 처리 대기
		await page.waitForTimeout(5000);

		// 에러 표시가 없어야 함
		const errorMessage = page.locator('.text-error-500');
		const errorCount = await errorMessage.count();

		expect(errorCount).toBe(0);
		console.log('서버 에러 없이 처리 완료');
	});

	test('자막이 이미 존재하는 비디오도 정상 처리되어야 함', async ({ page }) => {
		// 이미 자막이 있을 가능성이 높은 인기 비디오
		const testUrl = 'https://www.youtube.com/watch?v=9bZkp7q19f0';

		// 첫 번째 제출
		const input = page.locator('input[placeholder*="YouTube URL"]');
		await input.fill(testUrl);

		const submitButton = page.locator('button[type="submit"]:has-text("생성")');
		await submitButton.click();

		// 상태 표시기 확인
		const statusIndicator = page.locator('.w-2.h-2.rounded-full').first();
		await expect(statusIndicator).toBeVisible({ timeout: 5000 });

		// 처리 대기
		await page.waitForTimeout(3000);

		// 페이지 새로고침
		await page.reload();

		// 두 번째 제출 (자막 중복)
		await input.fill(testUrl);
		await submitButton.click();

		// 에러 없이 정상 처리되어야 함
		const errorMessage = page.locator('.text-error-500');
		const errorCount = await errorMessage.count();

		expect(errorCount).toBe(0);
		console.log('자막 중복 처리 정상 확인');
	});
});
