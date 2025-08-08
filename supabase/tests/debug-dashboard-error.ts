import { assert, assertEquals } from 'jsr:@std/assert@1';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import 'jsr:@std/dotenv/load';

/**
 * Dashboard에서 발생한 500 에러 디버깅
 */
Deno.test(
	'Debug Dashboard 500 Error',
	{
		sanitizeResources: false,
		sanitizeOps: false
	},
	async () => {
		const supabase = createClient(
			Deno.env.get('PUBLIC_SUPABASE_URL')!,
			Deno.env.get('PUBLIC_SUPABASE_ANON_KEY')!
		);

		console.log('🐛 Debugging Dashboard 500 error...');

		// Dashboard에서 실패한 동일한 URL 테스트
		const testUrl = 'https://www.youtube.com/watch?v=ZDduqnTf33Q';

		try {
			console.log(`📡 Testing URL that caused 500 error: ${testUrl}`);

			const { data, error } = await supabase.functions.invoke('summary', {
				body: { url: testUrl }
			});

			if (error) {
				console.error('❌ Edge Function error details:');
				console.error('Error:', error);

				// 에러 컨텍스트에서 세부 정보 추출
				if (error.context) {
					try {
						const errorText = await error.context.text();
						console.error('Error response body:', errorText);

						// JSON 파싱 시도
						try {
							const errorJson = JSON.parse(errorText);
							console.error('Parsed error JSON:', errorJson);
						} catch {
							console.error('Could not parse error as JSON');
						}
					} catch (contextError) {
						console.error('Could not read error context:', contextError);
					}
				}

				throw new Error(`Edge Function failed: ${error.message}`);
			}

			console.log('✅ Success! Data:', JSON.stringify(data, null, 2));
		} catch (testError) {
			console.error('🚨 Test error:', testError);

			// 다른 URL로 테스트해보기
			console.log('\n🔄 Trying with a different URL...');
			const alternativeUrl = 'https://youtu.be/K2lvjqvpajc';

			try {
				const { data: altData, error: altError } = await supabase.functions.invoke('summary', {
					body: { url: alternativeUrl }
				});

				if (altError) {
					console.error('❌ Alternative URL also failed:', altError);
				} else {
					console.log('✅ Alternative URL worked:', JSON.stringify(altData, null, 2));
					console.log('🤔 Issue might be specific to the original URL');
				}
			} catch (altTestError) {
				console.error('❌ Alternative URL test failed:', altTestError);
			}

			throw testError;
		}
	}
);
