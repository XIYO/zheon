import { assert, assertEquals, assertExists } from 'jsr:@std/assert';
import { createClient } from 'jsr:@supabase/supabase-js@2';

// 환경 변수 검증
Deno.test('Environment Variables Loaded', () => {
	const supabaseUrl = Deno.env.get('PUBLIC_SUPABASE_URL');
	const supabaseAnonKey = Deno.env.get('PUBLIC_SUPABASE_ANON_KEY');

	assert(supabaseUrl, 'PUBLIC_SUPABASE_URL not found');
	assert(supabaseAnonKey, 'PUBLIC_SUPABASE_ANON_KEY not found');

	console.log('✅ Test environment variables loaded');
});

// Hello-env 함수 테스트 - invoke() 방식 사용 (공식 권장)
Deno.test({
	name: 'Hello-env Function - Environment Variables Check',
	async fn() {
		const supabaseUrl = Deno.env.get('PUBLIC_SUPABASE_URL')!;
		const supabaseAnonKey = Deno.env.get('PUBLIC_SUPABASE_ANON_KEY')!;

		const supabase = createClient(supabaseUrl, supabaseAnonKey, {
			auth: {
				autoRefreshToken: false,
				persistSession: false
			}
		});

		const { data, error } = await supabase.functions.invoke('hello-env', {
			body: {}
		});

		assert(!error, `Function error: ${error?.message}`);
		assert(data, 'No data returned');

		// 기본 응답 구조 검증
		assertExists(data.message);
		assertEquals(data.status, 'success');
		assertExists(data.summary);
		assertExists(data.variables);
		assertExists(data.timestamp);

		// 요약 정보 검증
		assertEquals(typeof data.summary.total, 'number');
		assertEquals(typeof data.summary.set, 'number');
		assertEquals(typeof data.summary.missing, 'number');
		assert(data.summary.total > 0, 'Total variables should be greater than 0');

		// 환경변수 정보 검증
		const vars = data.variables;

		// Supabase 환경변수는 Edge Function에서 자동으로 설정됨
		assertExists(vars.SUPABASE_URL, 'SUPABASE_URL should be set automatically');

		// 설정되었을 가능성이 높은 환경변수들 확인
		if (vars.GEMINI_API_KEY) {
			assertEquals(vars.GEMINI_API_KEY, '***설정됨***');
		}

		if (vars.SUPABASE_ANON_KEY) {
			assertEquals(vars.SUPABASE_ANON_KEY, '***설정됨***');
		}

		console.log('✅ Hello-env function test passed');
		console.log(`📊 Environment summary: ${data.summary.set}/${data.summary.total} variables set`);

		// 디버깅을 위한 환경변수 목록 출력 (민감한 정보는 마스킹됨)
		console.log('🔍 Environment variables status:');
		Object.entries(vars).forEach(([key, value]) => {
			const status = value !== undefined ? '✅' : '❌';
			console.log(`  ${status} ${key}: ${value || '미설정'}`);
		});
	},
	sanitizeOps: false,
	sanitizeResources: false
});

// Edge Function 환경에서만 사용 가능한 환경변수 테스트 - invoke() 방식 사용
Deno.test({
	name: 'Edge Function Specific Environment',
	async fn() {
		const supabaseUrl = Deno.env.get('PUBLIC_SUPABASE_URL')!;
		const supabaseAnonKey = Deno.env.get('PUBLIC_SUPABASE_ANON_KEY')!;

		const supabase = createClient(supabaseUrl, supabaseAnonKey, {
			auth: {
				autoRefreshToken: false,
				persistSession: false
			}
		});

		const { data, error } = await supabase.functions.invoke('hello-env', {
			body: {}
		});

		assert(!error, `Function error: ${error?.message}`);
		assert(data, 'No data returned');
		const vars = data.variables;

		// Edge Function 환경에서 자동으로 설정되는 변수들
		assertExists(vars.SUPABASE_URL, 'SUPABASE_URL should be automatically available');

		// Deno 배포 환경 변수 확인 (있을 수도 없을 수도 있음)
		if (vars.DENO_DEPLOYMENT_ID) {
			assert(typeof vars.DENO_DEPLOYMENT_ID === 'string', 'DENO_DEPLOYMENT_ID should be string');
			console.log(`🚀 Deployment ID detected: ${vars.DENO_DEPLOYMENT_ID}`);
		} else {
			console.log('ℹ️ No DENO_DEPLOYMENT_ID found (normal for some environments)');
		}

		console.log('✅ Edge Function environment test passed');
	},
	sanitizeOps: false,
	sanitizeResources: false
});
