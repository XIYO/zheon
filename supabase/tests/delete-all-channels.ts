/**
 * Delete all channels from recommended_channels table
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = 'https://iefgdhwmgljjacafqomd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllZmdkaHdtZ2xqamFjYWZxb21kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4Mzc5NTcsImV4cCI6MjA2MzQxMzk1N30.VxInMB0yHya_AAGifZXmVWFkGDgxGFZx94F_GBURzsQ';

const supabase = createClient(supabaseUrl, supabaseKey);

// 모든 채널 조회
console.log('현재 등록된 채널 조회 중...\n');
const { data: channels, error: selectError } = await supabase
	.from('recommended_channels')
	.select('*');

if (selectError) {
	console.error('조회 실패:', selectError);
	Deno.exit(1);
}

const channelCount = channels?.length || 0;
console.log(`총 ${channelCount}개의 채널이 등록되어 있습니다:\n`);
if (channels) {
	channels.forEach((ch: any, idx: number) => {
		console.log(`${idx + 1}. ${ch.name} (${ch.handle})`);
	});
}

// 전체 삭제
console.log('\n모든 채널을 삭제합니다...');
const { error: deleteError } = await supabase
	.from('recommended_channels')
	.delete()
	.neq('id', ''); // 모든 레코드 삭제

if (deleteError) {
	console.error('삭제 실패:', deleteError);
	Deno.exit(1);
}

console.log('\n✅ 모든 채널이 삭제되었습니다!');

// 확인
const { data: afterChannels } = await supabase
	.from('recommended_channels')
	.select('*');

const afterCount = afterChannels?.length || 0;
console.log(`\n현재 등록된 채널 수: ${afterCount}개`);
