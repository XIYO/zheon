import { assert, assertEquals } from 'jsr:@std/assert@1';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import 'jsr:@std/dotenv/load';

/**
 * FormData로 URL 전송 테스트
 */
Deno.test(
	'Summary Function - FormData Request',
	{
		sanitizeResources: false,
		sanitizeOps: false
	},
	async () => {
		const supabase = createClient(
			Deno.env.get('PUBLIC_SUPABASE_URL')!,
			Deno.env.get('PUBLIC_SUPABASE_ANON_KEY')!
		);

		console.log('🧪 Testing FormData request...');

		// 새로운 YouTube URL 사용 (중복 방지)
		const testUrl = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';

		// FormData 생성
		const formData = new FormData();
		formData.append('url', testUrl);

		// 직접 fetch 사용 (supabase.functions.invoke는 JSON만 지원)
		const response = await fetch(`${Deno.env.get('PUBLIC_SUPABASE_URL')}/functions/v1/summary`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${Deno.env.get('PUBLIC_SUPABASE_ANON_KEY')}`
			},
			body: formData
		});

		const data = await response.json();
		console.log('📊 Response:', JSON.stringify(data, null, 2));

		// 성공하거나 중복 에러가 발생해야 함
		if (response.status === 409) {
			assert(data.code === 'DUPLICATE_URL', 'Should be duplicate URL error');
			console.log('✅ Duplicate URL (expected for repeated tests)');
		} else {
			assertEquals(response.status, 200, 'Should return 200 OK');
			assertEquals(data.status, 'success', 'Should process successfully');
			console.log('✅ FormData request processed successfully!');
		}
	}
);

/**
 * URL encoded form으로 URL 전송 테스트
 */
Deno.test(
	'Summary Function - URL Encoded Form Request',
	{
		sanitizeResources: false,
		sanitizeOps: false
	},
	async () => {
		const supabase = createClient(
			Deno.env.get('PUBLIC_SUPABASE_URL')!,
			Deno.env.get('PUBLIC_SUPABASE_ANON_KEY')!
		);

		console.log('🧪 Testing URL encoded form request...');

		// 새로운 YouTube URL 사용
		const testUrl = 'https://www.youtube.com/watch?v=9bZkp7q19f0';

		// URL encoded form data
		const params = new URLSearchParams();
		params.append('url', testUrl);

		// 직접 fetch 사용
		const response = await fetch(`${Deno.env.get('PUBLIC_SUPABASE_URL')}/functions/v1/summary`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${Deno.env.get('PUBLIC_SUPABASE_ANON_KEY')}`,
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: params.toString()
		});

		const data = await response.json();
		console.log('📊 Response:', JSON.stringify(data, null, 2));

		// 성공하거나 중복 에러가 발생해야 함
		if (response.status === 409) {
			assert(data.code === 'DUPLICATE_URL', 'Should be duplicate URL error');
			console.log('✅ Duplicate URL (expected for repeated tests)');
		} else {
			assertEquals(response.status, 200, 'Should return 200 OK');
			assertEquals(data.status, 'success', 'Should process successfully');
			console.log('✅ URL encoded form request processed successfully!');
		}
	}
);
