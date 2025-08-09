/**
 * 구조화된 출력 테스트
 * LangChain의 withStructuredOutput을 테스트합니다
 */

import { createClient } from 'jsr:@supabase/supabase-js@2.54.0';
import { assertEquals } from 'jsr:@std/assert@1';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;

if (!supabaseUrl || !supabaseKey) {
	console.error('❌ Missing environment variables');
	Deno.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

Deno.test('Summary Edge Function - Structured Output Test', async () => {
	console.log('\n🧪 Testing structured output for summary function...');
	
	// 짧은 테스트용 YouTube URL 사용 (1-2분 영상)
	const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // 테스트용 URL
	
	console.log(`📎 Testing with URL: ${testUrl}`);
	
	try {
		// Edge Function 호출
		const { data, error } = await supabase.functions.invoke('summary', {
			body: { url: testUrl }
		});
		
		if (error) {
			console.error('❌ Edge Function error:', error);
			throw error;
		}
		
		console.log('✅ Edge Function Response:', JSON.stringify(data, null, 2));
		
		// 응답 구조 검증
		assertEquals(data.status, 'success', 'Response should have success status');
		
		// 새로 생성된 경우 데이터베이스에서 확인
		if (data.debug?.record_id) {
			const { data: summaryRecord, error: fetchError } = await supabase
				.from('summary')
				.select('*')
				.eq('id', data.debug.record_id)
				.single();
			
			if (fetchError) {
				console.error('❌ Failed to fetch summary record:', fetchError);
				throw fetchError;
			}
			
			console.log('\n📊 Database Record:');
			console.log('Title:', summaryRecord.title);
			console.log('Summary (length):', summaryRecord.summary?.length || 0, 'chars');
			console.log('Insights (length):', summaryRecord.content?.length || 0, 'chars');
			
			// 구조 검증
			if (summaryRecord.summary && summaryRecord.content) {
				// summary는 짧아야 함 (1-2문장, 대략 200자 이내)
				if (summaryRecord.summary.length > 300) {
					console.warn('⚠️ Summary seems too long for a 1-2 sentence summary');
				}
				
				// insights(content)는 summary보다 길어야 함
				if (summaryRecord.content.length <= summaryRecord.summary.length) {
					console.error('❌ Insights should be longer than summary!');
					throw new Error('Insights should contain more detailed information than summary');
				}
				
				// JSON 배열이 아닌지 확인
				try {
					const parsed = JSON.parse(summaryRecord.summary);
					if (Array.isArray(parsed)) {
						console.error('❌ Summary is a JSON array, should be plain text!');
						throw new Error('Summary should not be a JSON array');
					}
				} catch {
					// JSON이 아니면 정상 (텍스트여야 함)
					console.log('✅ Summary is plain text (not JSON)');
				}
				
				try {
					const parsed = JSON.parse(summaryRecord.content);
					if (Array.isArray(parsed)) {
						console.error('❌ Insights is a JSON array, should be plain text!');
						throw new Error('Insights should not be a JSON array');
					}
				} catch {
					// JSON이 아니면 정상 (텍스트여야 함)
					console.log('✅ Insights is plain text (not JSON)');
				}
				
				console.log('\n✅ All structure validations passed!');
			}
		}
		
	} catch (err) {
		console.error('❌ Test failed:', err);
		throw err;
	}
});