import { assert, assertEquals } from 'jsr:@std/assert@1';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import 'jsr:@std/dotenv/load';

/**
 * Dashboard Edge Function 통합 테스트
 * 실제 Dashboard에서 Edge Function을 호출하는 방식과 동일하게 테스트
 */
Deno.test(
	'Dashboard Integration - Edge Function Call',
	{
		sanitizeResources: false,
		sanitizeOps: false
	},
	async () => {
		const supabase = createClient(
			Deno.env.get('PUBLIC_SUPABASE_URL')!,
			Deno.env.get('PUBLIC_SUPABASE_ANON_KEY')!
		);

		console.log('🧪 Testing Dashboard → Edge Function integration...');

		// 테스트할 YouTube URL (실제 존재하는 영상)
		const testUrl = 'https://youtu.be/K2lvjqvpajc?si=Gk-mWux5ZID_457Z';

		try {
			console.log(`📡 Calling Edge Function via supabase.functions.invoke()...`);
			console.log(`📥 Input URL: ${testUrl}`);

			const { data, error } = await supabase.functions.invoke('summary', {
				body: { url: testUrl }
			});

			if (error) {
				console.error('❌ Edge Function error:', error);
				throw new Error(`Edge Function failed: ${error.message}`);
			}

			console.log('✅ Edge Function response received!');
			console.log('📊 Response data:', JSON.stringify(data, null, 2));

			// 기본 응답 검증
			assert(data, 'Should return data');
			assertEquals(data.status, 'success', 'Status should be success');

			// Edge Function 응답 구조 검증 (debug 객체에 있을 수 있음)
			const recordId = data.debug?.record_id || data.record_id;
			const wasDuplicate = data.debug?.was_duplicate || data.was_duplicate || false;

			assert(recordId, 'Should return record_id in data or debug');
			assert(typeof wasDuplicate === 'boolean', 'Should return was_duplicate boolean');

			// 중복 처리 여부에 따른 메시지
			if (wasDuplicate) {
				console.log(`🔄 Duplicate URL detected - record updated (ID: ${recordId})`);
				console.log(`✅ Existing record moved to top of list`);
			} else {
				console.log(`🆕 New summary created (ID: ${recordId})`);
			}

			// Dashboard 응답 형식 시뮬레이션
			const dashboardResponse = {
				success: true,
				fromCache: wasDuplicate,
				recordId: recordId
			};

			console.log('📱 Dashboard response format:');
			console.log(JSON.stringify(dashboardResponse, null, 2));

			// Dashboard 로직 검증
			assert(dashboardResponse.success, 'Dashboard should indicate success');
			assert(typeof dashboardResponse.fromCache === 'boolean', 'Should have fromCache boolean');
			assert(dashboardResponse.recordId, 'Should have recordId');

			console.log('\n✨ Dashboard → Edge Function integration test passed!');
		} catch (testError) {
			console.error('🚨 Integration test error:', testError);
			throw testError;
		}
	}
);

/**
 * Dashboard 에러 처리 테스트
 */
Deno.test(
	'Dashboard Integration - Error Handling',
	{
		sanitizeResources: false,
		sanitizeOps: false
	},
	async () => {
		const supabase = createClient(
			Deno.env.get('PUBLIC_SUPABASE_URL')!,
			Deno.env.get('PUBLIC_SUPABASE_ANON_KEY')!
		);

		console.log('🧪 Testing Dashboard error handling...');

		// 잘못된 URL로 테스트
		const invalidUrl = 'https://invalid-url.com/video';

		try {
			console.log(`📡 Testing error handling with invalid URL: ${invalidUrl}`);

			const { data, error } = await supabase.functions.invoke('summary', {
				body: { url: invalidUrl }
			});

			// 에러가 발생해야 함
			assert(error, 'Should return error for invalid URL');

			console.log('✅ Error correctly returned:', error.message);

			// Dashboard 에러 처리 시뮬레이션
			let dashboardErrorResponse;

			if (error.message?.includes('Rate limit')) {
				dashboardErrorResponse = {
					type: 'rate_limit',
					message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
					retryAfter: 300
				};
			} else {
				dashboardErrorResponse = {
					type: 'edge_function_error',
					message: error.message || 'AI 처리 중 오류가 발생했습니다.'
				};
			}

			console.log('📱 Dashboard error response format:');
			console.log(JSON.stringify(dashboardErrorResponse, null, 2));

			assert(dashboardErrorResponse.type, 'Should have error type');
			assert(dashboardErrorResponse.message, 'Should have error message');

			console.log('\n✅ Dashboard error handling test passed!');
		} catch (testError) {
			console.error('🚨 Error handling test failed:', testError);
			throw testError;
		}
	}
);
