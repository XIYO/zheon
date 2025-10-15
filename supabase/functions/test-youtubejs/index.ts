import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

Deno.serve(async (req: Request) => {
	if (req.method === 'OPTIONS') {
		return new Response('ok', {
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'POST, OPTIONS',
				'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
			}
		});
	}

	try {
		console.log('[test-youtubejs] 시작');
		const startTime = performance.now();

		// Step 1: 기본 테스트
		console.log('[test-youtubejs] Step 1: 기본 응답 테스트');
		const step1Time = performance.now() - startTime;

		// Step 2: import 테스트
		console.log('[test-youtubejs] Step 2: youtubei.js import 시도');
		const importStart = performance.now();

		const { Innertube } = await import('npm:youtubei.js@latest');

		const importEnd = performance.now();
		const importTime = importEnd - importStart;
		console.log(`[test-youtubejs] import 성공: ${importTime.toFixed(2)}ms`);

		// Step 3: 인스턴스 생성
		console.log('[test-youtubejs] Step 3: Innertube 인스턴스 생성');
		const createStart = performance.now();

		const yt = await Innertube.create({ generate_session_locally: true });

		const createEnd = performance.now();
		const createTime = createEnd - createStart;
		console.log(`[test-youtubejs] 인스턴스 생성 성공: ${createTime.toFixed(2)}ms`);

		const endTime = performance.now();
		const totalTime = endTime - startTime;

		return new Response(
			JSON.stringify({
				success: true,
				test: 'import + create instance',
				timing: {
					step1: `${step1Time.toFixed(2)}ms`,
					import: `${importTime.toFixed(2)}ms`,
					create: `${createTime.toFixed(2)}ms`,
					total: `${totalTime.toFixed(2)}ms`
				},
				message: 'youtubei.js 인스턴스 생성 성공'
			}),
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*'
				}
			}
		);

	} catch (error) {
		console.error('[test-youtubejs] Error:', error);
		return new Response(
			JSON.stringify({
				success: false,
				error: error.message,
				stack: error.stack
			}),
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*'
				}
			}
		);
	}
});
