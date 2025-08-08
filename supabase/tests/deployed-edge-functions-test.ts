import { assert, assertEquals, assertExists } from 'jsr:@std/assert';
import { createClient } from 'jsr:@supabase/supabase-js@2';

// 배포된 Edge Functions 테스트 - invoke() 방식 사용 (공식 권장)
// 환경변수에서 설정 로드
const SUPABASE_URL = Deno.env.get('PUBLIC_SUPABASE_URL') || Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY =
	Deno.env.get('PUBLIC_SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_ANON_KEY');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
	throw new Error(
		'Environment variables required: PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_URL and SUPABASE_ANON_KEY)'
	);
}

console.log(`🔧 Testing against: ${SUPABASE_URL}`);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
	auth: {
		autoRefreshToken: false,
		persistSession: false
	}
});

Deno.test('Deployed Edge Function - Complete Environment Variables', async () => {
	console.log('🚀 Testing ALL production environment variables...');

	const { data, error } = await supabase.functions.invoke('hello-env', {
		body: {}
	});

	assert(!error, `Function error: ${error?.message}`);
	assert(data, 'No data returned');
	assertEquals(data.status, 'success');
	assertEquals(data.message, 'Environment Variables Check');

	// 모든 환경변수가 설정되었는지 확인
	assertEquals(data.summary.total, 9, 'Should have 9 total environment variables');
	assertEquals(data.summary.set, 9, 'All 9 environment variables should be set');
	assertEquals(data.summary.missing, 0, 'No environment variables should be missing');

	const vars = data.variables;

	// Supabase 자동 환경변수
	assertEquals(vars.SUPABASE_URL, 'https://iefgdhwmgljjacafqomd.supabase.co');
	assertEquals(vars.SUPABASE_ANON_KEY, '***설정됨***');
	assertEquals(vars.SUPABASE_SERVICE_ROLE_KEY, '***설정됨***');
	assertEquals(vars.SUPABASE_DB_URL, '***설정됨***');

	// API Keys
	assertEquals(vars.GEMINI_API_KEY, '***설정됨***');
	assertEquals(vars.OPENAI_API_KEY, '***설정됨***');
	assertEquals(vars.ANTHROPIC_API_KEY, '***설정됨***');

	// 기타 환경변수
	assertEquals(vars.EXTRACT_API_URL, 'https://extractor.xiyo.dev/extract');
	assertExists(vars.DENO_DEPLOYMENT_ID, 'Deployment ID should exist');
	assert(
		vars.DENO_DEPLOYMENT_ID.includes('iefgdhwmgljjacafqomd'),
		'Deployment ID should contain project ref'
	);

	console.log('✅ All production environment variables properly configured!');
	console.log(`📊 Perfect score: ${data.summary.set}/${data.summary.total} variables set`);
});

Deno.test('Deployed Edge Function - Security Validation', async () => {
	console.log('🔒 Testing environment variable security...');

	const { data, error } = await supabase.functions.invoke('hello-env', {
		body: {}
	});

	assert(!error, `Function error: ${error?.message}`);
	assert(data, 'No data returned');
	const vars = data.variables;

	// API 키들이 마스킹되어 있는지 확인
	const apiKeys = [
		'SUPABASE_ANON_KEY',
		'SUPABASE_SERVICE_ROLE_KEY',
		'GEMINI_API_KEY',
		'OPENAI_API_KEY',
		'ANTHROPIC_API_KEY',
		'SUPABASE_DB_URL'
	];

	apiKeys.forEach((key) => {
		if (vars[key]) {
			assertEquals(vars[key], '***설정됨***', `${key} should be masked for security`);
		}
	});

	// 공개 정보는 그대로 표시되는지 확인
	assertExists(vars.SUPABASE_URL, 'SUPABASE_URL should be visible');
	assertExists(vars.EXTRACT_API_URL, 'EXTRACT_API_URL should be visible');
	assertExists(vars.DENO_DEPLOYMENT_ID, 'DENO_DEPLOYMENT_ID should be visible');

	console.log('✅ Environment variable security properly implemented!');
});

Deno.test('Deployed Edge Function - Performance & Reliability', async () => {
	console.log('⚡ Testing production function performance...');

	const startTime = Date.now();

	const { data, error } = await supabase.functions.invoke('hello-env', {
		body: {}
	});

	const endTime = Date.now();
	const responseTime = endTime - startTime;

	assert(!error, `Function error: ${error?.message}`);
	assert(data, 'No data returned');

	// 성능 검증
	assert(responseTime < 3000, `Response time too slow: ${responseTime}ms (should be <3s)`);
	assertEquals(data.status, 'success');

	// 타임스탬프가 최근인지 확인 (5분 이내)
	const timestamp = new Date(data.timestamp);
	const now = new Date();
	const timeDiff = now.getTime() - timestamp.getTime();
	assert(timeDiff < 5 * 60 * 1000, 'Timestamp should be within last 5 minutes');

	console.log(`✅ Production function performance excellent: ${responseTime}ms`);
});

Deno.test('Deployed Edge Function - Function Consistency', async () => {
	console.log('🔄 Testing function consistency...');

	// 첫 번째 호출
	const { data: firstData, error: firstError } = await supabase.functions.invoke('hello-env', {
		body: {}
	});

	assert(!firstError, `First request failed: ${firstError?.message}`);
	assert(firstData, 'No first data returned');

	// 두 번째 호출
	const { data: secondData, error: secondError } = await supabase.functions.invoke('hello-env', {
		body: {}
	});

	assert(!secondError, `Second request failed: ${secondError?.message}`);
	assert(secondData, 'No second data returned');

	// 두 호출 모두 일관된 결과를 반환하는지 확인
	assertEquals(firstData.status, secondData.status);
	assertEquals(firstData.message, secondData.message);
	assertEquals(firstData.summary.total, secondData.summary.total);
	assertEquals(firstData.summary.set, secondData.summary.set);
	assertEquals(firstData.summary.missing, secondData.summary.missing);

	// 환경변수 값들도 동일한지 확인
	Object.keys(firstData.variables).forEach((key) => {
		assertEquals(
			firstData.variables[key],
			secondData.variables[key],
			`Variable ${key} should be consistent between calls`
		);
	});

	console.log('✅ Function calls return consistent results!');
});

Deno.test('Deployed Edge Function - Hello Function Integration', async () => {
	console.log('🤝 Testing hello function integration...');

	const { data, error } = await supabase.functions.invoke('hello', {
		body: { name: 'Deployed Test' }
	});

	assert(!error, `Function error: ${error?.message}`);
	assert(data, 'No data returned');
	assertEquals(data.message, 'Hello Deployed Test!');

	console.log('✅ Hello function integration working perfectly!');
});
