import { createClient } from 'jsr:@supabase/supabase-js@2';
import 'jsr:@std/dotenv/load';

// 간단한 summary 함수 테스트
Deno.test('Simple Summary Test', async () => {
	const supabase = createClient(
		Deno.env.get('PUBLIC_SUPABASE_URL')!,
		Deno.env.get('PUBLIC_SUPABASE_ANON_KEY')!
	);

	console.log('🧪 Testing summary function with simple YouTube URL...');

	try {
		const { data, error } = await supabase.functions.invoke('summary', {
			body: {
				url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' // Rick Astley - Never Gonna Give You Up
			}
		});

		if (error) {
			console.error('❌ Error:', error);
			console.error('Error context:', error.context);

			// HTTP 응답 본문 읽기
			if (error.context && error.context.json) {
				const errorBody = await error.context.json();
				console.error('Error body:', JSON.stringify(errorBody, null, 2));
			}
		} else {
			console.log('✅ Success:', JSON.stringify(data, null, 2));
		}
	} catch (e) {
		console.error('🚨 Exception:', e);
	}
});
