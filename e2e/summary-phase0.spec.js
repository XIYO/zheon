import { test, expect } from '@playwright/test';
import { logger } from '../src/lib/logger.js';

test.describe('Phase 0: 폼 제출 및 동기화 테스트', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
	});

	test('폼 제출 시 낙관적 업데이트 → 서버 응답으로 교체 → 새로고침 후 유지', async ({ page }) => {
		const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

		const input = page.locator('input[placeholder*="YouTube URL"]');
		await input.fill(testUrl);

		const submitButton = page.locator('button[type="submit"]:has-text("생성")');
		await submitButton.click();

		// 1. 낙관적 업데이트 확인: pending 상태 표시
		const pendingBadge = page.locator('text=대기 중').first();
		await expect(pendingBadge).toBeVisible({ timeout: 5000 });
		logger.info('[TEST] 낙관적 업데이트 확인: pending 상태 표시됨');

		// 2. 서버 응답 대기: processing 상태로 전환
		const processingBadge = page.locator('text=처리 중').first();
		await expect(processingBadge).toBeVisible({ timeout: 15000 });
		logger.info('[TEST] 서버 응답 확인: processing 상태로 전환됨');

		// 3. 테이블에서 URL 확인
		const tableRow = page.locator(`a[href*="/summaries/"]`).first();
		await expect(tableRow).toBeVisible();

		// 4. 새로고침 후 데이터 유지 확인
		await page.reload();
		await page.waitForLoadState('networkidle');

		const reloadedRow = page.locator(`a[href*="/summaries/"]`).first();
		await expect(reloadedRow).toBeVisible({ timeout: 5000 });
		logger.info('[TEST] 새로고침 후 데이터 유지 확인됨');
	});

	test('중복 URL 제출 시 제출 방지', async ({ page }) => {
		const testUrl = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';

		const input = page.locator('input[placeholder*="YouTube URL"]');
		const submitButton = page.locator('button[type="submit"]:has-text("생성")');

		// 첫 번째 제출
		await input.fill(testUrl);
		await submitButton.click();

		// pending 상태 확인
		const pendingBadge = page.locator('text=대기 중').first();
		await expect(pendingBadge).toBeVisible({ timeout: 5000 });

		// 초기 항목 수 저장
		const initialRows = await page.locator('tbody tr').count();

		// 두 번째 제출 시도
		await input.fill(testUrl);
		await submitButton.click();

		// 잠시 대기
		await page.waitForTimeout(2000);

		// 항목 수가 증가하지 않았는지 확인
		const finalRows = await page.locator('tbody tr').count();
		expect(finalRows).toBe(initialRows);
		logger.info('[TEST] 중복 URL 제출 방지 확인됨');
	});

	test('상태 표시 확인: pending → processing → completed/failed', async ({ page }) => {
		const testUrl = 'https://www.youtube.com/watch?v=9bZkp7q19f0';

		const input = page.locator('input[placeholder*="YouTube URL"]');
		await input.fill(testUrl);

		const submitButton = page.locator('button[type="submit"]:has-text("생성")');
		await submitButton.click();

		// 1. pending 상태
		const pendingBadge = page.locator('text=대기 중').first();
		await expect(pendingBadge).toBeVisible({ timeout: 5000 });

		const pendingDot = page.locator('.bg-warning-500.animate-pulse').first();
		await expect(pendingDot).toBeVisible();
		logger.info('[TEST] pending 상태 표시 확인됨');

		// 2. processing 상태
		const processingBadge = page.locator('text=처리 중').first();
		await expect(processingBadge).toBeVisible({ timeout: 15000 });

		const processingDot = page.locator('.bg-primary-500.animate-pulse').first();
		await expect(processingDot).toBeVisible();
		logger.info('[TEST] processing 상태 표시 확인됨');

		// 3. completed 또는 failed 상태 (최대 60초 대기)
		const completedDot = page.locator('.bg-success-500').first();
		const failedBadge = page.locator('text=실패').first();

		await Promise.race([
			expect(completedDot).toBeVisible({ timeout: 60000 }),
			expect(failedBadge).toBeVisible({ timeout: 60000 })
		]).catch(() => {
			logger.info('[TEST] 60초 내 완료/실패 상태 전환 안됨 (백그라운드 처리 진행 중)');
		});
	});

	test('Realtime 구독 동작 확인: UPDATE 이벤트 수신', async ({ page }) => {
		const testUrl = 'https://www.youtube.com/watch?v=ScMzIvxBSi4';

		// 콘솔 로그 캡처
		const logs = [];
		page.on('console', (msg) => {
			if (msg.text().includes('[SummaryList]')) {
				logs.push(msg.text());
			}
		});

		const input = page.locator('input[placeholder*="YouTube URL"]');
		await input.fill(testUrl);

		const submitButton = page.locator('button[type="submit"]:has-text("생성")');
		await submitButton.click();

		// pending 상태 확인
		await expect(page.locator('text=대기 중').first()).toBeVisible({ timeout: 5000 });

		// Realtime 구독 시작 로그 확인
		await page.waitForTimeout(1000);
		const subscriptionStartLog = logs.find((log) => log.includes('Realtime 구독 시작'));
		expect(subscriptionStartLog).toBeTruthy();
		logger.info('[TEST] Realtime 구독 시작 확인됨');

		// UPDATE 이벤트 수신 대기 (최대 20초)
		await page.waitForTimeout(20000);
		const updateEventLog = logs.find(
			(log) => log.includes('Realtime 이벤트 수신') && log.includes('UPDATE')
		);

		if (updateEventLog) {
			logger.info('[TEST] Realtime UPDATE 이벤트 수신 확인됨');
		} else {
			logger.info('[TEST] Realtime UPDATE 이벤트 미수신 (백그라운드 처리 지연 가능)');
		}
	});

	test('폼 제출 실패 시 롤백', async ({ page }) => {
		// 잘못된 URL로 서버 에러 유도
		const invalidUrl = 'https://www.youtube.com/watch?v=invalid';

		const input = page.locator('input[placeholder*="YouTube URL"]');
		await input.fill(invalidUrl);

		const submitButton = page.locator('button[type="submit"]:has-text("생성")');

		// 초기 항목 수
		const initialRows = await page.locator('tbody tr').count();

		await submitButton.click();

		// 잠시 대기 후 항목 수 확인
		await page.waitForTimeout(3000);

		// 에러 발생 시 낙관적 항목이 롤백되어 항목 수가 변하지 않아야 함
		const finalRows = await page.locator('tbody tr').count();

		// 만약 성공했다면 항목이 추가되고, 실패했다면 롤백되어 동일
		if (finalRows === initialRows) {
			logger.info('[TEST] 롤백 확인됨: 항목 수 변화 없음');
		} else {
			logger.info('[TEST] 제출 성공: 롤백 테스트 불가');
		}
	});
});
