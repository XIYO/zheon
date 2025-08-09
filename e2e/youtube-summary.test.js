import { test, expect } from '@playwright/test';

test.describe('YouTube Summary Feature', () => {
	test('should successfully create a summary for a YouTube video', async ({ page }) => {
		// 1. 로그인 페이지로 이동
		await page.goto('/auth/sign-in');
		
		// 2. 로그인 폼 요소가 로드될 때까지 대기
		await expect(page.locator('input[name="email"]')).toBeVisible();
		
		// 스크린샷으로 페이지 상태 확인
		await page.screenshot({ path: 'debug-signin-page.png' });
		
		// 3. 로그인 정보 입력
		await page.fill('input[name="email"]', 'bunny@xiyio.dev');
		await page.fill('input[name="password"]', 'ZeroMember7!');
		
		// 입력 후 스크린샷
		await page.screenshot({ path: 'debug-signin-filled.png' });
		
		// 4. 로그인 버튼 클릭
		await page.click('button[type="submit"]');
		
		// 로그인 시도 후 3초 대기
		await page.waitForTimeout(3000);
		
		// 현재 URL 및 페이지 상태 확인
		const currentUrl = page.url();
		console.log('Current URL after login attempt:', currentUrl);
		await page.screenshot({ path: 'debug-after-login.png' });
		
		// 에러 메시지가 있는지 확인
		const errorMessage = await page.locator('.text-error-500, .preset-tonal-error, [role="alert"]').textContent().catch(() => null);
		if (errorMessage) {
			console.log('Error message found:', errorMessage);
		}
		
		// 5. 로그인 처리 대기 후 대시보드 확인 (더 긴 타임아웃)
		await page.waitForURL('/', { timeout: 10000 });
		
		// 4. YouTube URL 입력
		const youtubeUrl = 'https://www.youtube.com/watch?v=NhOV9SLbJuk';
		await page.fill('input[name="youtubeUrl"]', youtubeUrl);
		
		// 5. 요약 시작 버튼 클릭
		await page.click('button:has-text("인사이트 추출 시작")');
		
		// 6. 요약 결과 페이지로 이동 확인 (최대 60초 대기)
		await page.waitForURL(/\/summary\/.*/, { timeout: 60000 });
		
		// 7. 요약 내용이 표시되는지 확인
		await expect(page.locator('h1')).toBeVisible();
		await expect(page.locator('text=/요약|Summary|핵심|내용/i')).toBeVisible();
		
		// 8. 영상 제목이 표시되는지 확인
		const title = await page.locator('h1').textContent();
		expect(title).toBeTruthy();
		
		console.log('Summary created successfully for:', title);
	});

	test('should show existing summary when same URL is submitted again', async ({ page }) => {
		// 1. 로그인
		await page.goto('/auth/sign-in');
		await page.fill('input[name="email"]', 'bunny@xiyio.dev');
		await page.fill('input[name="password"]', 'ZeroMember7!');
		await page.click('button[type="submit"]');
		
		// 2. 대시보드로 이동
		await expect(page).toHaveURL('/');
		
		// 3. 같은 YouTube URL 다시 입력
		const youtubeUrl = 'https://www.youtube.com/watch?v=NhOV9SLbJuk';
		await page.fill('input[name="youtubeUrl"]', youtubeUrl);
		
		// 4. 요약 시작 버튼 클릭
		await page.click('button:has-text("인사이트 추출 시작")');
		
		// 5. 빠르게 요약 페이지로 이동하는지 확인 (캐시된 경우 빠름)
		await page.waitForURL(/\/summary\/.*/, { timeout: 10000 });
		
		// 6. 요약 내용 확인
		await expect(page.locator('h1')).toBeVisible();
		
		console.log('Cached summary loaded successfully');
	});

	test('should validate invalid URLs', async ({ page }) => {
		// 1. 로그인
		await page.goto('/auth/sign-in');
		await page.fill('input[name="email"]', 'bunny@xiyio.dev');
		await page.fill('input[name="password"]', 'ZeroMember7!');
		await page.click('button[type="submit"]');
		
		// 2. 대시보드로 이동
		await expect(page).toHaveURL('/');
		
		// 3. 잘못된 URL 입력 테스트
		const invalidUrls = [
			'not a url',
			'http://insecure.com',
			'javascript:alert(1)',
			''
		];
		
		for (const invalidUrl of invalidUrls) {
			await page.fill('input[name="youtubeUrl"]', invalidUrl);
			
			// 폼 제출 시도
			await page.click('button:has-text("인사이트 추출 시작")');
			
			// 에러 메시지 확인
			const errorMessage = await page.locator('.text-error-500').textContent();
			expect(errorMessage).toBeTruthy();
			
			// URL이 변경되지 않았는지 확인 (여전히 대시보드)
			await expect(page).toHaveURL('/');
			
			console.log(`Invalid URL "${invalidUrl}" correctly rejected with: ${errorMessage}`);
		}
	});

	test('should display summary list on dashboard', async ({ page }) => {
		// 1. 로그인
		await page.goto('/auth/sign-in');
		await page.fill('input[name="email"]', 'bunny@xiyio.dev');
		await page.fill('input[name="password"]', 'ZeroMember7!');
		await page.click('button[type="submit"]');
		
		// 2. 대시보드로 이동
		await expect(page).toHaveURL('/');
		
		// 3. 요약 목록이 표시되는지 확인
		const summaryList = page.locator('.space-y-4').first();
		await expect(summaryList).toBeVisible();
		
		// 4. 요약 항목이 있는지 확인
		const summaryItems = page.locator('a[href^="/summary/"]');
		const count = await summaryItems.count();
		
		if (count > 0) {
			console.log(`Found ${count} existing summaries`);
			
			// 첫 번째 요약 클릭
			await summaryItems.first().click();
			
			// 요약 상세 페이지로 이동 확인
			await expect(page).toHaveURL(/\/summary\/.*/);
			await expect(page.locator('h1')).toBeVisible();
			
			console.log('Successfully navigated to summary detail page');
		} else {
			console.log('No existing summaries found');
		}
	});
});